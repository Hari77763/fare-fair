'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { FlightItinerary, FareTier, SeatCell, CurrencyCode } from '../types/flight';
import { generateMockSeats, convertPrice } from '../data/mockFlights';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface SeatMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightItinerary;
  tier: FareTier;
  currency: CurrencyCode;
  onConfirmSeat: (seatId: string, totalInr: number) => void;
}

const LEFT = ['A', 'B', 'C'] as const;
const RIGHT = ['D', 'E', 'F'] as const;
const ROWS = Array.from({ length: 24 }, (_, i) => i + 1);

function seatKind(col: string) {
  return col === 'A' || col === 'F' ? 'window' : col === 'C' || col === 'D' ? 'aisle' : 'middle';
}

export function SeatMapModal({ isOpen, onClose, flight, tier, currency, onConfirmSeat }: SeatMapModalProps) {
  const seats = useMemo<SeatCell[]>(() => generateMockSeats(), []);
  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);
  const firstFree = seats.find((s) => s.status !== 'occupied')?.id ?? '';
  const [selectedSeatId, setSelectedSeatId] = useState<string>(
    seatById.get('12B')?.status !== 'occupied' ? '12B' : firstFree
  );
  const [closing, setClosing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(isOpen);

  const requestClose = useCallback(() => {
    if (confirming) return;
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [confirming, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, requestClose]);

  if (!isOpen) return null;

  const selectedSeat = seatById.get(selectedSeatId);
  const seatFeeInr = tier.seatSelectionFree ? 0 : selectedSeat?.feeInr ?? 0;
  const grandTotalInr = tier.priceInr + tier.taxesInr + seatFeeInr;

  const handleConfirm = () => {
    if (confirming || !selectedSeat) return;
    setConfirming(true);
    // Simulated seat hold; the button stays locked so it cannot double-submit
    window.setTimeout(() => onConfirmSeat(selectedSeatId, grandTotalInr), 650);
  };

  const renderSeat = (row: number, col: string) => {
    const seat = seatById.get(`${row}${col}`);
    if (!seat) return <span key={col} />;
    const occupied = seat.status === 'occupied';
    const selected = seat.id === selectedSeatId;
    const extra = seat.status === 'extra-legroom';
    const fee = tier.seatSelectionFree ? 0 : seat.feeInr;
    return (
      <button
        key={col}
        type="button"
        disabled={occupied}
        aria-pressed={selected}
        aria-label={`Seat ${seat.id}, ${seatKind(col)}${extra ? ', extra legroom' : ''}${
          occupied ? ', occupied' : fee ? `, ${convertPrice(fee, currency)}` : ', free'
        }`}
        onClick={() => setSelectedSeatId(seat.id)}
        className={`h-9 rounded-[9px] text-[11px] font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 sm:h-10 ${
          occupied
            ? 'cursor-not-allowed bg-[var(--bg-subtle)] text-transparent'
            : selected
            ? 'scale-[1.06] bg-[var(--accent-primary)] text-white shadow-[0_6px_16px_-6px_rgba(29,78,216,0.7)]'
            : extra
            ? 'border border-[rgba(180,83,9,0.3)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning)] hover:border-[var(--semantic-warning)]'
            : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
        }`}
      >
        {occupied ? '' : col}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-6"
      style={{ zIndex: 'var(--z-sheet)' }}
    >
      <div
        className={`absolute inset-0 bg-[rgba(11,18,32,0.45)] backdrop-blur-[3px] transition-opacity duration-200 ${
          closing ? 'opacity-0' : 'animate-in fade-in duration-300'
        }`}
        onClick={requestClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seatmap-title"
        className={`glass glass-strong flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] shadow-[var(--shadow-float)] transition-[opacity,transform] duration-200 sm:rounded-[20px] ${
          closing ? 'translate-y-4 opacity-0' : 'animate-sheet-up sm:animate-modal-in'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--text-muted)]">
              {flight.segments[0].flightNumber} · {flight.segments[0].origin.code} → {flight.segments[0].destination.code} ·{' '}
              {tier.name}
            </p>
            <h2 id="seatmap-title" className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">
              Choose your seat
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            aria-label="Close seat map"
            className="btn btn-secondary h-9 w-9 shrink-0 p-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-[var(--border-hairline)] bg-white/50 px-5 py-2.5 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)]" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-[4px] bg-[var(--accent-primary)]" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-[4px] border border-[rgba(180,83,9,0.3)] bg-[var(--semantic-warning-soft)]" /> Extra legroom
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-[4px] bg-[var(--border-hairline)]" /> Taken
          </span>
        </div>

        {/* Cabin */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-[19rem]">
            <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[11px] font-semibold text-[var(--text-muted)]">
              {LEFT.map((c) => (
                <span key={c}>{c}</span>
              ))}
              <span />
              {RIGHT.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="space-y-1.5">
              {ROWS.map((row) => (
                <React.Fragment key={row}>
                  {row === 12 && (
                    <div className="my-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--semantic-warning)]">
                      <span className="h-px flex-1 bg-[rgba(180,83,9,0.25)]" />
                      Exit rows
                      <span className="h-px flex-1 bg-[rgba(180,83,9,0.25)]" />
                    </div>
                  )}
                  <div className="grid grid-cols-7 items-center gap-1.5">
                    {LEFT.map((c) => renderSeat(row, c))}
                    <span className="text-center font-mono text-[10px] text-[var(--text-muted)]">{row}</span>
                    {RIGHT.map((c) => renderSeat(row, c))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[var(--border-hairline)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <div aria-live="polite">
            <div className="text-xs text-[var(--text-muted)]">
              Seat <span className="font-semibold text-[var(--text-primary)]">{selectedSeatId}</span>
              {selectedSeat && ` · ${seatKind(selectedSeatId.slice(-1))}`}
              {seatFeeInr > 0 ? ` · +${convertPrice(seatFeeInr, currency)}` : ' · included'}
            </div>
            <div className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] tabular-nums">
              {convertPrice(grandTotalInr, currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || !selectedSeat}
            aria-busy={confirming}
            className="btn btn-accent h-11 px-5 text-sm"
          >
            {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirming ? 'Holding seat…' : 'Continue to seller'}
          </button>
        </div>
      </div>
    </div>
  );
}
