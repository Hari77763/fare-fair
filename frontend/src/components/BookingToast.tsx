'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { CurrencyCode } from '../types/flight';
import { convertPrice } from '../data/mockFlights';

interface BookingToastProps {
  isOpen: boolean;
  onClose: () => void;
  bookingRef: string;
  flightNumber: string;
  route: string;
  seatId: string;
  totalInr: number;
  currency: CurrencyCode;
}

const AUTO_DISMISS_MS = 7000;

export function BookingToast({
  isOpen,
  onClose,
  bookingRef,
  flightNumber,
  route,
  seatId,
  totalInr,
  currency,
}: BookingToastProps) {
  const [closing, setClosing] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(AUTO_DISMISS_MS);
  const startedAt = useRef(0);

  // Reset whenever a new confirmation arrives
  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      remaining.current = AUTO_DISMISS_MS;
    }
  }, [isOpen, bookingRef]);

  // Auto-dismiss, paused while hovered or focused
  useEffect(() => {
    if (!isOpen || paused || closing) return;
    startedAt.current = Date.now();
    const id = window.setTimeout(() => setClosing(true), remaining.current);
    return () => {
      window.clearTimeout(id);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [isOpen, paused, closing, bookingRef]);

  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(onClose, 220);
    return () => window.clearTimeout(id);
  }, [closing, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`fixed inset-x-3 bottom-3 overflow-hidden rounded-[var(--radius-card)] bg-[var(--bg-inverse)] text-white shadow-[var(--shadow-float)] transition-[opacity,transform] duration-200 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem] ${
        closing ? 'translate-y-2 opacity-0' : 'animate-in fade-in slide-in-from-bottom-4 duration-300'
      }`}
      style={{ zIndex: 'var(--z-toast)' }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="text-sm font-semibold">Seat held — handing over to seller</span>
          </div>
          <button
            type="button"
            onClick={() => setClosing(true)}
            aria-label="Dismiss"
            className="-m-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <dt className="text-slate-400">Flight</dt>
          <dd className="text-right font-medium">
            {flightNumber} · {route}
          </dd>
          <dt className="text-slate-400">Seat</dt>
          <dd className="text-right font-medium">{seatId}</dd>
          <dt className="text-slate-400">Reference</dt>
          <dd className="text-right font-mono font-semibold text-emerald-300">{bookingRef}</dd>
          <dt className="border-t border-white/10 pt-2 text-slate-400">Total payable</dt>
          <dd className="border-t border-white/10 pt-2 text-right text-sm font-semibold tabular-nums">
            {convertPrice(totalInr, currency)}
          </dd>
        </dl>

        <p className="mt-3 text-[11px] leading-snug text-slate-400">
          Demo flow — in production you’d complete payment on the airline or authorised seller’s site. Zero FareFair markup.
        </p>
      </div>
      <div
        aria-hidden="true"
        className="h-0.5 origin-left bg-emerald-400/70"
        style={{
          animation: `toast-progress ${AUTO_DISMISS_MS}ms linear forwards`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
        key={bookingRef}
      />
    </div>
  );
}
