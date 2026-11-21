'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalendarDay, CalendarResponse, FaresResponse, LiveFare } from '../lib/fares/types';

export interface FareSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
}

export type LiveFaresStatus = 'idle' | 'loading' | 'live' | 'unconfigured' | 'error';

export interface LiveFaresState {
  status: LiveFaresStatus;
  fares: LiveFare[];
  roundTrip: boolean;
  fetchedAt?: string;
  message?: string;
  query?: FareSearch;
}

export interface CalendarState {
  status: 'idle' | 'loading' | 'live' | 'unconfigured' | 'error';
  days: CalendarDay[];
  key?: string;
}

/**
 * Talks to /api/fares and /api/fares/calendar. Each new search aborts the
 * previous one, so out-of-order responses can never overwrite newer results.
 */
export function useLiveFares() {
  const [state, setState] = useState<LiveFaresState>({ status: 'idle', fares: [], roundTrip: false });
  const [calendar, setCalendar] = useState<CalendarState>({ status: 'idle', days: [] });
  const searchCtl = useRef<AbortController | null>(null);
  const calendarCtl = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      searchCtl.current?.abort();
      calendarCtl.current?.abort();
    },
    []
  );

  const search = useCallback(async (q: FareSearch): Promise<LiveFaresState> => {
    searchCtl.current?.abort();
    const ctl = new AbortController();
    searchCtl.current = ctl;
    setState((s) => ({ ...s, status: 'loading', query: q, message: undefined }));

    const params = new URLSearchParams({
      origin: q.origin,
      destination: q.destination,
      departure_date: q.departureDate,
    });
    if (q.returnDate) params.set('return_date', q.returnDate);

    let next: LiveFaresState;
    try {
      const res = await fetch(`/api/fares?${params}`, { signal: ctl.signal });
      const body = (await res.json()) as FaresResponse;
      next = {
        status: body.status,
        fares: body.status === 'live' ? body.fares : [],
        roundTrip: body.roundTrip,
        fetchedAt: body.fetchedAt,
        message: body.message,
        query: q,
      };
    } catch (err) {
      if ((err as Error).name === 'AbortError') return state; // superseded by a newer search
      next = { status: 'error', fares: [], roundTrip: Boolean(q.returnDate), message: 'Could not reach FairFare’s fare service.', query: q };
    }
    if (!ctl.signal.aborted) setState(next);
    return next;
    // state is only used as a fallback return for aborted calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCalendar = useCallback(async (origin: string, destination: string, start: string, days = 7) => {
    const key = `${origin}-${destination}-${start}-${days}`;
    calendarCtl.current?.abort();
    const ctl = new AbortController();
    calendarCtl.current = ctl;
    setCalendar((c) => ({ ...c, status: 'loading', key }));
    try {
      const params = new URLSearchParams({ origin, destination, start, days: String(days) });
      const res = await fetch(`/api/fares/calendar?${params}`, { signal: ctl.signal });
      const body = (await res.json()) as CalendarResponse;
      if (!ctl.signal.aborted) setCalendar({ status: body.status, days: body.days, key });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setCalendar({ status: 'error', days: [], key });
    }
  }, []);

  return { state, search, calendar, loadCalendar };
}
