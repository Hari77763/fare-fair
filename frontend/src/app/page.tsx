'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Bookmark, Info, RotateCw, SlidersHorizontal } from 'lucide-react';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ScrollProgress } from '@/components/ScrollProgress';
import { HeroSearch, type Passengers } from '@/components/HeroSearch';
import { StickyHeader } from '@/components/StickyHeader';
import { FlexibleFareStrip } from '@/components/FlexibleFareStrip';
import { FilterSidebar, PRICE_MAX_INR } from '@/components/FilterSidebar';
import { FlightCard } from '@/components/FlightCard';
import { SeatMapModal } from '@/components/SeatMapModal';
import { BookingToast } from '@/components/BookingToast';
import { useReveal } from '@/hooks/useReveal';
import { useLiveFares } from '@/hooks/useLiveFares';
import { liveFareToItinerary } from '@/lib/fares/toItinerary';

import type {
  CurrencyCode,
  TripType,
  CabinClass,
  Airport,
  FlightItinerary,
  FareTier,
  SortOption,
  TimeWindow,
  DayFare,
} from '@/types/flight';
import { mockItineraries, mockDayFares } from '@/data/mockFlights';
import { findAirport } from '@/data/airports';

// Sample itineraries cover a single route; other routes show an honest notice.
const SAMPLE_ROUTE = { origin: 'DEL', destination: 'BOM' };

const lowestTotal = (f: FlightItinerary) => f.fareTiers[0].priceInr + f.fareTiers[0].taxesInr;

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Seven-day window around a date, never starting in the past. */
function stripStart(dateISO: string) {
  const start = shiftDate(dateISO, -3);
  const today = todayISO();
  return start < today ? today : start;
}

