"use client";

import React, { useState, useRef, useEffect } from "react";
import { Users, ChevronDown, Check } from "lucide-react";

interface PassengerSelectorProps {
  adults: number;
  childrenCount: number;
  infants: number;
  cabinClass: string;
  onChange: (adults: number, children: number, infants: number, cabin: string) => void;
}

export function PassengerSelector({
  adults,
  childrenCount,
  infants,
  cabinClass,
  onChange,
}: PassengerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPassengers = adults + childrenCount + infants;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cabinNames: Record<string, string> = {
    economy: "Economy",
    premium_economy: "Premium Economy",
    business: "Business Class",
    first: "First Class",
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer group select-none"
      >
        <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Travellers
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-navy group-hover:text-amber-600 transition-colors">
            {totalPassengers} {totalPassengers === 1 ? "adult" : "passengers"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {cabinNames[cabinClass] || "Economy"}
        </p>
      </div>

      {/* Selector Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
            Passengers & Cabin
          </h4>

          {/* Adults */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-semibold text-slate-800">Adults</div>
              <div className="text-[10px] text-slate-400">Age 12+ years</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={adults <= 1}
                onClick={() => onChange(Math.max(1, adults - 1), childrenCount, infants, cabinClass)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 disabled:opacity-30 hover:bg-slate-100"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center">{adults}</span>
              <button
                type="button"
                disabled={adults >= 9}
                onClick={() => onChange(adults + 1, childrenCount, infants, cabinClass)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 disabled:opacity-30 hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-semibold text-slate-800">Children</div>
              <div className="text-[10px] text-slate-400">Age 2 - 12 years</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={childrenCount <= 0}
                onClick={() => onChange(adults, Math.max(0, childrenCount - 1), infants, cabinClass)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 disabled:opacity-30 hover:bg-slate-100"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center">{childrenCount}</span>
              <button
                type="button"
                disabled={childrenCount >= 6}
                onClick={() => onChange(adults, childrenCount + 1, infants, cabinClass)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 disabled:opacity-30 hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Cabin Class Selection */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Cabin Class
            </div>
            <div className="space-y-1">
              {[
                { id: "economy", label: "Economy" },
                { id: "premium_economy", label: "Premium Economy" },
                { id: "business", label: "Business Class" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange(adults, childrenCount, infants, c.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    cabinClass === c.id ? "bg-amber-50 text-amber-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{c.label}</span>
                  {cabinClass === c.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy-light"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
