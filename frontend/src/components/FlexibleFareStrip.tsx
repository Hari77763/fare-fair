'use client';

import React from 'react';
import { DayFare, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';

interface FlexibleFareStripProps {
  dayFares: DayFare[];
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  currency: CurrencyCode;
  isLoading: boolean;
}

export function FlexibleFareStrip({
  dayFares,
  selectedDate,
  onSelectDate,
  currency,
  isLoading,
}: FlexibleFareStripProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-6">
      <div className="flex items-center justify-between mb-3 text-xs text-[var(--text-secondary)]">
        <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          7-Day Flexible Fare Strip
        </span>
        <span className="text-[11px] text-[var(--semantic-success)] font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--semantic-success)]"></span>
          Lowest fare highlighted
        </span>
      </div>

      {/* Horizontal Momentum Scroll on Touch Devices */}
      <div className="scroll-momentum-x flex gap-2.5 pb-2">
        {dayFares.map((fare) => {
          const isSelected = fare.dateISO === selectedDate;
          return (
            <button
              key={fare.dateISO}
              type="button"
              onClick={() => onSelectDate(fare.dateISO)}
              className={`flex-1 min-w-[108px] p-3 rounded-[var(--radius-control)] border transition-all text-center select-none touch-target ${
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] shadow-sm'
                  : 'border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {fare.weekday}, {fare.dayNumber}
              </div>

              {isLoading && isSelected ? (
                <div className="h-5 w-16 mx-auto mt-1.5 rounded skeleton-shimmer"></div>
              ) : (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {convertPrice(fare.lowestPriceInr, currency)}
                  </span>
                  {fare.isCheapest && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-success)]"
                      title="Cheapest day"
                    ></span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
