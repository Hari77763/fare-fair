'use client';

import React, { useState, useRef } from 'react';
import { FlightItinerary, FareTier, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';
import { Clock, ShieldCheck, ChevronDown, ChevronUp, Check, Luggage, Plane } from 'lucide-react';

interface FlightCardProps {
  flight: FlightItinerary;
  currency: CurrencyCode;
  onSelectFare: (flight: FlightItinerary, tier: FareTier) => void;
  index: number;
}

export function FlightCard({ flight, currency, onSelectFare, index }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FareTier>(flight.fareTiers[0]);
  const cardRef = useRef<HTMLDivElement>(null);

  const segment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  const depTime = new Date(segment.departureISO).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const arrTime = new Date(lastSegment.arrivalISO).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const hours = Math.floor(flight.totalDurationMinutes / 60);
  const minutes = flight.totalDurationMinutes % 60;
  const durationStr = `${hours}h ${minutes}m`;

  // Zero-re-render mouse spotlight calculation
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={onPointerMove}
      className="spotlight-card bg-white rounded-[var(--radius-card)] p-5 sm:p-6 mb-4 shadow-[var(--shadow-card)] transition-all overflow-hidden"
    >
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Col 1: Airline & Number (3 cols) */}
        <div className="md:col-span-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] flex items-center justify-center font-bold text-xs font-mono text-[var(--text-primary)] shrink-0">
            {segment.airlineCode}
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {segment.airlineName}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
              <span className="font-mono">{segment.flightNumber}</span>
              <span>·</span>
              <span className="text-[11px] truncate max-w-[120px]">{segment.aircraft}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Times, Curved Route Arc & Duration (6 cols) */}
        <div className="md:col-span-6 flex items-center justify-between px-2 sm:px-4">
          {/* Departure */}
          <div className="text-left">
            <div className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {depTime}
            </div>
            <div className="text-xs font-bold text-[var(--text-secondary)] font-mono mt-0.5">
              {segment.origin.code}
            </div>
          </div>

          {/* Curved Route Arc SVG with duration & stop pill */}
          <div className="flex-1 px-4 text-center">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
              {durationStr}
            </span>
            <div className="relative my-1 flex items-center justify-center">
              {/* Smooth Minimalist Route Line */}
              <svg className="w-full h-5 overflow-visible" viewBox="0 0 160 20">
                <path
                  d="M 5 15 Q 80 -4 155 15"
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="route-arc-path"
                />
                <circle cx="5" cy="15" r="2.5" fill="var(--text-muted)" />
                <circle cx="155" cy="15" r="2.5" fill="var(--accent-primary)" />
              </svg>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                flight.stops === 0
                  ? 'bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}
            </span>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {arrTime}
            </div>
            <div className="text-xs font-bold text-[var(--text-secondary)] font-mono mt-0.5">
              {lastSegment.destination.code}
            </div>
          </div>
        </div>

        {/* Col 3: Price & Select CTA (3 cols) */}
        <div className="md:col-span-3 text-right flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-[var(--border-hairline)] pt-3 md:pt-0 md:pl-5">
          <div className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
            {convertPrice(selectedTier.priceInr + selectedTier.taxesInr, currency)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Total known payable · Zero fees
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium transition-colors"
            >
              <span>{expanded ? 'Less' : 'Details'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectFare(flight, selectedTier)}
              className="magnetic-btn px-4 py-2 rounded-[var(--radius-pill)] bg-[var(--text-primary)] hover:bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-sm transition-all touch-target"
            >
              Select Fare
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Accordion Panel */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-[var(--border-hairline)] animate-in fade-in duration-200">
          {/* Segment Details */}
          <div className="space-y-3 mb-6">
            {flight.segments.map((seg, i) => (
              <div
                key={seg.id}
                className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-xs flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {seg.origin.city} ({seg.origin.code}, {seg.terminalOrigin}) →{' '}
                    {seg.destination.city} ({seg.destination.code}, {seg.terminalDest})
                  </span>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {seg.airlineName} {seg.flightNumber} · {seg.aircraft}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] tabular-nums">
                  Duration: {Math.floor(seg.durationMinutes / 60)}h {seg.durationMinutes % 60}m
                </div>
              </div>
            ))}
          </div>

          {/* 3 Selectable Fare Tier Cards */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Choose Fare Option
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {flight.fareTiers.map((tier) => {
                const isTierSelected = tier.id === selectedTier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isTierSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] shadow-sm'
                        : 'border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-xs text-[var(--text-primary)]">
                        {tier.name}
                      </span>
                      {isTierSelected && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                    </div>

                    <div className="text-lg font-semibold text-[var(--text-primary)] mt-2 tabular-nums">
                      {convertPrice(tier.priceInr + tier.taxesInr, currency)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">Includes taxes & fees</div>

                    <ul className="mt-3 space-y-1.5 text-[11px] text-[var(--text-secondary)]">
                      <li className="flex items-center gap-1.5">
                        <Luggage className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{tier.checkinBagKg} kg Check-in bag</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]"></span>
                        <span>{tier.cancellationFeeInr ? `₹${tier.cancellationFeeInr} cancel fee` : 'Free cancel'}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]"></span>
                        <span>{tier.mealIncluded ? 'Complimentary Meal' : 'Meals chargeable'}</span>
                      </li>
                    </ul>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFare(flight, tier);
                      }}
                      className="w-full mt-4 py-2 rounded-lg bg-[var(--text-primary)] hover:bg-[var(--accent-primary)] text-white text-xs font-semibold transition-colors"
                    >
                      Choose Seat →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
