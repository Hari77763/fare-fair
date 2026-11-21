"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Info } from "lucide-react";

interface SupplierTrustBadgeProps {
  supplierName: string;
  trustScore: number; // e.g. 0.90 for 90%
}

export function SupplierTrustBadge({ supplierName, trustScore }: SupplierTrustBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const percentage = Math.round(trustScore * 100);
  const isHighTrust = trustScore >= 0.85;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap transition-colors ${
          isHighTrust
            ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {isHighTrust ? (
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span>{percentage}% Trust</span>
        <Info className="w-3 h-3 text-slate-400" />
      </button>

      {/* Trust Criteria Breakdown Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl text-xs z-50 animate-in fade-in zoom-in-95">
          <div className="font-bold border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between">
            <span>{supplierName} Reliability</span>
            <span className="text-teal-400 font-mono">{percentage}/100</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Price accuracy (30%)</span>
              <span className="text-teal-300 font-semibold">Excellent</span>
            </div>
            <div className="flex justify-between">
              <span>Booking completion (25%)</span>
              <span className="text-teal-300 font-semibold">99.2%</span>
            </div>
            <div className="flex justify-between">
              <span>Dispute / complaint rate (20%)</span>
              <span className="text-teal-300 font-semibold">Low (&lt;0.5%)</span>
            </div>
            <div className="flex justify-between">
              <span>Refund processing speed (15%)</span>
              <span className="text-teal-300 font-semibold">DGCA Compliant</span>
            </div>
            <div className="flex justify-between">
              <span>Licensing & identity check (10%)</span>
              <span className="text-teal-300 font-semibold">Verified OTA</span>
            </div>
          </div>
          <p className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
            Independent FairFare trust rating. Sellers cannot pay to alter their score.
          </p>
        </div>
      )}
    </div>
  );
}
