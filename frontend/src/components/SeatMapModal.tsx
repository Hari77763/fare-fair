'use client';

import React, { useState } from 'react';
import { FlightItinerary, FareTier, SeatCell, CurrencyCode } from '../types/flight';
import { generateMockSeats, convertPrice } from '../data/mockFlights';
import { X, Check, ShieldCheck } from 'lucide-react';

interface SeatMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightItinerary;
  tier: FareTier;
  currency: CurrencyCode;
  onConfirmSeat: (seatId: string, totalInr: number) => void;
}

export function SeatMapModal({
  isOpen,
  onClose,
  flight,
  tier,
  currency,
  onConfirmSeat,
}: SeatMapModalProps) {
  const [seats] = useState<SeatCell[]>(() => generateMockSeats());
  const [selectedSeatId, setSelectedSeatId] = useState<string>('12B');

  if (!isOpen) return null;

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);
  const seatFeeInr = selectedSeat?.feeInr || 0;
  const grandTotalInr = tier.priceInr + tier.taxesInr + seatFeeInr;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[var(--z-sheet)] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-t-[var(--radius-sheet)] sm:rounded-[var(--radius-card)] max-h-[90vh] flex flex-col shadow-[var(--shadow-sheet)] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-hairline)] flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              {flight.segments[0].airlineName} · {flight.segments[0].aircraft}
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">
              Select Your Cabin Seat
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-wrap items-center justify-center gap-4 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border border-[var(--border-strong)]"></span>
            <span className="text-[var(--text-secondary)]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[var(--accent-primary)]"></span>
            <span className="text-[var(--text-secondary)]">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300"></span>
            <span className="text-[var(--text-secondary)]">Extra Legroom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-200"></span>
            <span className="text-[var(--text-muted)]">Occupied</span>
          </div>
        </div>

        {/* Scrollable 3-3 Aircraft Fuselage */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-xs mx-auto space-y-2">
            {/* Column Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-[var(--text-muted)] pb-2">
              <span>A</span>
              <span>B</span>
              <span>C</span>
              <span className="text-[10px] text-slate-300">AISLE</span>
              <span>D</span>
              <span>E</span>
              <span>F</span>
            </div>

            {/* 24 Seat Rows */}
            {Array.from({ length: 24 }, (_, i) => i + 1).map((row) => {
              const isExitRow = row === 12 || row === 13;
              return (
                <React.Fragment key={row}>
                  {isExitRow && row === 12 && (
                    <div className="py-2 text-center text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 rounded-lg">
                      Emergency Exit Rows (Extra Legroom)
                    </div>
                  )}

                  <div className="grid grid-cols-7 gap-1.5 items-center">
                    {['A', 'B', 'C'].map((col) => {
                      const seat = seats.find((s) => s.row === row && s.col === col);
                      const isOccupied = seat?.status === 'occupied';
                      const isSelected = seat?.id === selectedSeatId;
                      const isExtra = seat?.status === 'extra-legroom';

                      return (
                        <button
                          key={col}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => seat && setSelectedSeatId(seat.id)}
                          className={`h-9 rounded-lg text-xs font-semibold transition-all touch-target ${
                            isOccupied
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[var(--accent-primary)] text-white shadow-md scale-105'
                              : isExtra
                              ? 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                              : 'bg-white border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}

                    {/* Aisle Row Number */}
                    <span className="text-[11px] font-bold text-slate-400 text-center font-mono">
                      {row}
                    </span>

                    {['D', 'E', 'F'].map((col) => {
                      const seat = seats.find((s) => s.row === row && s.col === col);
                      const isOccupied = seat?.status === 'occupied';
                      const isSelected = seat?.id === selectedSeatId;
                      const isExtra = seat?.status === 'extra-legroom';

                      return (
                        <button
                          key={col}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => seat && setSelectedSeatId(seat.id)}
                          className={`h-9 rounded-lg text-xs font-semibold transition-all touch-target ${
                            isOccupied
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[var(--accent-primary)] text-white shadow-md scale-105'
                              : isExtra
                              ? 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                              : 'bg-white border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-6 border-t border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-[var(--text-secondary)]">
              Seat <strong className="text-[var(--text-primary)]">{selectedSeatId}</strong>{' '}
              ({selectedSeat?.status === 'extra-legroom' ? 'Extra Legroom' : 'Standard'})
            </div>
            <div className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {convertPrice(grandTotalInr, currency)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onConfirmSeat(selectedSeatId, grandTotalInr)}
            className="px-6 py-2.5 rounded-[var(--radius-pill)] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-md transition-all touch-target"
          >
            Confirm Booking →
          </button>
        </div>
      </div>
    </div>
  );
}
