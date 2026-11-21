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
} from '../types/flight';
import { majorAirports, mockItineraries, mockDayFares } from '../data/mockFlights';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { usePointerType } from '../hooks/usePointerType';
import { SlidersHorizontal } from 'lucide-react';

export default function FlightBookingApp() {
  // Global State
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [savedCount, setSavedCount] = useState(0);

  // Search State
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [origin, setOrigin] = useState<Airport>(majorAirports[0]); // DEL
  const [destination, setDestination] = useState<Airport>(majorAirports[1]); // BOM
  const [departureDate, setDepartureDate] = useState('2026-12-14');
  const [returnDate, setReturnDate] = useState<string | undefined>('2026-12-21');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');

  // Sticky Header & Sentinel Observer State
  const sentinelRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  // Scroll Progress and Parallax
  const { scrollProgress, scrollY, prefersReducedMotion } = useScrollProgress();
  const { isFinePointer } = usePointerType();

  // Flexible Date Strip State
  const [selectedDayISO, setSelectedDayISO] = useState('2026-12-14');
  const [isFareStripLoading, setIsFareStripLoading] = useState(false);

  // Filter & Sort Pipeline State
  const [sortOption, setSortOption] = useState<SortOption>('best');
  const [maxPriceInr, setMaxPriceInr] = useState<number>(20000);
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
        // When sentinel scrolls above viewport top, show sticky header
        setIsStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Handle Date Strip Switch with simulated 200ms shimmer
  const handleSelectDay = (dateISO: string) => {
    setSelectedDayISO(dateISO);
    setDepartureDate(dateISO);
    setIsFareStripLoading(true);
    setTimeout(() => {
      setIsFareStripLoading(false);
    }, 200);
  };

  // Filter & Sort Engine
  const filteredFlights = useMemo(() => {
    return mockItineraries
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
  }, [maxPriceInr, selectedStops, selectedAirlines, requireCheckedBag, selectedTimeWindows, sortOption]);

  const handleResetFilters = () => {
    setMaxPriceInr(20000);
    setSelectedStops([]);
    setSelectedTimeWindows([]);
    setSelectedAirlines([]);
    setRequireCheckedBagChange(false);
    setSortOption('best');
  };

  const handleEditSearch = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
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
    const route = `${selectedFlightForSeat.segments[0].origin.code} → ${selectedFlightForSeat.segments[0].destination.code}`;

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

  // Parallax transform calculation
  const heroParallaxStyle = prefersReducedMotion
    ? {}
    : {
        transform: `translate3d(0, ${Math.min(scrollY * 0.15, 48)}px, 0)`,
        opacity: Math.max(1 - scrollY / 320, 0.15),
      };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Top GPU-composited Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)] z-[var(--z-toast)] pointer-events-none origin-left"
        style={{
          transform: `scaleX(${scrollProgress})`,
          transition: prefersReducedMotion ? 'none' : 'transform 60ms linear',
        }}
        aria-hidden="true"
      />

      {/* 2. Top Navigation (64px) */}
      <Navigation
        currency={currency}
        onCurrencyChange={setCurrency}
        savedCount={savedCount}
      />

      {/* 3. Sticky Compressed Search Header */}
      <StickyHeader
        isVisible={isStickyVisible}
        origin={origin}
        destination={destination}
        departureDate={departureDate}
        adultsCount={passengers.adults}
        cabinClass={cabinClass}
        onEdit={handleEditSearch}
      />

      {/* 4. Hero & Unified Search Section */}
      <section style={heroParallaxStyle} className="transition-opacity">
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
          onSearch={() => handleSelectDay(departureDate)}
          sentinelRef={sentinelRef}
          originInputRef={originInputRef}
        />
      </section>

      {/* 5. 7-Day Flexible Fare Strip */}
      <FlexibleFareStrip
        dayFares={mockDayFares}
        selectedDate={selectedDayISO}
        onSelectDate={handleSelectDay}
        currency={currency}
        isLoading={isFareStripLoading}
      />

      {/* 6. Results Layout with Filter Sidebar */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Filter Sidebar & Mobile Trigger */}
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

          {/* Results List */}
          <div className="flex-1 w-full space-y-4">
            {/* Results Header with Count & Mobile Filter Trigger */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
              <span className="font-semibold">
                Showing {filteredFlights.length} verified flights
              </span>

              {/* Mobile Filter Sheet Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-hairline)] bg-white text-xs font-semibold text-[var(--text-primary)] shadow-sm touch-target"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Flight Cards / Empty State */}
            {filteredFlights.length === 0 ? (
              <div className="bg-white rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)] text-xl">
                  ✈
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  No flights match these filters
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Try broadening your departure time, raising the budget limit, or clearing airline filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2 rounded-full bg-[var(--text-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary)] transition-colors touch-target"
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

      {/* 7. Cabin Seat Map Dialog / Bottom Sheet */}
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
