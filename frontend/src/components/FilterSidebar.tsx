'use client';

import React, { useRef, useState } from 'react';
import { SortOption, TimeWindow, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';
import { SlidersHorizontal, RotateCcw, X, Luggage } from 'lucide-react';

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
  // Mobile physics bottom-sheet drag gesture
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    startYRef.current = e.clientY;
    startTimeRef.current = performance.now();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startYRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (dy > 0) {
      setDragY(dy);
    } else {
      // Rubber band upward resistance
      setDragY(dy * 0.2);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!startYRef.current) return;
    const dy = e.clientY - startYRef.current;
    const dt = performance.now() - startTimeRef.current;
    const vy = dy / dt; // velocity in px/ms

    if ((dy > 120 || vy > 0.5) && onCloseMobileSheet) {
      onCloseMobileSheet();
    }
    setDragY(0);
    startYRef.current = 0;
  };

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
    <div className="space-y-6 text-xs text-[var(--text-secondary)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            Filters
          </span>
        </div>
        <button
          type="button"
          onClick={onResetAll}
          className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors touch-target"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort Tabs with animated active underline */}
      <div>
        <span className="block font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Sort By
        </span>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-hairline)]">
          {(['best', 'cheapest', 'fastest', 'earliest'] as SortOption[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSortOptionChange(opt)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all touch-target ${
                sortOption === opt
                  ? 'bg-white text-[var(--accent-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Max Price
          </span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {convertPrice(maxPriceInr, currency)}
          </span>
        </div>
        <input
          type="range"
          min="4000"
          max="20000"
          step="500"
          value={maxPriceInr}
          onChange={(e) => onMaxPriceInrChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 tabular-nums">
          <span>{convertPrice(4000, currency)}</span>
          <span>{convertPrice(20000, currency)}</span>
        </div>
      </div>

      {/* Stops Segmented Control */}
      <div>
        <span className="block font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Stops
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Any', value: -1 },
            { label: 'Non-stop', value: 0 },
            { label: '1 Stop', value: 1 },
          ].map((item) => {
            const isSelected =
              item.value === -1 ? selectedStops.length === 0 : selectedStops.includes(item.value);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.value === -1) {
                    onStopsChange([]);
                  } else {
                    toggleStop(item.value);
                  }
                }}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all touch-target ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-hairline)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Departure Time 2x2 Grid */}
      <div>
        <span className="block font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Departure Time
        </span>
        <div className="grid grid-cols-2 gap-2">
          {timeWindowsMeta.map((tw) => {
            const isSelected = selectedTimeWindows.includes(tw.id);
            return (
              <button
                key={tw.id}
                type="button"
                onClick={() => toggleTimeWindow(tw.id)}
                className={`p-2.5 rounded-xl border text-left transition-all touch-target ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-hairline)] bg-white hover:border-[var(--border-strong)]'
                }`}
              >
                <div
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {tw.label}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                  {tw.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Airlines Checkbox List */}
      <div>
        <span className="block font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Airlines
        </span>
        <div className="space-y-1.5">
          {airlinesMeta.map((a) => {
            const isChecked = selectedAirlines.includes(a.code);
            return (
              <label
                key={a.code}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-subtle)] cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAirline(a.code)}
                    className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-0"
                  />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{a.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
                  {convertPrice(a.lowestInr, currency)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Baggage Switch */}
      <div className="pt-2 border-t border-[var(--border-hairline)]">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Luggage className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Checked bag included
            </span>
          </div>
          <input
            type="checkbox"
            checked={requireCheckedBag}
            onChange={(e) => onRequireCheckedBagChange(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)]"
          />
        </label>
      </div>
    </div>
  );

  // Mobile Bottom Sheet Mode
  if (isMobileSheetOpen) {
    return (
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[var(--z-sheet)] flex flex-col justify-end lg:hidden animate-in fade-in"
        onClick={onCloseMobileSheet}
      >
        <div
          ref={sheetRef}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            transform: `translate3d(0, ${Math.max(dragY, 0)}px, 0)`,
            transition: dragY === 0 ? 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
          className="bg-white rounded-[var(--radius-sheet)] max-h-[85vh] overflow-y-auto p-6 shadow-[var(--shadow-sheet)]"
        >
          {/* Centered 36x4 drag handle */}
          <div className="w-9 h-1 rounded-full bg-[var(--border-strong)] mx-auto mb-5"></div>
          {content}
        </div>
      </div>
    );
  }

  // Desktop Sticky Sidebar Mode
  return (
    <aside className="hidden lg:block w-72 shrink-0 p-5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] sticky top-20">
      {content}
    </aside>
  );
}
