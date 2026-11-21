'use client';

import React from 'react';
import { Airport, CabinClass } from '../types/flight';
import { Edit3, ArrowRight } from 'lucide-react';

interface StickyHeaderProps {
  isVisible: boolean;
  origin: Airport;
  destination: Airport;
  departureDate: string;
  adultsCount: number;
  cabinClass: CabinClass;
  onEdit: () => void;
}

export function StickyHeader({
  isVisible,
  origin,
  destination,
  departureDate,
  adultsCount,
  cabinClass,
  onEdit,
}: StickyHeaderProps) {
  return (
    <div
      className={`fixed top-16 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm z-30 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden={!isVisible}
    >
      <div className="max-w-[1140px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-900">
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">{origin.code}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">{destination.code}</span>
          <span className="text-slate-300 mx-1">·</span>
          <span className="text-slate-500 font-normal text-xs hidden sm:inline">
            {departureDate} · {adultsCount} Adult · {cabinClass}
          </span>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shadow-xs transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Search</span>
        </button>
      </div>
    </div>
  );
}
