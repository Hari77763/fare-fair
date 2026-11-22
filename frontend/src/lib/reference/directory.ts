/**
 * Server-side airport & airline directory.
 *
 * Built from OurAirports (public domain) and OpenFlights (ODbL) by
 * scripts/build-reference-data.mjs. Hand-curated entries in data/airports.ts
 * and lib/fares/airlines.ts take precedence (friendlier names, and OpenFlights'
 * airline list is out of date for some codes, e.g. QP is now Akasa Air).
 *
 * Import this only from server code (API routes): the dataset is ~300 KB.
 */
import type { Airport } from '../../types/flight';
import type { LiveFare } from '../fares/types';
import rawAirports from '../../data/generated/airports.json';
import rawAirlines from '../../data/generated/airlines.json';
import { AIRPORTS } from '../../data/airports';
import { CURATED_AIRLINES } from '../fares/airlines';

type Row = [code: string, city: string, name: string, country: string, tz: string];

const POPULAR = new Set(AIRPORTS.map((a) => a.code));

// Generated rows are ordered by significance (large airports first)
const ALL: Airport[] = [];
const BY_CODE = new Map<string, Airport>();
for (const [code, city, name, country, tz] of rawAirports as Row[]) {
  const airport: Airport = { code, city, name, country, tz: tz || undefined };
  BY_CODE.set(code, airport);
  ALL.push(airport);
}
for (const curated of AIRPORTS) {
  const merged = { ...BY_CODE.get(curated.code), ...curated };
  if (!BY_CODE.has(curated.code)) ALL.push(merged);
  BY_CODE.set(curated.code, merged);
}
const ORDERED: Airport[] = [
  ...AIRPORTS.map((a) => BY_CODE.get(a.code) as Airport),
  ...ALL.filter((a) => !POPULAR.has(a.code)).map((a) => BY_CODE.get(a.code) as Airport),
];

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Pre-folded search text per airport. */
const INDEX = ORDERED.map((a) => ({
  airport: a,
  code: a.code.toLowerCase(),
  city: fold(a.city),
  name: fold(a.name),
  country: fold(a.country),
}));

export const AIRPORT_COUNT = ORDERED.length;

export function lookupAirport(code: string | undefined): Airport | undefined {
  return code ? BY_CODE.get(code.toUpperCase()) : undefined;
}

/**
 * Ranked airport search: exact IATA code, then code prefix, city prefix,
 * word prefix in the airport name, then any substring. Popular airports and
 * larger airports win ties.
 */
export function searchAirports(query: string, limit = 12): Airport[] {
  const q = fold(query.trim());
  if (!q) return AIRPORTS.slice(0, limit);

  const scored: { a: Airport; score: number; order: number }[] = [];
  INDEX.forEach((e, order) => {
    let score = -1;
    // An exact city name ranks with an exact code, so "goa" finds Goa (GOI/GOX)
    // before Genoa (whose code is GOA); popular airports win the tie.
    if (e.code === q || e.city === q) score = 0;
    else if (e.code.startsWith(q)) score = 1;
    else if (e.city.startsWith(q)) score = 2;
    else if (e.name.split(/[\s/()-]+/).some((w) => w.startsWith(q))) score = 3;
    else if (q.length >= 3 && (e.city.includes(q) || e.name.includes(q) || e.country.startsWith(q))) score = 4;
    if (score >= 0) scored.push({ a: e.airport, score, order });
  });

  return scored
    .sort((x, y) => x.score - y.score || x.order - y.order)
    .slice(0, limit)
    .map((s) => s.a);
}

/** Attaches airport (with time zone) and airline details to a live fare. */
export function enrichFare(fare: LiveFare): LiveFare {
  return {
    ...fare,
    originInfo: lookupAirport(fare.originAirport) ?? lookupAirport(fare.origin),
    destinationInfo: lookupAirport(fare.destinationAirport) ?? lookupAirport(fare.destination),
    airlineName: fare.airlineCode ? airlineDisplayName(fare.airlineCode) : undefined,
  };
}

const OPENFLIGHTS_AIRLINES = rawAirlines as Record<string, string>;

/** Curated name first, then OpenFlights, then the code itself. */
export function airlineDisplayName(code: string): string {
  const c = code?.toUpperCase();
  return CURATED_AIRLINES[c] ?? OPENFLIGHTS_AIRLINES[c] ?? c;
}
