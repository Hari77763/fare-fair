import type { CalendarResponse } from '../../../../lib/fares/types';
import {
  REVALIDATE_SECONDS,
  fetchCalendar,
  friendlyError,
  getConfig,
  parseCalendarQuery,
} from '../../../../lib/fares/travelpayouts';

/**
 * GET /api/fares/calendar?origin=DEL&destination=BOM&start=2026-12-11&days=7
 * Cheapest recently found one-way fare for each day in the window.
 */
export async function GET(request: Request): Promise<Response> {
  const fetchedAt = new Date().toISOString();

  const parsed = parseCalendarQuery(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return Response.json({ status: 'error', days: [], fetchedAt, message: parsed.error } satisfies CalendarResponse, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const config = getConfig();
  if (!config.token) {
    return Response.json({ status: 'unconfigured', days: [], fetchedAt } satisfies CalendarResponse, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const days = await fetchCalendar(parsed.value, config);
    return Response.json({ status: 'live', days, fetchedAt } satisfies CalendarResponse, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 3}`,
      },
    });
  } catch (err) {
    console.error('[api/fares/calendar] upstream failure:', err instanceof Error ? err.message : err);
    return Response.json({ status: 'error', days: [], fetchedAt, message: friendlyError(err) } satisfies CalendarResponse, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
