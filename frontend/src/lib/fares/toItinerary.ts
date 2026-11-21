/**
 * Maps a normalised live fare onto the FlightItinerary shape the results UI,
 * filters and sorting already understand. Client-safe (no secrets).
 */
import type { FlightItinerary } from '../../types/flight';
import type { LiveFare } from './types';
import { airlineName } from './airlines';
import { airportOrCode, findAirport } from '../../data/airports';

const OFFSET = /([+-])(\d{2}):?(\d{2})$|Z$/i;

/**
 * Renders an instant as "wall clock" ISO (local time with a Z suffix), which
 * is how the results UI stores airport-local times.
 */
export function wallClockISO(instantMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instantMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:00Z`;
}

/** Local departure wall clock: origin tz if known, else the offset given in the string. */
function departureWallClock(departureAt: string, originTz?: string): string {
  const instant = Date.parse(departureAt);
  if (originTz) return wallClockISO(instant, originTz);
  // Unknown airport: keep the local time the source wrote (strip its offset)
  const local = departureAt.replace(OFFSET, '');
  return `${local.slice(0, 16)}:00Z`;
}

export function liveFareToItinerary(fare: LiveFare, roundTrip: boolean): FlightItinerary {
  const originCode = fare.originAirport || fare.origin;
  const destCode = fare.destinationAirport || fare.destination;
  const origin = airportOrCode(originCode);
  const destination = airportOrCode(destCode);
  const originTz = findAirport(originCode)?.tz ?? findAirport(fare.origin)?.tz;
  const destTz = findAirport(destCode)?.tz ?? findAirport(fare.destination)?.tz;

  const departureISO = departureWallClock(fare.departureAt, originTz);
  // Arrival is only shown when it can be computed correctly (duration + dest tz)
  const arrivalISO =
    fare.durationMinutes && destTz
      ? wallClockISO(Date.parse(fare.departureAt) + fare.durationMinutes * 60_000, destTz)
      : '';

  return {
    id: `live-${fare.id}`,
    stops: fare.transfers,
    totalDurationMinutes: fare.durationMinutes ?? 0,
    onTimePercent: 0,
    seatsRemaining: 99,
    tags: fare.transfers === 0 ? ['non-stop'] : [],
    segments: [
      {
        id: `seg-${fare.id}`,
        airlineCode: fare.airlineCode || '—',
        airlineName: fare.airlineCode ? airlineName(fare.airlineCode) : 'Multiple airlines',
        flightNumber: fare.flightNumber,
        aircraft: '',
        origin,
        destination,
        departureISO,
        arrivalISO,
        terminalOrigin: '',
        terminalDest: '',
        durationMinutes: fare.durationMinutes ?? 0,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: roundTrip ? 'Round trip' : 'Lowest fare',
        priceInr: fare.priceInr,
        taxesInr: 0,
        cabinBagKg: 0,
        checkinBagKg: -1, // unknown: confirmed on the seller's site
        cancellationFeeInr: null,
        seatSelectionFree: false,
        mealIncluded: false,
      },
    ],
    live: {
      bookingUrl: fare.bookingUrl,
      roundTrip,
      foundAt: fare.foundAt,
      sourceName: 'Aviasales',
    },
  };
}
