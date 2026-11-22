/**
 * Server-only Travelpayouts (Aviasales) Data API client.
 *
 * The token is read from TRAVELPAYOUTS_TOKEN at request time and sent only
 * from the server (X-Access-Token header). It must never be exposed through a
 * NEXT_PUBLIC_ variable or returned to the browser.
 *
 * Endpoints:
 *  - /aviasales/v3/prices_for_dates  cheapest recent fares for a date (+ link)
 *    (also used per month for the cheapest-fare-per-day calendar)
 * Both serve cached prices that real travellers found recently; they are not
 * a live seat check, and the UI labels them that way.
 */
import type { CalendarDay, LiveFare } from './types';

const API_BASE = 'https://api.travelpayouts.com';
export const BOOKING_HOST = 'https://www.aviasales.com';
const REQUEST_TIMEOUT_MS = 8000;
/** Upstream cache window; cached fares change slowly. */
export const REVALIDATE_SECONDS = 600;

export interface TravelpayoutsConfig {
  token?: string;
  marker?: string;
  market?: string;
}

export function getConfig(env: Record<string, string | undefined> = process.env): TravelpayoutsConfig {
  const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    token: clean(env.TRAVELPAYOUTS_TOKEN),
    marker: clean(env.TRAVELPAYOUTS_MARKER),
    market: clean(env.TRAVELPAYOUTS_MARKET),
  };
}

// ---------------------------------------------------------------- validation

