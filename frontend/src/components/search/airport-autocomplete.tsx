"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plane, MapPin, Search } from "lucide-react";
import { mockAirports } from "@/lib/mock-data";

interface AirportAutocompleteProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

export function AirportAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Select airport",
}: AirportAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAirport = mockAirports.find((a) => a.code === value);

  // Filter airports by code, city, or name
  const filteredAirports = mockAirports.filter((airport) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      airport.code.toLowerCase().includes(q) ||
      airport.city.toLowerCase().includes(q) ||
      airport.name.toLowerCase().includes(q)
    );
  }).slice(0, 8);

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

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className="cursor-pointer group select-none"
      >
        <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-navy group-hover:text-amber-600 transition-colors">
            {selectedAirport ? selectedAirport.city : value || placeholder}
          </span>
          {selectedAirport && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {selectedAirport.code}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate max-w-[180px] mt-0.5">
          {selectedAirport ? selectedAirport.name : "Choose origin"}
        </p>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Type city or airport code (e.g. DEL, BOM)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Popular Airports
            </div>
            {filteredAirports.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching airport found
              </div>
            ) : (
              filteredAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => {
                    onChange(airport.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-amber-50/80 transition-colors ${
                    airport.code === value ? "bg-amber-50 text-amber-900 font-semibold" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-semibold">{airport.city}</span>
                      <p className="text-[10px] text-slate-500 truncate">{airport.name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 ml-2 shrink-0">
                    {airport.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
