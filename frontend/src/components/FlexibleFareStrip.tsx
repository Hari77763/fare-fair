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
    <div className="w-full max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-slate-900 text-sm">Flexible dates</span>
          <span className="text-slate-400 text-sm font-normal">December 2026</span>
        </div>
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Lowest fare of the week</span>
        </div>
      </div>

      {/* 7-Card Strip Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {dayFares.map((fare) => {
          const isSelected = fare.dateISO === selectedDate;
          return (
            <button
              key={fare.dateISO}
              type="button"
              onClick={() => onSelectDate(fare.dateISO)}
              className={`p-3.5 rounded-xl transition-all text-center select-none relative shadow-xs flex flex-col items-center justify-center ${
                isSelected
                  ? 'border-2 border-slate-900 bg-white ring-0'
                  : 'border border-slate-200/90 bg-white/90 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Day label */}
              <div
                className={`text-xs mb-1 ${
                  isSelected ? 'font-semibold text-slate-900' : 'font-normal text-slate-500'
                }`}
              >
                {fare.weekday} {fare.dayNumber}
              </div>

              {/* Price */}
              {isLoading && isSelected ? (
                <div className="h-4 w-14 mx-auto rounded skeleton-shimmer mt-0.5"></div>
              ) : (
                <div
                  className={`text-sm tabular-nums font-semibold ${
                    fare.isCheapest ? 'text-emerald-600 font-bold' : 'text-slate-900'
                  }`}
                >
                  {convertPrice(fare.lowestPriceInr, currency)}
                </div>
              )}

              {/* Green indicator dot for cheapest fare */}
              {fare.isCheapest && (
                <span
                  className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500"
                  title="Lowest fare of the week"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