const IATA = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string) {
  if (!DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export interface FareQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  /** Optional data-market override (two letters, e.g. "in") */
  market?: string;
}

const MARKET = /^[a-z]{2}$/;
function parseMarket(params: URLSearchParams): string | undefined | null {
  const raw = params.get('market');
  if (raw === null || raw === '') return undefined;
  return MARKET.test(raw) ? raw : null;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseFareQuery(params: URLSearchParams, today = new Date()): Parsed<FareQuery> {
  const origin = (params.get('origin') ?? '').trim().toUpperCase();
  const destination = (params.get('destination') ?? '').trim().toUpperCase();
  const departureDate = (params.get('departure_date') ?? '').trim();
  const returnRaw = (params.get('return_date') ?? '').trim();

  if (!IATA.test(origin)) return { ok: false, error: 'origin must be a 3-letter IATA code' };
  if (!IATA.test(destination)) return { ok: false, error: 'destination must be a 3-letter IATA code' };
  if (origin === destination) return { ok: false, error: 'origin and destination must differ' };
  if (!isRealDate(departureDate)) return { ok: false, error: 'departure_date must be YYYY-MM-DD' };

  // Allow "today" in any time zone: compare against yesterday in UTC
  const yesterday = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (departureDate < yesterday) return { ok: false, error: 'departure_date is in the past' };

  if (returnRaw) {
    if (!isRealDate(returnRaw)) return { ok: false, error: 'return_date must be YYYY-MM-DD' };
    if (returnRaw < departureDate) return { ok: false, error: 'return_date must be on or after departure_date' };
  }
  const market = parseMarket(params);
  if (market === null) return { ok: false, error: 'market must be two lowercase letters' };
  return { ok: true, value: { origin, destination, departureDate, returnDate: returnRaw || undefined, market } };
}

export interface CalendarQuery {
  origin: string;
  destination: string;
  start: string;
  days: number;
  market?: string;
}

export function parseCalendarQuery(params: URLSearchParams): Parsed<CalendarQuery> {
  const origin = (params.get('origin') ?? '').trim().toUpperCase();
  const destination = (params.get('destination') ?? '').trim().toUpperCase();
  const start = (params.get('start') ?? '').trim();
  const days = Number(params.get('days') ?? '7');
  if (!IATA.test(origin) || !IATA.test(destination) || origin === destination) {
    return { ok: false, error: 'origin and destination must be different 3-letter IATA codes' };
  }
  if (!isRealDate(start)) return { ok: false, error: 'start must be YYYY-MM-DD' };
  if (!Number.isInteger(days) || days < 1 || days > 14) return { ok: false, error: 'days must be 1–14' };
  const market = parseMarket(params);
  if (market === null) return { ok: false, error: 'market must be two lowercase letters' };
  return { ok: true, value: { origin, destination, start, days, market } };
}

// ---------------------------------------------------------------- links

const ALLOWED_BOOKING_HOSTS = /(^|\.)aviasales\.[a-z.]+$/i;

/**
 * Turns the source's relative `link` into an absolute booking URL on the
 * Aviasales domain (adding the affiliate marker). Any absolute URL to another
 * host is rejected so the API can never become an open redirect.
 */
export function buildBookingUrl(link: unknown, marker?: string): string | null {
  if (typeof link !== 'string' || !link.trim()) return null;
  let url: URL;
  try {
    url = new URL(link.trim(), BOOKING_HOST);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !ALLOWED_BOOKING_HOSTS.test(url.hostname)) return null;
  if (marker) url.searchParams.set('marker', marker);
  return url.toString();
}

/** Aviasales search deep link (DEL1412BOM1 = DEL, 14 Dec, BOM, 1 adult). */
export function searchDeepLink(origin: string, destination: string, departureDate: string, marker?: string, returnDate?: string) {
  const ddmm = (iso: string) => `${iso.slice(8, 10)}${iso.slice(5, 7)}`;
  const path = `/search/${origin}${ddmm(departureDate)}${destination}${returnDate ? ddmm(returnDate) : ''}1`;
  return buildBookingUrl(path, marker) as string;
}

// ---------------------------------------------------------------- normalisers

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

/**
 * Normalises a prices_for_dates payload. Items missing a usable price or
 * departure time are dropped; duplicates keep the cheapest; sorted by price.
 */
export function normalizePricesForDates(
  json: unknown,
  ctx: { origin: string; destination: string; departureDate: string; returnDate?: string; marker?: string }
): LiveFare[] {
  assertInr(json);
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];

  const byId = new Map<string, LiveFare>();
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;

    const price = num(item.price ?? item.value);
    const departureAt = str(item.departure_at ?? item.depart_date);
    if (!price || price <= 0 || !departureAt || Number.isNaN(Date.parse(departureAt))) continue;

    const airlineCode = str(item.airline).toUpperCase();
    const flightNo = str(item.flight_number);
    const duration = num(item.duration_to) ?? num(item.duration);
    const transfers = Math.max(0, num(item.transfers ?? item.number_of_changes) ?? 0);
    const origin = str(item.origin) || ctx.origin;
    const destination = str(item.destination) || ctx.destination;

    const fare: LiveFare = {
      id: `${airlineCode || 'XX'}-${flightNo || '0'}-${departureAt}`,
      origin,
      destination,
      originAirport: str(item.origin_airport) || undefined,
      destinationAirport: str(item.destination_airport) || undefined,
      airlineCode,
      flightNumber: airlineCode && flightNo ? `${airlineCode} ${flightNo}` : '',
      departureAt,
      returnAt: str(item.return_at) || undefined,
      // The source's duration excludes layovers on connecting itineraries
      // (verified against live data), so it is only trusted for non-stops.
      durationMinutes: transfers === 0 && duration && duration > 0 ? Math.round(duration) : null,
      transfers,
      priceInr: Math.round(price),
      bookingUrl:
        buildBookingUrl(item.link, ctx.marker) ??
        searchDeepLink(
          origin,
          destination,
          DATE.test(departureAt.slice(0, 10)) ? departureAt.slice(0, 10) : ctx.departureDate,
          ctx.marker,
          ctx.returnDate
        ),
      foundAt: str(item.found_at) || undefined,
      expiresAt: str(item.expires_at) || undefined,
    };

    const existing = byId.get(fare.id);
    if (!existing || fare.priceInr < existing.priceInr) byId.set(fare.id, fare);
  }
  return Array.from(byId.values()).sort((a, b) => a.priceInr - b.priceInr);
}

