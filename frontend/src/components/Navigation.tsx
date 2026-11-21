'use client';

import React, { useState } from 'react';
import { CurrencyCode } from '../types/flight';
import { Bookmark } from 'lucide-react';

interface NavigationProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  savedCount: number;
}

export function Navigation({ currency, onCurrencyChange, savedCount }: NavigationProps) {
  const [activeTab, setActiveTab] = useState<'flights' | 'compare' | 'alerts' | 'how' | 'about'>('flights');

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 transition-all">
      <div className="max-w-[1200px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand: Black Squircle Delta Icon + FairFare Wordmark */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <svg
              className="w-4 h-4 text-white fill-current"
              viewBox="0 0 24 24"
            >
              {/* Delta wing mark */}
              <path d="M12 3L3 20l9-4 9 4L12 3z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">
            FairFare
          </span>
        </div>

        {/* Center Navigation Links (Hidden on small mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 p-1 rounded-full border border-slate-200/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('flights')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'flights'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/70'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Flights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              activeTab === 'compare'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/70'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Compare sellers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              activeTab === 'alerts'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/70'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Price alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('how')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              activeTab === 'how'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/70'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              activeTab === 'about'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/70'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            About
          </button>
        </nav>

        {/* Right Controls: Live Currency Switcher & Saved Pill */}
        <div className="flex items-center gap-2.5">
          {/* Currency Switcher */}
          <div className="inline-flex items-center bg-slate-100/70 p-0.5 rounded-full border border-slate-200/60 text-xs font-medium">
            {(['INR', 'USD', 'EUR'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCurrencyChange(c)}
                className={`px-2.5 py-1 rounded-full transition-all tabular-nums ${
                  currency === c
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '€ EUR'}
              </button>
            ))}
          </div>

          {/* Saved Flights Pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white/80 hover:bg-white text-xs font-medium text-slate-700 shadow-xs transition-colors"
            aria-label={`Saved flights: ${savedCount}`}
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            <span>Saved {savedCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
