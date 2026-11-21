import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildBookingUrl,
  getConfig,
  normalizeCalendar,
  normalizePricesForDates,
  parseCalendarQuery,
  parseFareQuery,
  searchDeepLink,
} from '../lib/fares/travelpayouts';
import { liveFareToItinerary, wallClockISO } from '../lib/fares/toItinerary';
import { GET as faresGET } from '../app/api/fares/route';
import { GET as calendarGET } from '../app/api/fares/calendar/route';

// Synthetic payload in the prices_for_dates format
const SAMPLE = {
  success: true,
  currency: 'inr',
  data: [
    {
      origin: 'DEL',
      destination: 'BOM',
      origin_airport: 'DEL',
      destination_airport: 'BOM',
      price: 5120,
      airline: '6E',
      flight_number: '2041',
      departure_at: '2026-12-14T06:15:00+05:30',
      transfers: 0,
      duration_to: 130,
      link: '/search/DEL1412BOM1?t=abc',
    },
    {
      origin: 'DEL',
      destination: 'BOM',
      price: 4890,
      airline: 'QP',
      flight_number: 1101,
      departure_at: '2026-12-14T22:30:00+05:30',
      transfers: 1,
      duration: 300,
      link: 'https://evil.example.com/phish',
    },
    // duplicate of the first, more expensive → dropped
    { ...{ price: 6000, airline: '6E', flight_number: '2041', departure_at: '2026-12-14T06:15:00+05:30' } },
    // unusable rows → dropped
    { price: 0, departure_at: '2026-12-14T10:00:00+05:30' },
    { price: 3000 },
    'garbage',
  ],
};

const CTX = { origin: 'DEL', destination: 'BOM', departureDate: '2026-12-14', marker: '12345' };

describe('normalizePricesForDates', () => {
  const fares = normalizePricesForDates(SAMPLE, CTX);

  it('keeps valid rows, dedupes by flight and sorts by price', () => {
    expect(fares.map((f) => f.priceInr)).toEqual([4890, 5120]);
  });

  it('maps fields and builds a marked Aviasales booking link', () => {
    const f = fares.find((x) => x.airlineCode === '6E')!;
    expect(f.flightNumber).toBe('6E 2041');
    expect(f.durationMinutes).toBe(130);
    expect(f.transfers).toBe(0);
    expect(f.bookingUrl).toBe('https://www.aviasales.com/search/DEL1412BOM1?t=abc&marker=12345');
  });

  it('never links to a non-Aviasales host (falls back to a search deep link)', () => {
    const f = fares.find((x) => x.airlineCode === 'QP')!;
    expect(f.bookingUrl).toBe('https://www.aviasales.com/search/DEL1412BOM1?marker=12345');
    expect(f.durationMinutes).toBe(300);
  });

  it('returns [] for unexpected payloads', () => {
    expect(normalizePricesForDates(null, CTX)).toEqual([]);
    expect(normalizePricesForDates({ data: {} }, CTX)).toEqual([]);
  });
});

describe('booking links', () => {
  it('rejects other hosts, non-https and non-strings', () => {
    expect(buildBookingUrl('https://example.com/x')).toBeNull();
    expect(buildBookingUrl('http://www.aviasales.com/x')).toBeNull();
    expect(buildBookingUrl(42)).toBeNull();
  });

  it('builds round-trip deep links', () => {
    expect(searchDeepLink('DEL', 'GOI', '2026-12-14', undefined, '2026-12-21')).toBe(
      'https://www.aviasales.com/search/DEL1412GOI21121'
    );
  });
});

describe('normalizeCalendar', () => {
  it('reads the documented v1 shape (keyed by date) and fills gaps with null', () => {
    const days = normalizeCalendar(
      [{ success: true, data: { '2026-12-11': { price: 4790 }, '2026-12-13': { price: 5120 } } }],
      '2026-12-11',
      4
    );
    expect(days).toEqual([
      { dateISO: '2026-12-11', priceInr: 4790 },
      { dateISO: '2026-12-12', priceInr: null },
      { dateISO: '2026-12-13', priceInr: 5120 },
      { dateISO: '2026-12-14', priceInr: null },
    ]);
  });

  it('reads the v2 array shape and keeps the cheapest per day across months', () => {
    const days = normalizeCalendar(
      [
        { data: [{ depart_date: '2026-12-31', value: 7000 }, { depart_date: '2026-12-31', value: 6500 }] },
        { data: [{ depart_date: '2027-01-01', value: 5000 }] },
      ],
      '2026-12-31',
      2
    );
    expect(days).toEqual([
      { dateISO: '2026-12-31', priceInr: 6500 },
      { dateISO: '2027-01-01', priceInr: 5000 },
    ]);
  });
});

