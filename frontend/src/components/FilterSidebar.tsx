'use client';

import React from 'react';
import { SortOption, TimeWindow, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';
import { RotateCcw, X, Luggage } from 'lucide-react';

interface FilterSidebarProps {
  sortOption: SortOption;
  onSortOptionChange: (opt: SortOption) => void;
  maxPriceInr: number;
  onMaxPriceInrChange: (val: number) => void;
  selectedStops: number[]; // e.g. [0] for non-stop
  onStopsChange: (stops: number[]) => void;
  selectedTimeWindows: TimeWindow[];
  onTimeWindowsChange: (windows: TimeWindow[]) => void;
  selectedAirlines: string[];
  onAirlinesChange: (airlines: string[]) => void;
  requireCheckedBag: boolean;
  onRequireCheckedBagChange: (req: boolean) => void;
  currency: CurrencyCode;
  onResetAll: () => void;
  isMobileSheetOpen?: boolean;
  onCloseMobileSheet?: () => void;
}

export function FilterSidebar({
  sortOption,
  onSortOptionChange,
  maxPriceInr,
  onMaxPriceInrChange,
  selectedStops,
  onStopsChange,
  selectedTimeWindows,
  onTimeWindowsChange,
  selectedAirlines,
  onAirlinesChange,
  requireCheckedBag,
  onRequireCheckedBagChange,
  currency,
  onResetAll,
  isMobileSheetOpen,
  onCloseMobileSheet,
}: FilterSidebarProps) {
  const airlinesMeta = [
    { code: '6E', name: 'IndiGo', lowestInr: 4190 },
    { code: 'AI', name: 'Air India', lowestInr: 4890 },
    { code: 'QP', name: 'Akasa Air', lowestInr: 4620 },
    { code: 'UK', name: 'Vistara', lowestInr: 5200 },
    { code: 'SG', name: 'SpiceJet', lowestInr: 4580 },
  ];

  const timeWindowsMeta: { id: TimeWindow; label: string; desc: string }[] = [
    { id: 'early', label: 'Before 6 AM', desc: '00:00 – 06:00' },
    { id: 'morning', label: '6 AM – 12 PM', desc: '06:00 – 12:00' },
    { id: 'afternoon', label: '12 PM – 6 PM', desc: '12:00 – 18:00' },
    { id: 'evening', label: 'After 6 PM', desc: '18:00 – 24:00' },
  ];

  const toggleStop = (stop: number) => {
    if (selectedStops.includes(stop)) {
      onStopsChange(selectedStops.filter((s) => s !== stop));
    } else {
      onStopsChange([...selectedStops, stop]);
    }
  };

  const toggleTimeWindow = (w: TimeWindow) => {
    if (selectedTimeWindows.includes(w)) {
      onTimeWindowsChange(selectedTimeWindows.filter((tw) => tw !== w));
    } else {
      onTimeWindowsChange([...selectedTimeWindows, w]);
    }
  };

  const toggleAirline = (code: string) => {
    if (selectedAirlines.includes(code)) {
      onAirlinesChange(selectedAirlines.filter((a) => a !== code));
    } else {
      onAirlinesChange([...selectedAirlines, code]);
    }
  };

  const content = (
    <div className="space-y-6 text-xs text-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="font-bold text-sm text-slate-900">
          Filters
        </span>
        <button
          type="button"
          onClick={onResetAll}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* SORT BY: 2x2 grid */}
      <div>
        <span className="block font-semibold uppercase tracking-wider text-[10px] text-slate-400 mb-2">
          SORT BY
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'best', label: 'Best' },
              { id: 'cheapest', label: 'Cheapest' },
              { id: 'fastest', label: 'Fastest' },
              { id: 'earliest', label: 'Earliest' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSortOptionChange(item.id)}
              className={`py-2 px-3 rounded-xl text-xs font-medium text-center transition-all ${
                sortOption === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Maximum Price Range Slider */}
      <div className="pt-2">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
            Max Price
          </span>
          <span className="font-bold text-slate-900 tabular-nums">
            {convertPrice(maxPriceInr, currency)}
          </span>
        </div>
        <input
          type="range"
          min={3000}
          max={25000}
          step={500}
          value={maxPriceInr}
          onChange={(e) => onMaxPriceInrChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
          <span>{convertPrice(3000, currency)}</span>
          <span>{convertPrice(25000, currency)}</span>
        </div>
      </div>

      {/* Stops */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block font-semibold uppercase tracking-wider text-[10px] text-slate-400 mb-2">
          Stops
        </span>
        <div className="space-y-1.5">
          {[
            { stops: 0, label: 'Non-stop only' },
            { stops: 1, label: '1 Stop' },
            { stops: 2, label: '2+ Stops' },
          ].map((item) => {
            const isChecked = selectedStops.includes(item.stops);
            return (
              <label
                key={item.stops}
                onClick={() => toggleStop(item.stops)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 border-slate-300 pointer-events-none"
                  />
                  <span className="font-medium text-slate-800">{item.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Departure Time Windows */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block font-semibold uppercase tracking-wider text-[10px] text-slate-400 mb-2">
          Departure Time
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {timeWindowsMeta.map((w) => {
            const isChecked = selectedTimeWindows.includes(w.id);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleTimeWindow(w.id)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-semibold shadow-xs'
                    : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-[11px]">{w.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{w.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Airlines */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block font-semibold uppercase tracking-wider text-[10px] text-slate-400 mb-2">
          Airlines
        </span>
        <div className="space-y-1">
          {airlinesMeta.map((airline) => {
            const isChecked = selectedAirlines.includes(airline.code);
            return (
              <label
                key={airline.code}
                onClick={() => toggleAirline(airline.code)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 border-slate-300 pointer-events-none"
                  />
                  <span className="font-medium text-slate-800">{airline.name}</span>
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  from {convertPrice(airline.lowestInr, currency)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Checked Bag Included Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label
          onClick={() => onRequireCheckedBagChange(!requireCheckedBag)}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Luggage className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-800">Includes checked bag</span>
          </div>
          <input
            type="checkbox"
            checked={requireCheckedBag}
            readOnly
            className="w-4 h-4 rounded text-blue-600 focus:ring-0 border-slate-300 pointer-events-none"
          />
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-4">
        {content}
      </aside>

      {/* Mobile Modal Drawer */}
      {isMobileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileSheet}
          />
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl p-5 shadow-2xl overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="font-bold text-base text-slate-900">Filters</span>
              <button
                type="button"
                onClick={onCloseMobileSheet}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {content}
            <div className="mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onCloseMobileSheet}
                className="w-full py-3 rounded-full bg-slate-900 text-white font-semibold text-xs text-center shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
