'use client';

import React, { useState } from 'react';
import { FlightItinerary, FareTier, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';
import { ChevronDown, ChevronUp, Check, Luggage, ShieldCheck } from 'lucide-react';

interface FlightCardProps {
  flight: FlightItinerary;
  currency: CurrencyCode;
  onSelectFare: (flight: FlightItinerary, tier: FareTier) => void;
  index: number;
}

export function FlightCard({ flight, currency, onSelectFare, index }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FareTier>(flight.fareTiers[0]);

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

  const lowestFareTotal = selectedTier.priceInr + selectedTier.taxesInr;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all mb-4">
      {/* Top Badges Row */}
      <div className="flex items-center gap-2 mb-3.5 flex-wrap">
        {flight.tags.includes('cheapest') && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Cheapest
          </span>
        )}
        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}
        </span>
        <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-full">
          On-time {flight.onTimePercent}%
        </span>
        {flight.seatsRemaining <= 3 && (
          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
            Only {flight.seatsRemaining} seats left
          </span>
        )}
      </div>

      {/* Main Grid: Airline, Times/Route, Price */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Col 1: Airline & Number (3 cols) */}
        <div className="md:col-span-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs font-mono text-slate-800 shrink-0">
            {segment.airlineCode}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {segment.airlineName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span className="font-mono font-medium">{segment.flightNumber}</span>
              <span>·</span>
              <span className="text-[11px] truncate max-w-[120px]">{segment.aircraft}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Departure, Flight Arc & Arrival (6 cols) */}
        <div className="md:col-span-6 flex items-center justify-between px-2 sm:px-4">
          {/* Departure */}
          <div className="text-left">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {depTime}
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono mt-0.5">
              {segment.origin.code}
            </div>
          </div>

          {/* Minimalist Arc Line & Duration */}
          <div className="flex-1 px-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {durationStr}
            </span>
            <div className="relative my-1 flex items-center justify-center">
              <div className="w-full h-[1px] bg-slate-200 relative">
                <span className="absolute -top-1.5 right-1/2 translate-x-1/2 text-slate-400 text-[10px]">
                  ✈
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Direct
            </span>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {arrTime}
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono mt-0.5">
              {lastSegment.destination.code}
            </div>
          </div>
        </div>

        {/* Col 3: Price & Action CTA (3 cols) */}
        <div className="md:col-span-3 text-right flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {convertPrice(lowestFareTotal, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Base + Taxes · Zero fees
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
            >
              <span>{expanded ? 'Less' : 'Details'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectFare(flight, selectedTier)}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Select
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Fare Tiers Breakdown */}
      {expanded && (
        <div className="mt-5 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Available Fare Tiers & Itemised Breakdown
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {flight.fareTiers.map((tier) => {
              const isSelected = selectedTier.id === tier.id;
              const totalTier = tier.priceInr + tier.taxesInr;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900">{tier.name}</span>
                    <span className="font-bold text-xs text-slate-900 tabular-nums">
                      {convertPrice(totalTier, currency)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2.5">
                    Base: {convertPrice(tier.priceInr, currency)} + Tax: {convertPrice(tier.taxesInr, currency)}
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{tier.cabinBagKg} kg Cabin bag</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{tier.checkinBagKg} kg Check-in baggage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{tier.mealIncluded ? 'Complimentary meal' : 'Meals chargeable'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{tier.cancellationFeeInr ? `Cancel fee: ₹${tier.cancellationFeeInr}` : 'Free cancellation'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
