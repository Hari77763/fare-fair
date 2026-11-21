'use client';

import React from 'react';
import { CurrencyCode } from '../types/flight';
import { Bookmark, Globe } from 'lucide-react';

interface NavigationProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  savedCount: number;
}

export function Navigation({ currency, onCurrencyChange, savedCount }: NavigationProps) {
  return (
    <nav
      className="w-full h-16 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] backdrop-blur-md sticky top-0 z-[var(--z-sticky-header)] transition-colors"
      style={{ zIndex: 'var(--z-sticky-header)' }}
    >
      <div className="max-w-[1200px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Geometric Aviation Mark + Wordmark */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)] text-white flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-[var(--semantic-success)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Clean Swiss-style minimalist delta plane */}
              <path d="M12 2L2 19l10-4 10 4L12 2z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-xl tracking-tight text-[var(--text-primary)]">
              Fare<span className="text-[var(--accent-primary)] font-bold">Fair</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-l border-[var(--border-hairline)] pl-2 ml-1">
              Metasearch
            </span>
          </div>
        </div>

        {/* Right Controls: Live Currency Switcher & Saved Pill */}
        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <div className="relative inline-flex items-center bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-hairline)] text-xs font-semibold">
            {(['INR', 'USD', 'EUR'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCurrencyChange(c)}
                className={`px-2.5 py-1 rounded-full transition-all tabular-nums touch-target ${
                  currency === c
                    ? 'bg-white text-[var(--accent-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '€ EUR'}
              </button>
            ))}
          </div>

          {/* Saved Flights Pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-secondary)] transition-colors touch-target"
            aria-label={`Saved flights: ${savedCount}`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
