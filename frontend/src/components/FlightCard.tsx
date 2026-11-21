'use client';

import React, { useId, useRef, useState } from 'react';
import { Bookmark, Check, ChevronDown, Luggage, Utensils, RotateCcw, Users } from 'lucide-react';
import type { FlightItinerary, FareTier, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';

interface FlightCardProps {
  flight: FlightItinerary;
  currency: CurrencyCode;
  onSelectFare: (flight: FlightItinerary, tier: FareTier) => void;
  index: number;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  highlights: ('cheapest' | 'fastest')[];
}

/** Itinerary times are stored as airport-local wall clock in the ISO string. */
export function wallClock(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function FlightCard({ flight, currency, onSelectFare, index, isSaved, onToggleSave, highlights }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FareTier>(flight.fareTiers[0]);
  const cardRef = useRef<HTMLElement>(null);
  const detailsId = useId();

  const segment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const depTime = wallClock(segment.departureISO);
  const arrTime = wallClock(lastSegment.arrivalISO);
  const arrivesNextDay = lastSegment.arrivalISO.slice(0, 10) !== segment.departureISO.slice(0, 10);
  const lowSeats = flight.seatsRemaining <= 4;

  // Spotlight border follows the pointer without re-rendering
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // Highlights are computed from live fares by the page, never trusted from static tags
  const tags = highlights;

  return (
    <article
      ref={cardRef}
      onPointerMove={onPointerMove}
      data-reveal
      style={{ ['--reveal-delay' as string]: `${Math.min(index, 6) * 55}ms` }}
      aria-label={`${segment.airlineName} ${segment.flightNumber}, ${depTime} to ${arrTime}, from ${convertPrice(
        selectedTier.priceInr + selectedTier.taxesInr,
        currency
      )}`}
      className="spotlight-card rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
    >
      <div className="p-4 sm:p-6">
        {/* Tag row */}
        {(tags.length > 0 || lowSeats) && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                  t === 'cheapest'
                    ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success)]'
                    : 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                }`}
              >
                {t}
              </span>
            ))}
            {lowSeats && (
              <span className="rounded-full bg-[var(--semantic-warning-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--semantic-warning)]">
                {flight.seatsRemaining === 1 ? 'Last seat' : `${flight.seatsRemaining} seats left`} at this fare
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-12">
          {/* Airline */}
          <div className="flex items-center gap-3 md:col-span-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] font-mono text-xs font-semibold text-[var(--text-primary)]">
              {segment.airlineCode}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{segment.airlineName}</div>
              <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                <span className="font-mono">{segment.flightNumber}</span> · {segment.aircraft}
              </div>
            </div>
          </div>

          {/* Times & route */}
          <div className="flex items-center justify-between gap-3 md:col-span-6 md:px-2">
            <div>
              <div className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] tabular-nums sm:text-2xl">
                {depTime}
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                {segment.origin.code}
              </div>
            </div>

            <div className="flex-1 px-1 text-center sm:px-3">
              <div className="text-[11px] font-medium text-[var(--text-muted)] tabular-nums">
                {formatDuration(flight.totalDurationMinutes)}
              </div>
              <div className="relative my-1.5 flex items-center" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]" />
                <span className="h-px flex-1 bg-[var(--border-strong)]" />
                {flight.stops > 0 && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-warning)]" />
                    <span className="h-px flex-1 bg-[var(--border-strong)]" />
                  </>
                )}
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
              </div>
              <div
                className={`text-[11px] font-semibold ${
                  flight.stops === 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-warning)]'
                }`}
              >
                {flight.stops === 0
                  ? 'Non-stop'
                  : `${flight.stops} stop · ${flight.segments
                      .slice(0, -1)
                      .map((s) => s.destination.code)
                      .join(', ')}`}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] tabular-nums sm:text-2xl">
                {arrTime}
                {arrivesNextDay && (
                  <sup className="ml-0.5 text-[10px] font-semibold text-[var(--semantic-warning)]">+1</sup>
                )}
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                {lastSegment.destination.code}
              </div>
            </div>
          </div>

          {/* Price & actions */}
          <div className="flex items-end justify-between gap-3 border-t border-[var(--border-hairline)] pt-4 md:col-span-3 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="md:text-right">
              <div
                key={`${currency}-${selectedTier.id}`}
                className="animate-fade-up text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] tabular-nums"
              >
                {convertPrice(selectedTier.priceInr + selectedTier.taxesInr, currency)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {selectedTier.name} · incl. taxes
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleSave(flight.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? `Remove ${segment.flightNumber} from saved` : `Save ${segment.flightNumber}`}
                className={`btn h-9 w-9 p-0 ${isSaved ? 'btn-accent' : 'btn-secondary'}`}
              >
                <Bookmark className={`h-4 w-4 transition-transform duration-300 ${isSaved ? 'scale-110 fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls={detailsId}
                className="btn btn-secondary h-9 px-3 text-xs"
              >
                Fares
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-out-expo ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={() => onSelectFare(flight, selectedTier)}
                className="btn btn-primary h-9 px-4 text-xs"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable fare & segment details */}
      <div id={detailsId} className="collapsible" data-open={expanded}>
        <div className="collapsible-inner">
          <div className="border-t border-[var(--border-hairline)] px-4 pb-5 pt-5 sm:px-6">
            <ol className="mb-5 space-y-2">
              {flight.segments.map((seg) => (
                <li
                  key={seg.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] px-4 py-3 text-xs"
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    {seg.origin.city} <span className="text-[var(--text-muted)]">({seg.origin.code} · {seg.terminalOrigin})</span>
                    <span className="mx-1.5 text-[var(--text-muted)]">→</span>
                    {seg.destination.city}{' '}
                    <span className="text-[var(--text-muted)]">({seg.destination.code} · {seg.terminalDest})</span>
                  </span>
                  <span className="text-[var(--text-secondary)] tabular-nums">
                    {seg.flightNumber} · {formatDuration(seg.durationMinutes)}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Choose a fare
              </h3>
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Users className="h-3 w-3" /> {flight.onTimePercent}% on time
              </span>
            </div>

            <div role="radiogroup" aria-label="Fare options" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {flight.fareTiers.map((tier) => {
                const selected = tier.id === selectedTier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedTier(tier)}
                    className={`group relative rounded-[var(--radius-control)] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 ${
                      selected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] shadow-[0_0_0_3px_var(--accent-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span className="flex items-start justify-between">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{tier.name}</span>
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                          selected
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </span>
                    <span className="mt-2 block text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)] tabular-nums">
                      {convertPrice(tier.priceInr + tier.taxesInr, currency)}
                    </span>
                    <span className="block text-[11px] text-[var(--text-muted)] tabular-nums">
                      {convertPrice(tier.priceInr, currency)} fare + {convertPrice(tier.taxesInr, currency)} taxes
                    </span>
                    <span className="mt-3 block space-y-1.5 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-2">
                        <Luggage className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        {tier.cabinBagKg} kg cabin · {tier.checkinBagKg ? `${tier.checkinBagKg} kg check-in` : 'No check-in bag'}
                      </span>
                      <span className="flex items-center gap-2">
                        <RotateCcw className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        {!tier.cancellationFeeInr
                          ? 'Free cancellation'
                          : `${convertPrice(tier.cancellationFeeInr, currency)} cancellation fee`}
                      </span>
                      <span className="flex items-center gap-2">
                        <Utensils className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        {tier.mealIncluded ? 'Meal included' : 'Meals for purchase'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectFare(flight, selectedTier)}
                className="btn btn-accent h-10 px-5 text-sm"
              >
                Choose seat with {selectedTier.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
