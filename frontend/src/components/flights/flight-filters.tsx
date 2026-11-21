"use client";

import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { formatPriceINR } from "@/lib/utils";

interface FlightFiltersProps {
  maxPrice: number;
  onPriceChange: (val: number) => void;
  selectedStops: number[];
  onStopsChange: (stops: number[]) => void;
  selectedAirlines: string[];
  onAirlineChange: (airlines: string[]) => void;
  onReset: () => void;
}

export function FlightFilters({
  maxPrice,
  onPriceChange,
  selectedStops,
  onStopsChange,
  selectedAirlines,
  onAirlineChange,
  onReset,
}: FlightFiltersProps) {
  const airlinesList = [
    { code: "6E", name: "IndiGo" },
    { code: "AI", name: "Air India" },
    { code: "QP", name: "Akasa Air" },
    { code: "SG", name: "SpiceJet" },
  ];

  const handleStopToggle = (stop: number) => {
    if (selectedStops.includes(stop)) {
      onStopsChange(selectedStops.filter((s) => s !== stop));
    } else {
      onStopsChange([...selectedStops, stop]);
    }
  };

  const handleAirlineToggle = (code: string) => {
    if (selectedAirlines.includes(code)) {
      onAirlineChange(selectedAirlines.filter((a) => a !== code));
    } else {
      onAirlineChange([...selectedAirlines, code]);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Filters</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Max Price Filter */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Max Budget</span>
          <span className="font-bold text-navy">{formatPriceINR(maxPrice)}</span>
        </div>
        <input
          type="range"
          min="300000"
          max="1200000"
          step="25000"
          value={maxPrice}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="w-full accent-blue-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>₹3,000</span>
          <span>₹12,000</span>
        </div>
      </div>

      {/* Stops Filter */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <span className="block text-xs font-semibold text-slate-700">Stops</span>
        <div className="space-y-2">
          {[
            { stop: 0, label: "Non-stop" },
            { stop: 1, label: "1 Stop" },
            { stop: 2, label: "2+ Stops" },
          ].map((item) => (
            <label
              key={item.stop}
              className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedStops.includes(item.stop)}
                onChange={() => handleStopToggle(item.stop)}
                className="rounded border-slate-300 text-blue-500 focus:ring-blue-400"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Airlines Filter */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <span className="block text-xs font-semibold text-slate-700">Airlines</span>
        <div className="space-y-2">
          {airlinesList.map((airline) => (
            <label
              key={airline.code}
              className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedAirlines.includes(airline.code)}
                onChange={() => handleAirlineToggle(airline.code)}
                className="rounded border-slate-300 text-blue-500 focus:ring-blue-400"
              />
              <span>{airline.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Trust Notice */}
      <div className="pt-4 border-t border-slate-100 p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
        <span className="text-[11px] font-bold text-teal-900 block mb-1">
          Independent Rankings
        </span>
        <p className="text-[10px] text-teal-700 leading-relaxed">
          FairFare does not prioritize airlines or OTAs for payment. Toggle between Absolute Cheapest and Cheapest Trusted at any time.
        </p>
      </div>
    </div>
  );
}