/** Prices are requested in INR; refuse to show anything else as rupees. */
export function assertInr(json: unknown) {
  const currency = (json as { currency?: unknown })?.currency;
  if (typeof currency === 'string' && currency.toLowerCase() !== 'inr') {
    throw new UpstreamError(`Unexpected currency "${currency}"`, 502);
  }
}

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Normalises calendar payloads into one entry per requested day. Accepts the
 * documented v1 shape (data keyed by "YYYY-MM-DD") and the v2 array shape
 * (items with depart_date + value), keeping the cheapest per day.
 */
export function normalizeCalendar(jsons: unknown[], start: string, days: number): CalendarDay[] {
  const cheapest = new Map<string, number>();
  const consider = (date: string, price: number | null) => {
    if (!DATE.test(date) || !price || price <= 0) return;
    const prev = cheapest.get(date);
    if (prev === undefined || price < prev) cheapest.set(date, Math.round(price));
  };

  for (const json of jsons) {
    assertInr(json);
    const data = (json as { data?: unknown })?.data;
    if (Array.isArray(data)) {
      for (const item of data as Record<string, unknown>[]) {
        // v3 items carry departure_at (local ISO); v2 items carry depart_date
        const date = str(item?.departure_at ?? item?.depart_date).slice(0, 10);
        consider(date, num(item?.price ?? item?.value));
      }
    } else if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const v = value as Record<string, unknown>;
        consider(key.slice(0, 10), num(v?.price ?? v?.value));
      }
    }
  }

  return Array.from({ length: days }, (_, i) => {
    const dateISO = addDays(start, i);
    return { dateISO, priceInr: cheapest.get(dateISO) ?? null };
  });
}

// ---------------------------------------------------------------- requests

