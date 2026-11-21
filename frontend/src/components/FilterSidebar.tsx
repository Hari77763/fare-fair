'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { SortOption, TimeWindow, CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export const PRICE_MIN_INR = 4000;
export const PRICE_MAX_INR = 20000;

interface FilterSidebarProps {
  sortOption: SortOption;
  onSortOptionChange: (opt: SortOption) => void;
  maxPriceInr: number;
  onMaxPriceInrChange: (val: number) => void;
  selectedStops: number[];
  onStopsChange: (stops: number[]) => void;
  selectedTimeWindows: TimeWindow[];
  onTimeWindowsChange: (windows: TimeWindow[]) => void;
  selectedAirlines: string[];
  onAirlinesChange: (airlines: string[]) => void;
  airlines: { code: string; name: string; lowestInr: number }[];
  requireCheckedBag: boolean;
  onRequireCheckedBagChange: (req: boolean) => void;
  currency: CurrencyCode;
  onResetAll: () => void;
  activeFilterCount: number;
  resultCount: number;
  isMobileSheetOpen: boolean;
  onCloseMobileSheet: () => void;
}

const SORTS: { id: SortOption; label: string }[] = [
  { id: 'best', label: 'Best' },
  { id: 'cheapest', label: 'Cheapest' },
  { id: 'fastest', label: 'Fastest' },
  { id: 'earliest', label: 'Earliest' },
];

const TIME_WINDOWS: { id: TimeWindow; label: string; range: string }[] = [
  { id: 'early', label: 'Early', range: '00–06' },
  { id: 'morning', label: 'Morning', range: '06–12' },
  { id: 'afternoon', label: 'Afternoon', range: '12–18' },
  { id: 'evening', label: 'Evening', range: '18–24' },
];

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{children}</h3>
  );
}