function toDayFare(dateISO: string, priceInr: number | null, cheapest: number | null): DayFare {
  const d = new Date(`${dateISO}T00:00:00Z`);
  return {
    dateISO,
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
    dayNumber: d.getUTCDate(),
    lowestPriceInr: priceInr,
    isCheapest: priceInr !== null && priceInr === cheapest,
  };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ResultSkeleton() {
  return (
    <div className="glass-card rounded-[var(--radius-card)] p-5 sm:p-6" aria-hidden="true">
      <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-12">
        <div className="flex items-center gap-3 md:col-span-3">
          <div className="skeleton h-11 w-11 rounded-[12px]" />
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-24" />
            <div className="skeleton h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 md:col-span-6">
          <div className="skeleton h-7 w-16" />
          <div className="skeleton h-2 flex-1" />
          <div className="skeleton h-7 w-16" />
        </div>
        <div className="flex justify-end md:col-span-3">
          <div className="skeleton h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export default function FlightBookingApp() {
  // Global
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Search
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [origin, setOrigin] = useState<Airport>(() => findAirport('DEL') as Airport);
  const [destination, setDestination] = useState<Airport>(() => findAirport('BOM') as Airport);
  const [departureDate, setDepartureDate] = useState('2026-12-14');
  const [returnDate, setReturnDate] = useState<string | undefined>('2026-12-21');
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');
  const { state: live, search: searchLive, calendar, loadCalendar } = useLiveFares();
  const isSearching = live.status === 'loading';
  const isLive = live.status === 'live';
  const searchedRoute = live.query
    ? { origin: live.query.origin, destination: live.query.destination }
    : SAMPLE_ROUTE;

  // Sticky summary
  const sentinelRef = useRef<HTMLDivElement>(null);
  const originTriggerRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  // Flexible dates
  const [selectedDayISO, setSelectedDayISO] = useState('2026-12-14');
  const [isFareStripLoading, setIsFareStripLoading] = useState(false);
  const timers = useRef<number[]>([]);

  // Filters
  const [sortOption, setSortOption] = useState<SortOption>('best');
  const [maxPriceInr, setMaxPriceInr] = useState<number>(PRICE_MAX_INR);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [selectedTimeWindows, setSelectedTimeWindows] = useState<TimeWindow[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [requireCheckedBag, setRequireCheckedBag] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Seat map & confirmation
  const [seatSelection, setSeatSelection] = useState<{ flight: FlightItinerary; tier: FareTier } | null>(null);
  const [bookingToast, setBookingToast] = useState({
    isOpen: false,
    bookingRef: '',
    flightNumber: '',
    route: '',
    seatId: '',
    totalInr: 0,
  });

  // Clear pending timers on unmount so no state updates fire afterwards
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Live fares when the fare source answered; demo itineraries otherwise
  const sourceItineraries = useMemo(
    () =>
      isLive
        ? (live.fares.length ? live.fares : live.nearbyFares ?? []).map((f) => liveFareToItinerary(f, live.roundTrip))
        : mockItineraries,
    [isLive, live.fares, live.nearbyFares, live.roundTrip]
  );

  // Airline filter options come from the data, not a hard-coded list
  const airlineOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string; lowestInr: number }>();
    for (const f of sourceItineraries) {
      const seg = f.segments[0];
      const price = lowestTotal(f);
      const existing = map.get(seg.airlineCode);
      if (!existing || price < existing.lowestInr) {
        map.set(seg.airlineCode, { code: seg.airlineCode, name: seg.airlineName, lowestInr: price });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.lowestInr - b.lowestInr);
  }, [sourceItineraries]);

  const filteredFlights = useMemo(() => {
    return sourceItineraries
      .filter((flight) => {
        if (showSavedOnly && !savedIds.includes(flight.id)) return false;
        if (maxPriceInr < PRICE_MAX_INR && lowestTotal(flight) > maxPriceInr) return false;
        if (selectedStops.length > 0 && !selectedStops.includes(flight.stops)) return false;
        if (selectedAirlines.length > 0 && !selectedAirlines.includes(flight.segments[0].airlineCode)) return false;
        if (requireCheckedBag && flight.fareTiers[0].checkinBagKg <= 0) return false;
        if (selectedTimeWindows.length > 0) {
          // Same wall-clock basis as the times displayed on the cards
          const h = new Date(flight.segments[0].departureISO).getUTCHours();
          const ok = selectedTimeWindows.some((w) =>
            w === 'early' ? h < 6 : w === 'morning' ? h >= 6 && h < 12 : w === 'afternoon' ? h >= 12 && h < 18 : h >= 18
          );
          if (!ok) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'cheapest') return lowestTotal(a) - lowestTotal(b);
        if (sortOption === 'fastest') return a.totalDurationMinutes - b.totalDurationMinutes;
        if (sortOption === 'earliest') return a.segments[0].departureISO.localeCompare(b.segments[0].departureISO);
        // Best: price plus a time cost of ₹10/min and ₹1,500 per stop
        const score = (f: FlightItinerary) => lowestTotal(f) + f.totalDurationMinutes * 10 + f.stops * 1500;
        return score(a) - score(b);
      });
  }, [sourceItineraries, showSavedOnly, savedIds, maxPriceInr, selectedStops, selectedAirlines, requireCheckedBag, selectedTimeWindows, sortOption]);

  // Computed across every itinerary so the badge stays truthful when filters hide some
  const { cheapestId, fastestId } = useMemo(() => {
    const byPrice = [...sourceItineraries].sort((a, b) => lowestTotal(a) - lowestTotal(b));
    const byTime = sourceItineraries
      .filter((f) => f.totalDurationMinutes > 0)
      .sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
    return { cheapestId: byPrice[0]?.id, fastestId: byTime[0]?.id };
  }, [sourceItineraries]);

  // Date strip: live cheapest-per-day when available, demo days otherwise
  const dayFares: DayFare[] = useMemo(() => {
    if (!isLive) return mockDayFares;
    const start = stripStart(live.query?.departureDate ?? departureDate);
    const days =
      calendar.status === 'live' && calendar.days.length
        ? calendar.days
        : Array.from({ length: 7 }, (_, i) => ({ dateISO: shiftDate(start, i), priceInr: null }));
    const prices = days.map((d) => d.priceInr).filter((p): p is number => p !== null);
    const cheapest = prices.length ? Math.min(...prices) : null;
    return days.map((d) => toDayFare(d.dateISO, d.priceInr, cheapest));
    // departureDate only matters before the first live answer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, live.query, calendar]);

  const activeFilterCount =
    (maxPriceInr < PRICE_MAX_INR ? 1 : 0) +
    selectedStops.length +
    selectedTimeWindows.length +
    selectedAirlines.length +
    (requireCheckedBag ? 1 : 0);

  useReveal([filteredFlights, isSearching, isFareStripLoading]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  /** Queries the live fare source; the UI falls back to demo data if it can't answer. */
  const runSearch = async (opts: { date?: string; scroll?: boolean; from?: Airport; to?: Airport } = {}) => {
    const dep = opts.date ?? departureDate;
    const from = opts.from ?? origin;
    const to = opts.to ?? destination;
    const ret = tripType === 'round-trip' && returnDate && returnDate >= dep ? returnDate : undefined;
    setShowSavedOnly(false);
    setSelectedDayISO(dep);
    const result = await searchLive({ origin: from.code, destination: to.code, departureDate: dep, returnDate: ret });
    if (result.status === 'live') loadCalendar(from.code, to.code, stripStart(dep), 7);
    if (opts.scroll) scrollToResults();
  };

  // First load: search the default route with a date that is still in the future
  useEffect(() => {
    const today = todayISO();
    const initial = departureDate < today ? shiftDate(today, 21) : departureDate;
    if (initial !== departureDate) setDepartureDate(initial);
    runSearch({ date: initial });
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectDay = (dateISO: string) => {
    if (dateISO === selectedDayISO && !isFareStripLoading && !isSearching) return;
    setDepartureDate(dateISO);
    if (live.status === 'live' || live.status === 'error') {
      // Real data: fetch fares for the chosen day
      runSearch({ date: dateISO });
      return;
    }
    setSelectedDayISO(dateISO);
    setIsFareStripLoading(true);
    later(() => setIsFareStripLoading(false), 450);
  };

  const handleSearch = () => {
    if (isSearching) return;
    runSearch({ scroll: true });
  };

  const handleResetFilters = useCallback(() => {
    setMaxPriceInr(PRICE_MAX_INR);
    setSelectedStops([]);
    setSelectedTimeWindows([]);
    setSelectedAirlines([]);
    setRequireCheckedBag(false);
    setSortOption('best');
    setShowSavedOnly(false);
  }, []);

  const handleEditSearch = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    later(() => originTriggerRef.current?.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 450);
  };

  const toggleSave = (id: string) =>
    setSavedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const handleConfirmSeat = (seatId: string, grandTotalInr: number) => {
    if (!seatSelection) return;
    const seg = seatSelection.flight.segments[0];
    const last = seatSelection.flight.segments[seatSelection.flight.segments.length - 1];
    setSeatSelection(null);
    setBookingToast({
      isOpen: true,
      bookingRef: `FF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      flightNumber: seg.flightNumber,
      route: `${seg.origin.code} → ${last.destination.code}`,
      seatId,
      totalInr: grandTotalInr,
    });
  };

  const closeToast = useCallback(() => setBookingToast((t) => ({ ...t, isOpen: false })), []);
  const closeSheet = useCallback(() => setIsMobileSheetOpen(false), []);

  const travellers = passengers.adults + passengers.children + passengers.infants;
  const isSampleRoute =
    searchedRoute.origin === SAMPLE_ROUTE.origin && searchedRoute.destination === SAMPLE_ROUTE.destination;
  const isDemo = !isLive && !isSearching;
  // Exact day had no cached fares, so the closest real days are shown instead
  const isNearby = isLive && live.fares.length === 0 && (live.nearbyFares?.length ?? 0) > 0;
  const requestedDayLabel = live.query
    ? new Date(`${live.query.departureDate}T00:00:00Z`).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
    : '';
  const updatedAt = live.fetchedAt
    ? new Date(live.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const compareHref = `/search?origin=${origin.code}&destination=${destination.code}&departure_date=${departureDate}&adults=${passengers.adults}`;

  return (
    <div className="relative min-h-screen text-[var(--text-primary)]">
      <ScrollProgress />

      <Navbar
        currency={currency}
        onCurrencyChange={setCurrency}
        savedCount={savedIds.length}
        showSavedOnly={showSavedOnly}
        onToggleSaved={() => {
          setShowSavedOnly((v) => !v);
          scrollToResults();
        }}
      />

      <StickyHeader
        isVisible={isStickyVisible}
        origin={origin}
        destination={destination}
        departureDate={departureDate}
        returnDate={tripType === 'round-trip' ? returnDate : undefined}
        travellers={travellers}
        cabinClass={cabinClass}
        onEdit={handleEditSearch}
      />

      <section className="relative">
        <div className="hero-backdrop" aria-hidden="true" />
        <HeroSearch
          tripType={tripType}
          onTripTypeChange={setTripType}
          origin={origin}
          onOriginChange={setOrigin}
          destination={destination}
          onDestinationChange={setDestination}
          departureDate={departureDate}
          onDepartureDateChange={setDepartureDate}
          returnDate={returnDate}
          onReturnDateChange={setReturnDate}
          passengers={passengers}
          onPassengersChange={setPassengers}
          cabinClass={cabinClass}
          onCabinClassChange={setCabinClass}
          onSearch={handleSearch}
          isSearching={isSearching}
          sentinelRef={sentinelRef}
          originTriggerRef={originTriggerRef}
        />
      </section>

      <FlexibleFareStrip
        dayFares={dayFares}
        selectedDate={selectedDayISO}
        onSelectDate={handleSelectDay}
        currency={currency}
        isLoading={isFareStripLoading || isSearching}
        isLoadingAll={isLive && calendar.status === 'loading'}
        sourceLabel={isLive ? 'Live' : 'Demo'}
      />

      <main id="main" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <FilterSidebar
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            maxPriceInr={maxPriceInr}
            onMaxPriceInrChange={setMaxPriceInr}
            selectedStops={selectedStops}
            onStopsChange={setSelectedStops}
            selectedTimeWindows={selectedTimeWindows}
            onTimeWindowsChange={setSelectedTimeWindows}
            selectedAirlines={selectedAirlines}
            onAirlinesChange={setSelectedAirlines}
            airlines={airlineOptions}
            requireCheckedBag={requireCheckedBag}
            onRequireCheckedBagChange={setRequireCheckedBag}
            currency={currency}
            onResetAll={handleResetFilters}
            activeFilterCount={activeFilterCount}
            resultCount={filteredFlights.length}
            isMobileSheetOpen={isMobileSheetOpen}
            onCloseMobileSheet={closeSheet}
          />

          <div ref={resultsRef} className="w-full min-w-0 flex-1 scroll-mt-[calc(var(--header-h)+64px)]">
            {/* Results header */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {showSavedOnly ? 'Saved flights' : `${searchedRoute.origin} → ${searchedRoute.destination}`}
                </h2>
                <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
                  {isSearching
                    ? 'Checking the latest fares…'
                    : `${filteredFlights.length} of ${sourceItineraries.length} ${isLive ? 'live fares' : 'demo flights'}${
                        activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} on` : ''
                      } · per adult${isLive && updatedAt ? ` · updated ${updatedAt}` : ' incl. taxes'}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={compareHref} className="btn btn-ghost hidden h-9 px-3 text-xs sm:inline-flex">
                  Compare sellers
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileSheetOpen(true)}
                  className="btn btn-secondary h-9 px-3 text-xs lg:hidden"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-[var(--accent-primary)] px-1.5 text-[10px] font-semibold text-white tabular-nums">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {!showSavedOnly && isNearby && (
              <div
                role="note"
                className="mb-4 flex animate-fade-up flex-wrap items-start justify-between gap-3 glass-card rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"
              >
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                  <p>
                    <strong className="font-semibold text-[var(--text-primary)]">
                      No recent fares for {requestedDayLabel}.
                    </strong>{' '}
                    Showing the closest dates travellers have priced on {searchedRoute.origin} → {searchedRoute.destination}.
                  </p>
                </div>
                {live.allResultsUrl && (
                  <a
                    href={live.allResultsUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="btn btn-secondary h-8 px-3 text-xs"
                  >
                    Search {requestedDayLabel} live
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {!showSavedOnly && isLive && !isNearby && (
              <div
                role="note"
                className="mb-4 flex animate-fade-up items-start gap-3 glass-card rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"
              >
                <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--semantic-success)]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--semantic-success)]" />
                </span>
                <p>
                  <strong className="font-semibold text-[var(--text-primary)]">Live prices.</strong> The lowest fares travellers
                  found recently via Aviasales. Seats and the final price are confirmed on the seller’s site.
                </p>
              </div>
            )}

            {!showSavedOnly && isDemo && live.status === 'error' && (
              <div
                role="alert"
                className="mb-4 flex animate-fade-up flex-wrap items-start justify-between gap-3 glass-card rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--semantic-warning)]" />
                  <p>
                    <strong className="font-semibold text-[var(--text-primary)]">Live fares unavailable.</strong>{' '}
                    {live.message ?? 'The fare source did not answer.'} Showing demo fares instead.
                  </p>
                </div>
                <button type="button" onClick={() => runSearch()} className="btn btn-secondary h-8 px-3 text-xs">
                  <RotateCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {!showSavedOnly && isDemo && live.status !== 'error' && (
              <div
                role="note"
                className="mb-4 flex animate-fade-up items-start gap-3 glass-card rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                <p>
                  <strong className="font-semibold text-[var(--text-primary)]">Demo fares.</strong> Live pricing isn’t switched on
                  yet, so these are sample Delhi → Mumbai flights
                  {!isSampleRoute ? ` (you searched ${searchedRoute.origin} → ${searchedRoute.destination})` : ''}.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {isSearching ? (
                <>
                  <ResultSkeleton />
                  <ResultSkeleton />
                  <ResultSkeleton />
                </>
              ) : filteredFlights.length === 0 ? (
                <div className="animate-fade-up glass-card rounded-[var(--radius-card)] border-dashed px-6 py-14 text-center">
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    {showSavedOnly ? <Bookmark className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {showSavedOnly
                      ? 'No saved flights yet'
                      : isLive && sourceItineraries.length === 0
                      ? `No recent fares for ${searchedRoute.origin} → ${searchedRoute.destination} on this date`
                      : 'No flights match these filters'}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">
                    {showSavedOnly
                      ? 'Tap the bookmark on any flight to keep it here while you compare.'
                      : isLive && sourceItineraries.length === 0
                      ? 'Aviasales hasn’t cached recent prices for this route around this date. A live search checks every airline right now.'
                      : 'Try a wider departure window, a higher budget or fewer airline filters.'}
                  </p>
                  {!showSavedOnly && isLive && sourceItineraries.length === 0 && live.allResultsUrl ? (
                    <a
                      href={live.allResultsUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="btn btn-primary mt-5 h-10 px-5 text-sm"
                    >
                      Search all airlines live on Aviasales
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={showSavedOnly ? () => setShowSavedOnly(false) : handleResetFilters}
                      className="btn btn-primary mt-5 h-10 px-5 text-sm"
                    >
                      {showSavedOnly ? 'Show all flights' : 'Reset filters'}
                    </button>
                  )}
                </div>
              ) : (
                filteredFlights.map((flight, idx) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    currency={currency}
                    index={idx}
                    isSaved={savedIds.includes(flight.id)}
                    highlights={[
                      ...(flight.id === cheapestId ? (['cheapest'] as const) : []),
                      ...(flight.id === fastestId ? (['fastest'] as const) : []),
                    ]}
                    onToggleSave={toggleSave}
                    showDate={isNearby}
                    onSelectFare={(f, tier) => setSeatSelection({ flight: f, tier })}
                  />
                ))
              )}
            </div>

            {isLive && !showSavedOnly && live.allResultsUrl && (
              <a
                href={live.allResultsUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-reveal
                className="glass-card lift-on-hover mt-3 flex items-center justify-between gap-4 rounded-[var(--radius-card)] px-5 py-4"
              >
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">
                    See every flight for this date
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                    FairFare shows the cheapest fares travellers found recently. Aviasales checks all airlines and agencies
                    live.
                  </span>
                </span>
                <span className="btn btn-secondary h-9 shrink-0 px-4 text-xs">
                  Open Aviasales
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {seatSelection && (
        <SeatMapModal
          key={`${seatSelection.flight.id}-${seatSelection.tier.id}`}
          isOpen
          onClose={() => setSeatSelection(null)}
          flight={seatSelection.flight}
          tier={seatSelection.tier}
          currency={currency}
          onConfirmSeat={handleConfirmSeat}
        />
      )}

      <BookingToast
        isOpen={bookingToast.isOpen}
        onClose={closeToast}
        bookingRef={bookingToast.bookingRef}
        flightNumber={bookingToast.flightNumber}
        route={bookingToast.route}
        seatId={bookingToast.seatId}
        totalInr={bookingToast.totalInr}
        currency={currency}
      />
    </div>
  );
}
