'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { Airport } from '../types/flight';
import { useDismiss } from '../hooks/useDismiss';

interface AirportPickerProps {
  label: string;
  value: Airport;
  onChange: (airport: Airport) => void;
  airports: Airport[];
  /** Airport code that cannot be chosen (the other end of the route). */
  excludeCode?: string;
  /** Exposed so "Edit search" can jump straight into this field. */
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

function matches(a: Airport, q: string) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  return (
    a.code.toLowerCase().startsWith(s) ||
    a.city.toLowerCase().includes(s) ||
    a.name.toLowerCase().includes(s) ||
    a.country.toLowerCase().includes(s)
  );
}

/**
 * Accessible airport combobox: button trigger + popover with a filter input
 * and a keyboard-navigable listbox (↑/↓, Enter, Escape).
 */
export function AirportPicker({ label, value, onChange, airports, excludeCode, triggerRef }: AirportPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const localTriggerRef = useRef<HTMLButtonElement>(null);
  const buttonRef = triggerRef ?? localTriggerRef;
  const uid = useId();
  const listboxId = `${uid}-listbox`;

  // Popular airports filter instantly; typing 2+ characters also searches all
  // ~4,000 airports on the server (debounced, stale requests cancelled).
  const [remote, setRemote] = useState<{ query: string; airports: Airport[] } | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setRemote(null);
      setSearching(false);
      return;
    }
    const ctl = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const body = (await res.json()) as { airports?: Airport[] };
        if (!ctl.signal.aborted) setRemote({ query: q, airports: body.airports ?? [] });
      } catch {
        /* offline or aborted: the local popular list still works */
      } finally {
        if (!ctl.signal.aborted) setSearching(false);
      }
    }, 140);
    return () => {
      ctl.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const results = useMemo(() => {
    const local = airports.filter((a) => matches(a, query));
    const fromServer = remote && remote.query === query.trim() ? remote.airports : [];
    const seen = new Set<string>();
    return [...(fromServer.length ? fromServer : local), ...local]
      .filter((a) => a.code !== excludeCode && !seen.has(a.code) && (seen.add(a.code), true))
      .slice(0, 12);
  }, [airports, excludeCode, query, remote]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    setQuery('');
    if (restoreFocus) buttonRef.current?.focus();
  };

  useDismiss([wrapperRef], () => close(false), open);

  const select = (airport: Airport) => {
    onChange(airport);
    close(true);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) select(results[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  // Keep the highlighted option in view while arrowing through the list
  const scrollActiveIntoView = (index: number) => {
    const el = listRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          setOpen((v) => !v);
          setActiveIndex(0);
        }}
        data-open={open}
        className="field group w-full px-4 py-3 text-left"
      >
        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className="mt-1 flex items-baseline gap-2">
          <span className="truncate text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-[22px]">
            {value.city}
          </span>
          <span className="rounded-md bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
            {value.code}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{value.name}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+8px)] w-[min(22rem,calc(100vw-2rem))] origin-top-left animate-pop-in glass glass-strong rounded-[var(--radius-card)] p-2"
          style={{ zIndex: 'var(--z-popover)' }}
        >
          <label className="relative block">
            <span className="sr-only">Search {label.toLowerCase()} airports</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={results[activeIndex] ? `${uid}-opt-${results[activeIndex].code}` : undefined}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(e) => {
                onInputKeyDown(e);
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  const next =
                    e.key === 'ArrowDown'
                      ? Math.min(activeIndex + 1, results.length - 1)
                      : Math.max(activeIndex - 1, 0);
                  scrollActiveIntoView(next);
                }
              }}
              placeholder="City, airport or IATA code"
              className="input pl-9"
            />
          </label>

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={`${label} airports`}
            className="mt-2 max-h-64 overflow-y-auto overscroll-contain"
          >
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                {searching ? 'Searching airports…' : `No airports match “${query}”.`}
              </li>
            )}
            {results.map((a, i) => {
              const selected = a.code === value.code;
              const active = i === activeIndex;
              return (
                <li
                  key={a.code}
                  id={`${uid}-opt-${a.code}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(a)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-150 ${
                    active ? 'bg-[var(--bg-subtle)]' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                      {a.city}
                      {selected && <span className="ml-2 text-xs font-normal text-[var(--accent-primary)]">Selected</span>}
                    </span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {a.name} · {a.country}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md border border-[var(--border-hairline)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                    {a.code}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
