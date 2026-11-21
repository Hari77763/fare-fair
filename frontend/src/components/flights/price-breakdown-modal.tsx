"use client";

import React from "react";
import { X, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { formatPriceINR } from "@/lib/utils";
import { SupplierOffer } from "@/lib/mock-data";

interface PriceBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: SupplierOffer;
  airlineName: string;
  flightNumber: string;
}

export function PriceBreakdownModal({
  isOpen,
  onClose,
  offer,
  airlineName,
  flightNumber,
}: PriceBreakdownModalProps) {
  if (!isOpen) return null;

  // Derive base fare, taxes, and supplier fees
  const basePaise = offer.pricePaise - offer.taxesPaise;
  const convenienceFeePaise = offer.totalPaise - (basePaise + offer.taxesPaise);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                {flightNumber}
              </span>
              <span className="text-xs text-slate-500 font-medium">{airlineName}</span>
            </div>
            <h3 className="text-lg font-bold text-navy mt-1">Complete Price Breakdown</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-navy hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Formula Display */}
          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
            <span className="font-bold">Formula:</span>
            <span>Total Payable = Base Fare + Airline Taxes + Mandatory Fees</span>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <div className="text-slate-700 font-medium">Base Fare</div>
              <div className="font-semibold text-navy">{formatPriceINR(basePaise)}</div>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <div className="text-slate-700 font-medium">
                Airline Taxes & Statutory Airport Fees
                <span className="block text-[11px] text-slate-400">User Development Fee (UDF) + PSF + GST</span>
              </div>
              <div className="font-semibold text-navy">{formatPriceINR(offer.taxesPaise)}</div>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <div className="text-slate-700 font-medium">
                Supplier Convenience Fee ({offer.supplierName})
                <span className="block text-[11px] text-slate-400">
                  {convenienceFeePaise > 0 ? "Mandatory checkout fee" : "Zero convenience fee promotion"}
                </span>
              </div>
              <div className="font-semibold text-navy">
                {convenienceFeePaise > 0 ? formatPriceINR(convenienceFeePaise) : "₹0"}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100 text-teal-700">
              <div className="font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                FareFair Platform Fee
              </div>
              <div className="font-bold">₹0 (Free Metasearch)</div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Known Payable</span>
              <div className="text-2xl font-bold">{formatPriceINR(offer.totalPaise)}</div>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full">
                Guaranteed Transparent
              </span>
            </div>
          </div>

          {/* Included Services */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block">Check-in Baggage:</span>
              <span>{offer.checkInBaggage}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block">Cabin Baggage:</span>
              <span>{offer.cabinBaggage}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Verified via {offer.supplierName} API</span>
          <a
            href={offer.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-full bg-navy text-white text-xs font-bold hover:bg-navy-light transition-all shadow-md"
          >
            Book on {offer.supplierName} →
          </a>
        </div>
      </div>
    </div>
  );
}
