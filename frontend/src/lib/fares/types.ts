/**
 * Shapes shared by the fares API routes (server) and the home page (client).
 * Nothing in here may reference secrets.
 */

/** One bookable price found by the upstream fare source, normalised. */
export interface LiveFare {
  id: string;
  origin: string; // city or airport IATA, as returned
  destination: string;
  originAirport?: string;
  destinationAirport?: string;
  airlineCode: string;
  flightNumber: string; // "6E 2041", or "" when the source omits it
  departureAt: string; // ISO 8601, with offset when the source provides one
  returnAt?: string;
  durationMinutes: number | null; // outbound leg; null when unknown
  transfers: number;
  priceInr: number; // total for one adult (round trip when roundTrip is true)
  bookingUrl: string;
  foundAt?: string;
  expiresAt?: string;
}

/**
 * live         – the source answered (fares may still be empty)
 * unconfigured – no API token on the server; the UI falls back to demo data
 * error        – the source failed; the UI says so and falls back to demo data
 */
export type LiveStatus = 'live' | 'unconfigured' | 'error';

export interface FaresResponse {
  status: LiveStatus;
  fares: LiveFare[];
  roundTrip: boolean;
  currency: 'INR';
  fetchedAt: string;
  source: 'Aviasales';
  /** Full live search on the seller for this route and date (affiliate-tagged) */
  allResultsUrl?: string;
  message?: string;
}

export interface CalendarDay {
  dateISO: string; // YYYY-MM-DD
  priceInr: number | null; // null when no recent fare is known for that day
}

export interface CalendarResponse {
  status: LiveStatus;
  days: CalendarDay[];
  fetchedAt: string;
  message?: string;
}
