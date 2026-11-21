'use client';

import React from 'react';
import { ArrowRight, Pencil } from 'lucide-react';
import type { Airport, CabinClass } from '../types/flight';

interface StickyHeaderProps {
  isVisible: boolean;
  origin: Airport;
  destination: Airport;
  departureDate: string;
  returnDate?: string;
  travellers: number;
  cabinClass: CabinClass;
  onEdit: () => void;
}

function shortDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Compact search summary that slides in below the header once the hero scrolls away. */
export function StickyHeader({
  isVisible,
  origin,
  destination,
  departureDate,
  returnDate,
  travellers,
  cabinClass,
  onEdit,
}: StickyHeaderProps) {
  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed inset-x-0 px-3 transition-[transform,opacity] duration-500 ease-out-expo sm:px-4 ${
        isVisible ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-3 scale-[0.98] opacity-0'
      }`}
      style={{ top: 'calc(var(--header-h) + 6px)', zIndex: 'calc(var(--z-sticky-header) - 1)' }}
    >
      <div className="glass mx-auto flex h-11 max-w-[760px] items-center justify-between gap-3 rounded-full pl-4 pr-1.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-mono font-semibold text-[var(--text-primary)]">{origin.code}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          <span className="font-mono font-semibold text-[var(--text-primary)]">{destination.code}</span>
          <span className="truncate text-xs text-[var(--text-muted)]">
            <span className="mx-1.5">·</span>
            {shortDate(departureDate)}
            {returnDate ? ` – ${shortDate(returnDate)}` : ''}
            <span className="hidden sm:inline">
              <span className="mx-1.5">·</span>
              {travellers} traveller{travellers === 1 ? '' : 's'} · {cabinClass}
            </span>
          </span>
        </div>
        <button
          type="button"
          tabIndex={isVisible ? 0 : -1}
          onClick={onEdit}
          className="btn btn-secondary h-8 shrink-0 px-3 text-xs"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
    </div>
  );
}
