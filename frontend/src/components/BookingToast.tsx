'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { CurrencyCode } from '../types/flight';
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
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[var(--z-toast)] max-w-sm w-full bg-[var(--text-primary)] text-white p-4 rounded-[var(--radius-card)] shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--semantic-success)]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Booking Initiated</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-300 space-y-1">
        <div className="flex justify-between">
          <span>Flight / Route:</span>
          <span className="font-semibold text-white">{flightNumber} ({route})</span>
        </div>
        <div className="flex justify-between">
          <span>Selected Seat:</span>
          <span className="font-semibold text-white">{seatId}</span>
        </div>
        <div className="flex justify-between">
          <span>Booking Reference:</span>
          <span className="font-mono text-[var(--semantic-success)] font-bold">{bookingRef}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
          <span>Total Payable:</span>
          <span className="font-bold text-white tabular-nums">{convertPrice(totalInr, currency)}</span>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-slate-400 leading-tight">
        Redirecting to authorized seller checkout... Zero FareFair markup applied.
      </div>
    </div>
  );
}