function Chip({
  selected,
  onClick,
  children,
  className = '',
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`whitespace-nowrap rounded-[10px] border px-2 py-2 text-xs font-medium transition-[border-color,background-color,color,transform] duration-200 active:scale-[0.97] ${
        selected
          ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  const {
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
    airlines,
    requireCheckedBag,
    onRequireCheckedBagChange,
    currency,
    onResetAll,
    activeFilterCount,
    resultCount,
    isMobileSheetOpen,
    onCloseMobileSheet,
  } = props;

  const fill = ((maxPriceInr - PRICE_MIN_INR) / (PRICE_MAX_INR - PRICE_MIN_INR)) * 100;

  const content = (
    <div className="space-y-6">
      <section>
        <SectionTitle>Sort by</SectionTitle>
        <div role="radiogroup" aria-label="Sort results" className="grid grid-cols-2 gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={sortOption === s.id}
              onClick={() => onSortOptionChange(s.id)}
              className={`rounded-[10px] px-2.5 py-2 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 ${
                sortOption === s.id
                  ? 'bg-[var(--text-primary)] text-white shadow-[0_1px_2px_rgba(11,18,32,0.2)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-baseline justify-between">
          <SectionTitle>Max price</SectionTitle>
          <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {maxPriceInr >= PRICE_MAX_INR ? 'Any' : convertPrice(maxPriceInr, currency)}
          </span>
        </div>
        <input
          type="range"
          aria-label="Maximum price"
          aria-valuetext={convertPrice(maxPriceInr, currency)}
          min={PRICE_MIN_INR}
          max={PRICE_MAX_INR}
          step={250}
          value={maxPriceInr}
          onChange={(e) => onMaxPriceInrChange(Number(e.target.value))}
          className="range"
          style={{ ['--fill' as string]: `${fill}%` }}
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-[var(--text-muted)] tabular-nums">
          <span>{convertPrice(PRICE_MIN_INR, currency)}</span>
          <span>{convertPrice(PRICE_MAX_INR, currency)}+</span>
        </div>
      </section>

      <section>
        <SectionTitle>Stops</SectionTitle>
        <div className="grid grid-cols-3 gap-1.5">
          <Chip selected={selectedStops.length === 0} onClick={() => onStopsChange([])}>
            Any
          </Chip>
          <Chip selected={selectedStops.includes(0)} onClick={() => onStopsChange(toggle(selectedStops, 0))}>
            Non-stop
          </Chip>
          <Chip selected={selectedStops.includes(1)} onClick={() => onStopsChange(toggle(selectedStops, 1))}>
            1 stop
          </Chip>
        </div>
      </section>

      <section>
        <SectionTitle>Departure time</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {TIME_WINDOWS.map((tw) => (
            <Chip
              key={tw.id}
              selected={selectedTimeWindows.includes(tw.id)}
              onClick={() => onTimeWindowsChange(toggle(selectedTimeWindows, tw.id))}
              className="text-left"
            >
              <span className="block">{tw.label}</span>
              <span className="block text-[10px] font-normal opacity-70 tabular-nums">{tw.range}</span>
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Airlines</SectionTitle>
        <ul className="-mx-2 space-y-0.5">
          {airlines.map((a) => {
            const checked = selectedAirlines.includes(a.code);
            return (
              <li key={a.code}>
                <label className="flex cursor-pointer items-center justify-between rounded-[10px] px-2 py-2 transition-colors hover:bg-[var(--bg-subtle)]">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onAirlinesChange(toggle(selectedAirlines, a.code))}
                      className="h-4 w-4 cursor-pointer rounded"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{a.name}</span>
                  </span>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums">
                    from {convertPrice(a.lowestInr, currency)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-[var(--border-hairline)] pt-5">
        <div className="flex items-center justify-between gap-3">
          <span id="bag-switch-label" className="text-sm text-[var(--text-primary)]">
            Checked bag included
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={requireCheckedBag}
            aria-labelledby="bag-switch-label"
            onClick={() => onRequireCheckedBagChange(!requireCheckedBag)}
            className="switch"
          />
        </div>
      </section>
    </div>
  );

  return (
    <>
      <aside
        aria-label="Filters"
        className="sticky hidden w-72 shrink-0 self-start glass rounded-[var(--radius-card)] p-5 lg:block"
        style={{ top: 'calc(var(--header-h) + 72px)' }}
      >
        <div className="mb-5 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onResetAll}
            disabled={activeFilterCount === 0 && sortOption === 'best'}
            className="btn btn-ghost h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
        {content}
      </aside>

      <MobileSheet open={isMobileSheetOpen} onClose={onCloseMobileSheet}>
        {(requestClose) => (
          <>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Filters</h2>
              <div className="flex items-center gap-1">
                <button type="button" onClick={onResetAll} className="btn btn-ghost h-8 px-3 text-xs">
                  Reset
                </button>
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label="Close filters"
                  className="btn btn-secondary h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{content}</div>
            <div className="border-t border-[var(--border-hairline)] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={requestClose} className="btn btn-primary h-12 w-full text-sm">
                Show {resultCount} flight{resultCount === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </MobileSheet>
    </>
  );
}

/**
 * Bottom sheet with enter/exit animation, Escape to close, scroll lock and a
 * drag-to-dismiss handle (dragging is limited to the handle so it never
 * fights with scrolling the sheet's content).
 */
function MobileSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: (requestClose: () => void) => React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ y: number; t: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    }
  }, [open]);

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      setDragY(0);
      onClose();
    }, 240);
  }, [onClose]);

  useBodyScrollLock(mounted);

  useEffect(() => {
    if (!mounted) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mounted, requestClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 lg:hidden" style={{ zIndex: 'var(--z-sheet)' }}>
      <div
        className={`absolute inset-0 bg-[rgba(11,18,32,0.42)] backdrop-blur-[2px] transition-opacity duration-300 ${
          closing ? 'opacity-0' : 'animate-in fade-in duration-300'
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 glass glass-strong flex max-h-[88vh] flex-col rounded-t-[28px] shadow-[var(--shadow-sheet)] outline-none ${
          closing ? '' : 'animate-sheet-up'
        }`}
        style={{
          transform: closing ? 'translate3d(0,100%,0)' : `translate3d(0, ${dragY}px, 0)`,
          transition: drag.current ? 'none' : 'transform 260ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          className="flex cursor-grab touch-none justify-center pb-3 pt-3 active:cursor-grabbing"
          onPointerDown={(e) => {
            drag.current = { y: e.clientY, t: performance.now() };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dy = e.clientY - drag.current.y;
            setDragY(dy > 0 ? dy : dy * 0.15);
          }}
          onPointerUp={(e) => {
            if (!drag.current) return;
            const dy = e.clientY - drag.current.y;
            const velocity = dy / Math.max(performance.now() - drag.current.t, 1);
            drag.current = null;
            if (dy > 110 || velocity > 0.6) requestClose();
            else setDragY(0);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragY(0);
          }}
          aria-hidden="true"
        >
          <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>
        {children(requestClose)}
      </div>
    </div>
  );
}