export class UpstreamError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function getJson(path: string, params: Record<string, string>, token: string, fetchImpl: typeof fetch) {
  const url = new URL(path, API_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetchImpl(url.toString(), {
    headers: { 'X-Access-Token': token, Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    // Next.js data cache: identical upstream queries are reused for 10 minutes
    next: { revalidate: REVALIDATE_SECONDS },
  } as RequestInit);

  if (!res.ok) throw new UpstreamError(`Travelpayouts responded ${res.status}`, res.status);
  const json = (await res.json()) as { success?: boolean; error?: unknown };
  if (json && json.success === false) {
    throw new UpstreamError(`Travelpayouts error: ${String(json.error ?? 'unknown')}`, 502);
  }
  return json;
}

export async function searchFares(
  q: FareQuery,
  cfg: TravelpayoutsConfig,
  fetchImpl: typeof fetch = fetch
): Promise<LiveFare[]> {
  if (!cfg.token) throw new UpstreamError('Missing token', 500);
  const params: Record<string, string> = {
    origin: q.origin,
    destination: q.destination,
    departure_at: q.departureDate,
    one_way: q.returnDate ? 'false' : 'true',
    direct: 'false',
    sorting: 'price',
    unique: 'false',
    currency: 'inr',
    limit: '30',
    page: '1',
  };
  if (q.returnDate) params.return_at = q.returnDate;
  const market = q.market ?? cfg.market;
  if (market) params.market = market;

  // The cache keeps the cheapest ticket per date, so also ask for the
  // cheapest non-stop to give travellers a real choice. Only the main query
  // is required; a failed non-stop query just means one fewer option.
  const ctx = { ...q, marker: cfg.marker };
  const [main, direct] = await Promise.allSettled([
    getJson('/aviasales/v3/prices_for_dates', params, cfg.token, fetchImpl),
    getJson('/aviasales/v3/prices_for_dates', { ...params, direct: 'true' }, cfg.token, fetchImpl),
  ]);
  if (main.status === 'rejected') throw main.reason;

  const merged = new Map<string, LiveFare>();
  const lists = [normalizePricesForDates(main.value, ctx)];
  if (direct.status === 'fulfilled') {
    try {
      lists.push(normalizePricesForDates(direct.value, ctx));
    } catch {
      /* ignore an unusable non-stop response */
    }
  }
  for (const fare of lists.flat()) {
    const prev = merged.get(fare.id);
    if (!prev || fare.priceInr < prev.priceInr) merged.set(fare.id, fare);
  }
  return Array.from(merged.values()).sort((a, b) => a.priceInr - b.priceInr);
}

export async function fetchCalendar(
  q: CalendarQuery,
  cfg: TravelpayoutsConfig,
  fetchImpl: typeof fetch = fetch
): Promise<CalendarDay[]> {
  if (!cfg.token) throw new UpstreamError('Missing token', 500);
  // The window may span two months; the calendar endpoint is per month.
  const months = Array.from(new Set([q.start.slice(0, 7), addDays(q.start, q.days - 1).slice(0, 7)]));
  const jsons = await Promise.all(
    months.map((month) =>
      // Same endpoint and currency as search, so the strip and the results
      // always agree; a month query returns the cheapest fare per day.
      getJson(
        '/aviasales/v3/prices_for_dates',
        {
          origin: q.origin,
          destination: q.destination,
          departure_at: month,
          one_way: 'true',
          direct: 'false',
          sorting: 'price',
          unique: 'false',
          currency: 'inr',
          limit: '1000',
          page: '1',
          ...((q.market ?? cfg.market) ? { market: (q.market ?? cfg.market) as string } : {}),
        },
        cfg.token as string,
        fetchImpl
      )
    )
  );
  return normalizeCalendar(jsons, q.start, q.days);
}

/**
 * When the exact day has no cached fares, finds the closest days (within
 * ±windowDays, never in the past) that do, cheapest fare per day. One-way only.
 */
export async function searchNearbyFares(
  q: FareQuery,
  cfg: TravelpayoutsConfig,
  fetchImpl: typeof fetch = fetch,
  windowDays = 14,
  maxDays = 3,
  today = new Date().toISOString().slice(0, 10)
): Promise<LiveFare[]> {
  if (!cfg.token || q.returnDate) return [];
  const from = addDays(q.departureDate, -windowDays);
  const to = addDays(q.departureDate, windowDays);
  const months = Array.from(new Set([from.slice(0, 7), q.departureDate.slice(0, 7), to.slice(0, 7)]));
  const market = q.market ?? cfg.market;

  const jsons = await Promise.all(
    months.map((month) =>
      getJson(
        '/aviasales/v3/prices_for_dates',
        {
          origin: q.origin,
          destination: q.destination,
          departure_at: month,
          one_way: 'true',
          direct: 'false',
          sorting: 'price',
          unique: 'false',
          currency: 'inr',
          limit: '1000',
          page: '1',
          ...(market ? { market } : {}),
        },
        cfg.token as string,
        fetchImpl
      )
    )
  );

  const ctx = { ...q, marker: cfg.marker };
  const dayDiff = (d: string) =>
    Math.abs(Date.parse(`${d}T00:00:00Z`) - Date.parse(`${q.departureDate}T00:00:00Z`)) / 86_400_000;

  const cheapestPerDay = new Map<string, LiveFare>();
  for (const fare of jsons.flatMap((j) => normalizePricesForDates(j, ctx))) {
    const day = fare.departureAt.slice(0, 10);
    if (day === q.departureDate || day < today || dayDiff(day) > windowDays) continue;
    const prev = cheapestPerDay.get(day);
    if (!prev || fare.priceInr < prev.priceInr) cheapestPerDay.set(day, fare);
  }

  return Array.from(cheapestPerDay.values())
    .sort((a, b) => dayDiff(a.departureAt.slice(0, 10)) - dayDiff(b.departureAt.slice(0, 10)) || a.priceInr - b.priceInr)
    .slice(0, maxDays);
}

/** User-facing explanation of an upstream failure (never includes secrets). */
export function friendlyError(err: unknown): string {
  if (err instanceof UpstreamError && (err.status === 401 || err.status === 403)) {
    return 'The live fare source rejected our access key.';
  }
  if (err instanceof UpstreamError && err.status === 429) {
    return 'The live fare source is rate-limiting us. Try again in a minute.';
  }
  if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return 'The live fare source took too long to answer.';
  }
  return 'The live fare source is unavailable right now.';
}
