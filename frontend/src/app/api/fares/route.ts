import type { FaresResponse } from '../../../lib/fares/types';
import {
  REVALIDATE_SECONDS,
  friendlyError,
  getConfig,
  parseFareQuery,
  searchDeepLink,
  searchFares,
} from '../../../lib/fares/travelpayouts';

/**
 * GET /api/fares?origin=DEL&destination=BOM&departure_date=2026-12-14[&return_date=…]
 *
 * Proxies the fare source so the API token stays on the server. Responses are
 * CDN-cached briefly per query; "unconfigured" and errors are never cached.
 */
export async function GET(request: Request): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  const base = { fares: [], currency: 'INR' as const, fetchedAt, source: 'Aviasales' as const };

  const parsed = parseFareQuery(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return Response.json({ ...base, status: 'error', roundTrip: false, message: parsed.error } satisfies FaresResponse, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const query = parsed.value;
  const roundTrip = Boolean(query.returnDate);
  const config = getConfig();

  if (!config.token) {
    return Response.json(
      { ...base, status: 'unconfigured', roundTrip, message: 'Live fares are not configured on this server.' } satisfies FaresResponse,
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const fares = await searchFares(query, config);
    const allResultsUrl = searchDeepLink(query.origin, query.destination, query.departureDate, config.marker, query.returnDate);
    return Response.json({ ...base, status: 'live', roundTrip, fares, allResultsUrl } satisfies FaresResponse, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS / 2}, stale-while-revalidate=${REVALIDATE_SECONDS}`,
      },
    });
  } catch (err) {
    // Log the technical reason server-side only; the token is never in the message.
    console.error('[api/fares] upstream failure:', err instanceof Error ? err.message : err);
    return Response.json({ ...base, status: 'error', roundTrip, message: friendlyError(err) } satisfies FaresResponse, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
