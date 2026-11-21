'use client';

import React from 'react';
import type { DayFare, CurrencyCode } from '../types/flight';
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
  const month = new Date(`${dayFares[0]?.dateISO}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <section aria-labelledby="fare-strip-title" className="mx-auto my-6 w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="fare-strip-title" className="text-sm font-semibold text-[var(--text-primary)]">
          Flexible dates <span className="hidden font-normal text-[var(--text-muted)] sm:inline">· {month}</span>
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)]" />
          Lowest fare of the week
        </span>
      </div>

      <div role="radiogroup" aria-label="Departure date" className="scroll-momentum-x -mx-1 flex gap-2 px-1 pb-1">
        {dayFares.map((fare) => {
          const selected = fare.dateISO === selectedDate;
          return (
            <button
              key={fare.dateISO}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectDate(fare.dateISO)}
              className={`relative min-w-[96px] flex-1 rounded-[var(--radius-control)] border px-3 py-3 text-center transition-[border-color,background-color,box-shadow,transform] duration-200 active:scale-[0.98] ${
                selected
                  ? 'glass-card border-[var(--text-primary)] shadow-[0_0_0_1px_var(--text-primary),0_10px_24px_-14px_rgba(30,58,138,0.45)]'
                  : 'glass-card hover:-translate-y-0.5'
              }`}
            >
              <span className="block text-[11px] font-medium text-[var(--text-muted)]">
                {fare.weekday} {fare.dayNumber}
              </span>
              {isLoading && selected ? (
                <span className="skeleton mx-auto mt-1.5 block h-4 w-14" />
              ) : (
                <span
                  className={`mt-1 block text-sm font-semibold tabular-nums ${
                    fare.isCheapest ? 'text-[var(--semantic-success)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {convertPrice(fare.lowestPriceInr, currency)}
                </span>
              )}
              {fare.isCheapest && (
                <span
                  aria-label="Cheapest day"
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
