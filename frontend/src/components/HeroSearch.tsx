'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Airport, TripType, CabinClass } from '../types/flight';
import { majorAirports } from '../data/mockFlights';
import { ArrowLeftRight, Calendar, Users, MapPin, ChevronDown, Check, X } from 'lucide-react';

interface HeroSearchProps {
  tripType: TripType;
  onTripTypeChange: (t: TripType) => void;
  origin: Airport;
  onOriginChange: (a: Airport) => void;
  destination: Airport;
  onDestinationChange: (a: Airport) => void;
  departureDate: string;
  onDepartureDateChange: (d: string) => void;
  returnDate?: string;
  onReturnDateChange: (d?: string) => void;
  passengers: { adults: number; children: number; infants: number };
  onPassengersChange: (p: { adults: number; children: number; infants: number }) => void;
  cabinClass: CabinClass;
  onCabinClassChange: (c: CabinClass) => void;
  onSearch: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  originInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HeroSearch({
  tripType,
  onTripTypeChange,
  origin,
  onOriginChange,
  destination,
  onDestinationChange,
  departureDate,
  onDepartureDateChange,
  returnDate,
  onReturnDateChange,
  passengers,
  onPassengersChange,
  cabinClass,
  onCabinClassChange,
  onSearch,
  sentinelRef,
  originInputRef,
}: HeroSearchProps) {
  // Combobox popover states
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  // Swap animation trigger
  const handleSwap = () => {
    setIsSwapping(true);
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
    setTimeout(() => setIsSwapping(false), 240);
  };

  const filteredOriginAirports = majorAirports.filter(
    (a) =>
      a.code !== destination.code &&
      (a.code.toLowerCase().includes(originQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(originQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(originQuery.toLowerCase()))
  );

  const filteredDestAirports = majorAirports.filter(
    (a) =>
      a.code !== origin.code &&
      (a.code.toLowerCase().includes(destQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(destQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(destQuery.toLowerCase()))
  );

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  return (
    <div className="w-full max-w-[1200px] mx-auto pt-8 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Editorial Headline */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 select-none">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)] leading-[1.12]">
          Pure aviation metasearch.
        </h1>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base mt-3 font-normal leading-relaxed">
          Zero hidden checkout fees. Dual price rankings across all certified carriers.
        </p>
      </div>

      {/* Main Unified Search Card */}
      <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-card)] p-4 sm:p-6 lg:p-7 relative z-[var(--z-base)]">
        {/* Trip Type Segmented Control with animated sliding pill */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-hairline)]">
          <div className="inline-flex items-center bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-hairline)] text-xs font-semibold">
            {(['round-trip', 'one-way', 'multi-city'] as TripType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onTripTypeChange(type)}
                className={`px-4 py-1.5 rounded-full capitalize transition-all touch-target ${
                  tripType === type
                    ? 'bg-white text-[var(--accent-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--semantic-success)]"></span>
            <span>Real-time GDS & NDC Availability</span>
          </div>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin Combobox (4 cols) */}
          <div className="md:col-span-4 relative">
            <div
              onClick={() => {
                setOriginOpen(true);
                setDestOpen(false);
              }}
              className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] bg-white cursor-pointer transition-colors"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                From
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
                  {origin.city}
                </span>
                <span className="text-xs font-bold font-mono px-1.5 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded">
                  {origin.code}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{origin.name}</div>
            </div>

            {/* Origin Popover */}
            {originOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-[var(--radius-control)] shadow-xl border border-[var(--border-hairline)] p-3 z-[var(--z-popover)]">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)] mb-2">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                    Select Origin
                  </span>
                  <button onClick={() => setOriginOpen(false)} className="text-[var(--text-muted)] p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  ref={originInputRef}
                  placeholder="Type city or IATA (e.g. DEL)"
                  value={originQuery}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] mb-2 outline-none focus:border-[var(--accent-primary)]"
                />
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredOriginAirports.map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => {
                        onOriginChange(a);
                        setOriginOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-[var(--accent-soft)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{a.city}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{a.name}</div>
                      </div>
                      <span className="font-mono font-bold text-xs bg-[var(--bg-subtle)] px-2 py-0.5 rounded">
                        {a.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Swap Button (1 col or centered micro-button) */}
          <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
            <button
              type="button"
              onClick={handleSwap}
              className={`w-10 h-10 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-transform touch-target ${
                isSwapping ? 'rotate-180' : ''
              }`}
              style={{ transitionDuration: '240ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
              aria-label="Swap origin and destination"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Combobox (4 cols) */}
          <div className="md:col-span-4 relative">
            <div
              onClick={() => {
                setDestOpen(true);
                setOriginOpen(false);
              }}
              className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] bg-white cursor-pointer transition-colors"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                To
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
                  {destination.city}
                </span>
                <span className="text-xs font-bold font-mono px-1.5 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded">
                  {destination.code}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                {destination.name}
              </div>
            </div>

            {/* Destination Popover */}
            {destOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-[var(--radius-control)] shadow-xl border border-[var(--border-hairline)] p-3 z-[var(--z-popover)]">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)] mb-2">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                    Select Destination
                  </span>
                  <button onClick={() => setDestOpen(false)} className="text-[var(--text-muted)] p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type city or IATA (e.g. BOM)"
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] mb-2 outline-none focus:border-[var(--accent-primary)]"
                />
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredDestAirports.map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => {
                        onDestinationChange(a);
                        setDestOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-[var(--accent-soft)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{a.city}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{a.name}</div>
                      </div>
                      <span className="font-mono font-bold text-xs bg-[var(--bg-subtle)] px-2 py-0.5 rounded">
                        {a.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date & Travelers (3 cols) */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            {/* Departure Date */}
            <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-hairline)] bg-white">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Departure
              </span>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => onDepartureDateChange(e.target.value)}
                className="w-full mt-1 text-xs font-semibold text-[var(--text-primary)] bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Travelers & Cabin Trigger */}
            <div
              onClick={() => setPassengersOpen(!passengersOpen)}
              className="p-3 rounded-[var(--radius-control)] border border-[var(--border-hairline)] bg-white cursor-pointer relative"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Travelers
              </span>
              <div className="text-xs font-semibold text-[var(--text-primary)] mt-1 truncate">
                {totalPassengers} {totalPassengers === 1 ? 'Adult' : 'Pax'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">{cabinClass}</div>

              {/* Passengers Drawer / Popover */}
              {passengersOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-2 w-64 bg-white rounded-[var(--radius-control)] shadow-2xl border border-[var(--border-hairline)] p-4 z-[var(--z-popover)] animate-in fade-in zoom-in-95"
                >
                  <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border-hairline)]">
                    Travelers & Cabin
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">Adults</span>
                      <span className="block text-[10px] text-[var(--text-muted)]">Age 12+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={passengers.adults <= 1}
                        onClick={() =>
                          onPassengersChange({ ...passengers, adults: Math.max(1, passengers.adults - 1) })
                        }
                        className="w-6 h-6 rounded-full border border-[var(--border-hairline)] font-bold disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="tabular-nums font-semibold w-4 text-center">
                        {passengers.adults}
                      </span>
                      <button
                        type="button"
                        disabled={passengers.adults >= 9}
                        onClick={() =>
                          onPassengersChange({ ...passengers, adults: passengers.adults + 1 })
                        }
                        className="w-6 h-6 rounded-full border border-[var(--border-hairline)] font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cabin Class Selection */}
                  <div className="mt-3 pt-2 border-t border-[var(--border-hairline)]">
                    <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Cabin Class
                    </span>
                    {(['Economy', 'Premium Economy', 'Business'] as CabinClass[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onCabinClassChange(c);
                          setPassengersOpen(false);
                        }}
                        className={`w-full text-left text-xs py-1.5 px-2 rounded-lg flex items-center justify-between ${
                          cabinClass === c
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        <span>{c}</span>
                        {cabinClass === c && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Action CTA with Magnetic Spring Behavior */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onSearch}
            className="magnetic-btn px-10 py-3.5 rounded-[var(--radius-pill)] bg-[var(--text-primary)] hover:bg-[var(--accent-primary)] text-white font-semibold text-sm tracking-wide shadow-md hover:shadow-lg transition-all touch-target"
          >
            Search Flights
          </button>
        </div>
      </div>

      {/* 1px Sentinel Element Observed by IntersectionObserver */}
      <div ref={sentinelRef} className="h-[1px] w-full" aria-hidden="true" />
    </div>
  );
}
