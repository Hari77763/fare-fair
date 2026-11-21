'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Navigation } from '../components/Navigation';
import { HeroSearch } from '../components/HeroSearch';
import { StickyHeader } from '../components/StickyHeader';
import { FlexibleFareStrip } from '../components/FlexibleFareStrip';
import { FilterSidebar } from '../components/FilterSidebar';
import { FlightCard } from '../components/FlightCard';
import { SeatMapModal } from '../components/SeatMapModal';
import { BookingToast } from '../components/BookingToast';

import {
  CurrencyCode,
  TripType,
  CabinClass,
  Airport,
  FlightItinerary,
  FareTier,
  SortOption,
  TimeWindow,
  DayFare,
} from '../types/flight';
import {
  majorAirports,
  airportMap,
  generateFlightsForRoute,
  generateDayFaresForRoute,
} from '../data/mockFlights';
import { getFlightsForRoute } from '../lib/flightService';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { SlidersHorizontal, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function FlightBookingApp() {
  // Global State
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [savedCount, setSavedCount] = useState(0);

  // Search State: Initialized to Chennai (MAA) -> New Delhi (DEL)
  const [tripType, setTripType] = useState<TripType>('round-trip');
  const [origin, setOrigin] = useState<Airport>(airportMap['MAA'] || majorAirports[3]);
  const [destination, setDestination] = useState<Airport>(airportMap['DEL'] || majorAirports[0]);
  const [departureDate, setDepartureDate] = useState('2027-01-28');
  const [returnDate, setReturnDate] = useState<string | undefined>('2027-02-18');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');

  // Sticky Header & Sentinel Observer State
  const sentinelRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  // Scroll Progress
  const { scrollProgress } = useScrollProgress();

  // Dynamic Flights and Flexible Dates State
  const [flights, setFlights] = useState<FlightItinerary[]>(() =>
    generateFlightsForRoute(
      airportMap['MAA'] || majorAirports[3],
      airportMap['DEL'] || majorAirports[0],
      '2027-01-28'
    )
  );

  const [dayFares, setDayFares] = useState<DayFare[]>(() =>
    generateDayFaresForRoute(
      airportMap['MAA'] || majorAirports[3],
      airportMap['DEL'] || majorAirports[0],
      '2027-01-28'
    )
  );

  const [selectedDayISO, setSelectedDayISO] = useState('2027-01-28');
  const [isFareStripLoading, setIsFareStripLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Filter & Sort State
  const [sortOption, setSortOption] = useState<SortOption>('best');
  const [maxPriceInr, setMaxPriceInr] = useState<number>(35000);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [selectedTimeWindows, setSelectedTimeWindows] = useState<TimeWindow[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [requireCheckedBag, setRequireCheckedBagChange] = useState<boolean>(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);

  // Seat Map & Booking State
  const [selectedFlightForSeat, setSelectedFlightForSeat] = useState<FlightItinerary | null>(null);
  const [selectedTierForSeat, setSelectedTierForSeat] = useState<FareTier | null>(null);
  const [bookingToast, setBookingToast] = useState<{
    isOpen: boolean;
    bookingRef: string;
    flightNumber: string;
    route: string;
    seatId: string;
    totalInr: number;
  }>({
    isOpen: false,
    bookingRef: '',
    flightNumber: '',
    route: '',
    seatId: '',
    totalInr: 0,
  });

  // IntersectionObserver for Sticky Header Sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Update flights and 7-day strip when origin, destination or date changes
  const executeSearch = async (orig: Airport, dest: Airport, dateISO: string) => {
    setIsSearching(true);
    // Instant responsive update from local dynamic generator
    const localFlights = generateFlightsForRoute(orig, dest, dateISO);
    const localDays = generateDayFaresForRoute(orig, dest, dateISO);
    setFlights(localFlights);
    setDayFares(localDays);

    // Asynchronously try backend API for real-time live supplier offers
    try {
      const apiFlights = await getFlightsForRoute(orig, dest, dateISO);
      if (apiFlights && apiFlights.length > 0) {
        setFlights(apiFlights);
      }
    } catch (e) {
      console.debug('Using dynamic route engine flights');
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search when origin or destination changes
  useEffect(() => {
    executeSearch(origin, destination, departureDate);
  }, [origin.code, destination.code, departureDate]);

  // Handle Date Strip Switch
  const handleSelectDay = (dateISO: string) => {
    setSelectedDayISO(dateISO);
    setDepartureDate(dateISO);
    setIsFareStripLoading(true);
    executeSearch(origin, destination, dateISO);
    setTimeout(() => {
      setIsFareStripLoading(false);
    }, 180);
  };

  // Filter & Sort Engine
  const filteredFlights = useMemo(() => {
    return flights
      .filter((flight) => {
        const lowestFare = flight.fareTiers[0].priceInr + flight.fareTiers[0].taxesInr;

        // Price filter
        if (lowestFare > maxPriceInr) return false;

        // Stops filter
        if (selectedStops.length > 0 && !selectedStops.includes(flight.stops)) return false;

        // Airline filter
        if (selectedAirlines.length > 0) {
          const airline = flight.segments[0].airlineCode;
          if (!selectedAirlines.includes(airline)) return false;
        }

        // Baggage filter
        if (requireCheckedBag && flight.fareTiers[0].checkinBagKg <= 0) return false;

        // Departure time filter
        if (selectedTimeWindows.length > 0) {
          const depHour = new Date(flight.segments[0].departureISO).getUTCHours();
          const matchesWindow = selectedTimeWindows.some((w) => {
            if (w === 'early') return depHour < 6;
            if (w === 'morning') return depHour >= 6 && depHour < 12;
            if (w === 'afternoon') return depHour >= 12 && depHour < 18;
            if (w === 'evening') return depHour >= 18;
            return false;
          });
          if (!matchesWindow) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.fareTiers[0].priceInr + a.fareTiers[0].taxesInr;
        const priceB = b.fareTiers[0].priceInr + b.fareTiers[0].taxesInr;

        if (sortOption === 'cheapest') return priceA - priceB;
        if (sortOption === 'fastest') return a.totalDurationMinutes - b.totalDurationMinutes;
        if (sortOption === 'earliest') {
          return (
            new Date(a.segments[0].departureISO).getTime() -
            new Date(b.segments[0].departureISO).getTime()
          );
        }
        // Best: balanced score (stops, duration, price)
        return priceA + a.totalDurationMinutes * 10 - (priceB + b.totalDurationMinutes * 10);
      });
  }, [flights, maxPriceInr, selectedStops, selectedAirlines, requireCheckedBag, selectedTimeWindows, sortOption]);

  const handleResetFilters = () => {
    setMaxPriceInr(35000);
    setSelectedStops([]);
    setSelectedTimeWindows([]);
    setSelectedAirlines([]);
    setRequireCheckedBagChange(false);
    setSortOption('best');
  };

  const handleEditSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      originInputRef.current?.focus();
    }, 350);
  };

  const handleOpenSeatMap = (flight: FlightItinerary, tier: FareTier) => {
    setSelectedFlightForSeat(flight);
    setSelectedTierForSeat(tier);
  };

  const handleConfirmSeat = (seatId: string, grandTotalInr: number) => {
    if (!selectedFlightForSeat) return;
    const ref = `FF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const flightNum = selectedFlightForSeat.segments[0].flightNumber;
    const route = `${origin.code} → ${destination.code}`;

    setSelectedFlightForSeat(null);
    setSelectedTierForSeat(null);

    setBookingToast({
      isOpen: true,
      bookingRef: ref,
      flightNumber: flightNum,
      route,
      seatId,
      totalInr: grandTotalInr,
    });
  };

  return (
    <div className="min-h-screen text-slate-900 relative selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Top Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] bg-blue-600 z-50 pointer-events-none origin-left"
        style={{
          transform: `scaleX(${scrollProgress})`,
          transition: 'transform 60ms linear',
        }}
        aria-hidden="true"
      />

      {/* 2. Top Navigation */}
      <Navigation
        currency={currency}
        onCurrencyChange={setCurrency}
        savedCount={savedCount}
      />

      {/* 3. Sticky Header (Appears smoothly when scrolling past hero) */}
      <StickyHeader
        isVisible={isStickyVisible}
        origin={origin}
        destination={destination}
        departureDate={departureDate}
        adultsCount={passengers.adults}
        cabinClass={cabinClass}
        onEdit={handleEditSearch}
      />

      {/* 4. Hero & Search Section */}
      <section className="relative">
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
          onSearch={() => executeSearch(origin, destination, departureDate)}
          sentinelRef={sentinelRef}
          originInputRef={originInputRef}
        />
      </section>

      {/* 5. 7-Day Flexible Dates Strip */}
      <FlexibleFareStrip
        dayFares={dayFares}
        selectedDate={selectedDayISO}
        onSelectDate={handleSelectDay}
        currency={currency}
        isLoading={isFareStripLoading}
      />

      {/* 6. Results Layout: Filters on Left, Flight Cards on Right */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Filter Sidebar */}
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
            requireCheckedBag={requireCheckedBag}
            onRequireCheckedBagChange={setRequireCheckedBagChange}
            currency={currency}
            onResetAll={handleResetFilters}
            isMobileSheetOpen={isMobileSheetOpen}
            onCloseMobileSheet={() => setIsMobileSheetOpen(false)}
          />

          {/* Right: Results Header, Route Status Banner, and Flight Cards */}
          <div className="flex-1 w-full">
            {/* Header: Route, Flight Count & Compare Link */}
            <div className="flex items-center justify-between pb-3 mb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {origin.code} → {destination.code}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {origin.city} to {destination.city} · {filteredFlights.length} of {flights.length} flights · prices per adult incl. taxes
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileSheetOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>

                {/* Compare sellers ↗ Link */}
                <button
                  type="button"
                  className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <span>Compare sellers</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Metasearch Quality & Transparency Callout */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950 mb-5 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-300 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <p className="leading-relaxed">
                Live routes verified for <strong className="font-semibold text-blue-900">{origin.city} ({origin.code}) → {destination.city} ({destination.code})</strong>. Dual-ranked across certified airlines and GDS suppliers with zero hidden fees.
              </p>
            </div>

            {/* Flight Cards List */}
            {filteredFlights.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xl">
                  ✈
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No flights match these filters
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your departure time, raising the budget limit, or clearing airline filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredFlights.map((flight, idx) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  currency={currency}
                  onSelectFare={handleOpenSeatMap}
                  index={idx}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* 7. Cabin Seat Map Dialog */}
      {selectedFlightForSeat && selectedTierForSeat && (
        <SeatMapModal
          isOpen={true}
          onClose={() => {
            setSelectedFlightForSeat(null);
            setSelectedTierForSeat(null);
          }}
          flight={selectedFlightForSeat}
          tier={selectedTierForSeat}
          currency={currency}
          onConfirmSeat={handleConfirmSeat}
        />
      )}

      {/* 8. Booking Confirmation Toast */}
      <BookingToast
        isOpen={bookingToast.isOpen}
        onClose={() => setBookingToast({ ...bookingToast, isOpen: false })}
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