describe('query validation', () => {
  const today = new Date('2026-11-21T12:00:00Z');
  const q = (s: string) => parseFareQuery(new URLSearchParams(s), today);

  it('accepts a valid one-way and round-trip query', () => {
    expect(q('origin=del&destination=bom&departure_date=2026-12-14')).toMatchObject({ ok: true });
    expect(q('origin=DEL&destination=BOM&departure_date=2026-12-14&return_date=2026-12-21')).toMatchObject({
      ok: true,
      value: { returnDate: '2026-12-21' },
    });
  });

  it.each([
    'origin=DELHI&destination=BOM&departure_date=2026-12-14',
    'origin=DEL&destination=DEL&departure_date=2026-12-14',
    'origin=DEL&destination=BOM&departure_date=2026-02-30',
    'origin=DEL&destination=BOM&departure_date=2025-01-01',
    'origin=DEL&destination=BOM&departure_date=2026-12-14&return_date=2026-12-10',
    'origin=DEL&destination=BOM',
  ])('rejects %s', (s) => {
    expect(q(s).ok).toBe(false);
  });

  it('validates calendar windows', () => {
    expect(parseCalendarQuery(new URLSearchParams('origin=DEL&destination=BOM&start=2026-12-11&days=7')).ok).toBe(true);
    expect(parseCalendarQuery(new URLSearchParams('origin=DEL&destination=BOM&start=2026-12-11&days=40')).ok).toBe(false);
  });
});

describe('liveFareToItinerary', () => {
  const [cheap, direct] = normalizePricesForDates(SAMPLE, CTX);

  it('shows local times in the airport time zone and computes arrival', () => {
    const it6E = liveFareToItinerary(direct, false);
    expect(it6E.segments[0].departureISO).toBe('2026-12-14T06:15:00Z'); // 06:15 IST wall clock
    expect(it6E.segments[0].arrivalISO).toBe('2026-12-14T08:25:00Z');
    expect(it6E.segments[0].airlineName).toBe('IndiGo');
    expect(it6E.live?.bookingUrl).toContain('aviasales.com');
    expect(it6E.fareTiers[0].priceInr).toBe(5120);
  });

  it('crosses midnight and time zones correctly (DEL 22:30 → DXB)', () => {
    const fare = { ...cheap, destination: 'DXB', destinationAirport: 'DXB', durationMinutes: 240 };
    const it = liveFareToItinerary(fare, true);
    // 22:30 IST + 4h = 02:30 IST = 01:00 in Dubai (UTC+4), next day
    expect(it.segments[0].arrivalISO).toBe('2026-12-15T01:00:00Z');
    expect(it.live?.roundTrip).toBe(true);
    expect(it.stops).toBe(1);
  });

  it('leaves arrival unknown for airports without a time zone', () => {
    const fare = { ...cheap, destination: 'XYZ', destinationAirport: 'XYZ' };
    expect(liveFareToItinerary(fare, false).segments[0].arrivalISO).toBe('');
  });

  it('wallClockISO formats in the requested zone', () => {
    expect(wallClockISO(Date.parse('2026-06-01T12:00:00Z'), 'Europe/London')).toBe('2026-06-01T13:00:00Z');
  });
});

describe('API routes', () => {
  const env = { ...process.env };
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  const req = (path: string) => new Request(`http://localhost${path}`);
  const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  it('reports "unconfigured" (not an error) when no token is set', async () => {
    delete process.env.TRAVELPAYOUTS_TOKEN;
    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'unconfigured', fares: [] });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects invalid input with 400', async () => {
    const res = await faresGET(req('/api/fares?origin=DEL&destination=BOM&departure_date=bad'));
    expect(res.status).toBe(400);
  });

  it('returns normalised live fares and never leaks the token', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 'secret-token-123';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(SAMPLE), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).not.toContain('secret-token-123');
    const body = JSON.parse(text);
    expect(body.status).toBe('live');
    expect(body.fares).toHaveLength(2);

    // Token travels only in the upstream request header, not the URL
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/aviasales/v3/prices_for_dates');
    expect(url).not.toContain('secret-token-123');
    expect((init.headers as Record<string, string>)['X-Access-Token']).toBe('secret-token-123');
  });

  it('maps an upstream 401 to a friendly 502 error', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 'bad';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ status: 'error', message: 'The live fare source rejected our access key.' });
  });

  it('calendar route fetches each month in the window', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 't';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await calendarGET(req('/api/fares/calendar?origin=DEL&destination=BOM&start=2026-12-29&days=7'));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2); // December + January
    expect((await res.json()).days).toHaveLength(7);
  });

  it('getConfig ignores blank values', () => {
    expect(getConfig({ TRAVELPAYOUTS_TOKEN: '  ', TRAVELPAYOUTS_MARKER: 'm' })).toEqual({
      token: undefined,
      marker: 'm',
      market: undefined,
    });
  });
});
