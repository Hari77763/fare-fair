import { searchAirports } from '../../../lib/reference/directory';

/**
 * GET /api/airports?q=goa  →  { airports: Airport[] }
 * Searches ~4,000 airports with scheduled service (OurAirports data).
 * Results are static reference data, so they are cached aggressively.
 */
export async function GET(request: Request): Promise<Response> {
  const q = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 60);
  if (/[<>{}]/.test(q)) {
    return Response.json({ airports: [], error: 'invalid query' }, { status: 400 });
  }
  return Response.json(
    { airports: searchAirports(q, 12) },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
  );
}
