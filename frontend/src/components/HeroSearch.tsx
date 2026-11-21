'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Check, Loader2, Minus, Plus, Search } from 'lucide-react';
import type { Airport, TripType, CabinClass } from '../types/flight';
import { AIRPORTS } from '../data/airports';
import { AirportPicker } from './AirportPicker';
import { Segmented } from './Segmented';
import { useDismiss } from '../hooks/useDismiss';

export interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

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
  passengers: Passengers;
  onPassengersChange: (p: Passengers) => void;
  cabinClass: CabinClass;
  onCabinClassChange: (c: CabinClass) => void;
  onSearch: () => void;
  isSearching: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
  originTriggerRef?: React.RefObject<HTMLButtonElement>;
}

const MAX_TRAVELLERS = 9;
const CABINS: CabinClass[] = ['Economy', 'Premium Economy', 'Business'];

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function travellerSummary(p: Passengers) {
  const total = p.adults + p.children + p.infants;
  return `${total} traveller${total === 1 ? '' : 's'}`;
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        <div className="text-xs text-[var(--text-muted)]">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="btn btn-secondary h-8 w-8 p-0"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="btn btn-secondary h-8 w-8 p-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
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
  isSearching,
  sentinelRef,
  originTriggerRef,
}: HeroSearchProps) {
  const [swapTurns, setSwapTurns] = useState(0);
  const [travellersOpen, setTravellersOpen] = useState(false);
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  const travellersRef = useRef<HTMLDivElement>(null);

  // Computed after mount so server and client markup match.
  useEffect(() => setMinDate(todayISO()), []);
  useDismiss([travellersRef], () => setTravellersOpen(false), travellersOpen);

  const isRoundTrip = tripType === 'round-trip';
  const returnInvalid = isRoundTrip && !!returnDate && returnDate < departureDate;
  const total = passengers.adults + passengers.children + passengers.infants;

  const handleSwap = () => {
    setSwapTurns((t) => t + 1);
    onOriginChange(destination);
    onDestinationChange(origin);
  };

  const handleDepartureChange = (value: string) => {
    onDepartureDateChange(value);
    // Keep the return date valid instead of silently allowing an impossible trip
    if (returnDate && value && returnDate < value) onReturnDateChange(value);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching || returnInvalid || !departureDate) return;
    onSearch();
  };

  return (
    <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-6 pt-10 sm:px-6 sm:pt-16 lg:px-8">
      {/* Editorial headline */}
      <div className="mx-auto mb-9 max-w-2xl text-center sm:mb-11">
        <p className="mb-4 inline-flex animate-fade-up items-center gap-2 glass-card rounded-full px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)]" />
          Independent · Zero FairFare markup
        </p>
        <h1
          className="animate-fade-up text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-primary)] sm:text-[56px]"
          style={{ animationDelay: '60ms' }}
        >
          Pure aviation <span className="text-liquid">metasearch.</span>
        </h1>
        <p
          className="mx-auto mt-4 max-w-lg animate-fade-up text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-[17px]"
          style={{ animationDelay: '120ms' }}
        >
          Every fare itemised, every seller ranked twice — cheapest overall and cheapest you can trust.
        </p>
      </div>

      {/* Search card */}
      <form
        onSubmit={submit}
        aria-label="Flight search"
        className="glass animate-fade-up rounded-[26px] p-3 sm:p-5"
        style={{ animationDelay: '180ms', zIndex: 'var(--z-base)' }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <Segmented<TripType>
            ariaLabel="Trip type"
            size="sm"
            value={tripType}
            onChange={(t) => {
              onTripTypeChange(t);
              if (t === 'round-trip' && !returnDate) onReturnDateChange(departureDate);
            }}
            options={[
              { value: 'round-trip', label: 'Round trip' },
              { value: 'one-way', label: 'One way' },
              { value: 'multi-city', label: 'Multi-city', disabled: true, hint: 'Multi-city search is coming soon' },
            ]}
          />
          <span className="hidden items-center gap-2 text-xs text-[var(--text-muted)] sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--semantic-success)]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--semantic-success)]" />
            </span>
            GDS & NDC availability (demo)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-stretch">
          {/* Route */}
          <div className="relative grid grid-cols-1 gap-2 md:col-span-6 md:grid-cols-2">
            <AirportPicker
              label="From"
              value={origin}
              onChange={onOriginChange}
              airports={AIRPORTS}
              excludeCode={destination.code}
              triggerRef={originTriggerRef}
            />
            <AirportPicker
              label="To"
              value={destination}
              onChange={onDestinationChange}
              airports={AIRPORTS}
              excludeCode={origin.code}
            />
            <button
              type="button"
              onClick={handleSwap}
              aria-label={`Swap ${origin.city} and ${destination.city}`}
              className="btn btn-secondary absolute left-1/2 top-1/2 z-[2] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rotate-90 p-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] md:rotate-0"
            >
              <ArrowLeftRight
                className="h-4 w-4 transition-transform duration-500 ease-out-quint"
                style={{ transform: `rotate(${swapTurns * 180}deg)` }}
              />
            </button>
          </div>

          {/* Dates */}
          <div className={`grid gap-2 md:col-span-4 ${isRoundTrip ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <label className="field block cursor-pointer px-4 py-3">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Depart
              </span>
              <input
                type="date"
                required
                value={departureDate}
                min={minDate}
                onChange={(e) => handleDepartureChange(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none"
              />
            </label>
            {isRoundTrip && (
              <label className="field block animate-pop-in cursor-pointer px-4 py-3" aria-invalid={returnInvalid}>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Return
                </span>
                <input
                  type="date"
                  value={returnDate ?? ''}
                  min={departureDate || minDate}
                  onChange={(e) => onReturnDateChange(e.target.value || undefined)}
                  aria-invalid={returnInvalid}
                  aria-describedby={returnInvalid ? 'return-error' : undefined}
                  className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none"
                />
              </label>
            )}
          </div>

          {/* Travellers & cabin */}
          <div ref={travellersRef} className="relative md:col-span-2">
            <button
              type="button"
              onClick={() => setTravellersOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={travellersOpen}
              data-open={travellersOpen}
              className="field h-full w-full px-4 py-3 text-left"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Travellers
              </span>
              <span className="mt-1.5 block truncate text-sm font-semibold text-[var(--text-primary)]">
                {travellerSummary(passengers)}
              </span>
              <span className="block truncate text-xs text-[var(--text-muted)]">{cabinClass}</span>
            </button>

            {travellersOpen && (
              <div
                role="dialog"
                aria-label="Travellers and cabin"
                className="absolute right-0 top-[calc(100%+8px)] w-[min(20rem,calc(100vw-2rem))] origin-top-right animate-pop-in glass glass-strong rounded-[var(--radius-card)] p-4"
                style={{ zIndex: 'var(--z-popover)' }}
              >
                <div className="divide-y divide-[var(--border-hairline)]">
                  <Stepper
                    label="Adults"
                    hint="12+ years"
                    value={passengers.adults}
                    min={1}
                    max={MAX_TRAVELLERS - passengers.children - passengers.infants}
                    onChange={(adults) =>
                      onPassengersChange({
                        ...passengers,
                        adults,
                        // Each infant must travel on an adult's lap
                        infants: Math.min(passengers.infants, adults),
                      })
                    }
                  />
                  <Stepper
                    label="Children"
                    hint="2–11 years"
                    value={passengers.children}
                    min={0}
                    max={MAX_TRAVELLERS - passengers.adults - passengers.infants}
                    onChange={(children) => onPassengersChange({ ...passengers, children })}
                  />
                  <Stepper
                    label="Infants"
                    hint="Under 2, on lap"
                    value={passengers.infants}
                    min={0}
                    max={Math.min(passengers.adults, MAX_TRAVELLERS - passengers.adults - passengers.children)}
                    onChange={(infants) => onPassengersChange({ ...passengers, infants })}
                  />
                </div>
                {total >= MAX_TRAVELLERS && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">Up to 9 travellers per booking.</p>
                )}

                <div className="mt-3 border-t border-[var(--border-hairline)] pt-3">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Cabin
                  </div>
                  <div role="radiogroup" aria-label="Cabin class" className="space-y-1">
                    {CABINS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={cabinClass === c}
                        onClick={() => onCabinClassChange(c)}
                        className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-sm transition-colors ${
                          cabinClass === c
                            ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        {c}
                        {cabinClass === c && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTravellersOpen(false)}
                  className="btn btn-primary mt-4 h-10 w-full text-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 px-1 sm:flex-row">
          <p id="return-error" role={returnInvalid ? 'alert' : undefined} className="text-xs text-[var(--text-muted)]">
            {returnInvalid ? (
              <span className="text-[var(--semantic-danger)]">Return date must be on or after departure.</span>
            ) : (
              <>Prices include mandatory taxes. Seller fees shown before you leave FairFare.</>
            )}
          </p>
          <button
            type="submit"
            disabled={isSearching || returnInvalid}
            aria-busy={isSearching}
            className="btn btn-primary h-12 w-full px-8 text-sm sm:w-auto"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isSearching ? 'Searching sellers…' : 'Search flights'}
          </button>
        </div>
      </form>

      {/* Observed by the page to reveal the compact sticky summary */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
    </div>
  );
}
