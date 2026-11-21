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
      className={`fixed top-16 left-0 right-0 h-14 bg-[var(--bg-elevated)] backdrop-blur-md border-b border-[var(--border-hairline)] shadow-[var(--shadow-sticky)] z-[var(--z-sticky-header)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden={!isVisible}
    >
      <div className="max-w-[1200px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
          <span className="font-mono">{origin.code}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="font-mono">{destination.code}</span>
          <span className="text-[var(--border-strong)] mx-1">·</span>
          <span className="text-[var(--text-secondary)] font-normal text-xs hidden sm:inline">
            {new Date(departureDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            · {adultsCount} Adult · {cabinClass}
          </span>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-hairline)] bg-white hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--accent-primary)] shadow-sm transition-colors touch-target"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Search</span>
        </button>
      </div>
    </div>
  );
}
