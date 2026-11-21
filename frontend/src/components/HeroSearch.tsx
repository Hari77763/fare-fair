'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Airport, TripType, CabinClass } from '../types/flight';
import { majorAirports } from '../data/mockFlights';
import { ArrowLeftRight, Calendar, Search, X, Check, Globe, Building2 } from 'lucide-react';

interface HeroSearchProps {
  tripType: TripType;
  onTripTypeChange: (t: TripType) => void;
  origin: Airport;
  onOriginChange: (a: Airport) => void;
  destination: Airport;
  onDestinationChange: (a: Airport) => void;
  departureDate: string;
  onDepartureDateChange: (d: string) => void;
  returnDate?: string;
  onReturnDateChange: (d?: string) => void;
  passengers: { adults: number; children: number; infants: number };
  onPassengersChange: (p: { adults: number; children: number; infants: number }) => void;
  cabinClass: CabinClass;
  onCabinClassChange: (c: CabinClass) => void;
  onSearch: () => void;
  sentinelRef: React.Ref<HTMLDivElement>;
  originInputRef?: React.Ref<HTMLInputElement>;
}

export function HeroSearch({
  tripType,
  onTripTypeChange,
  origin,
  onOriginChange,
  destination,
  onDestinationChange,
  departureDate,
  onDepartureDateChange,
  returnDate,
  onReturnDateChange,
  passengers,
  onPassengersChange,
  cabinClass,
  onCabinClassChange,
  onSearch,
  sentinelRef,
  originInputRef,
}: HeroSearchProps) {
  // Combobox popover states
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [airportFilterTab, setAirportFilterTab] = useState<'all' | 'domestic' | 'international'>('all');
  const [isSwapping, setIsSwapping] = useState(false);

  const originContainerRef = useRef<HTMLDivElement>(null);
  const destContainerRef = useRef<HTMLDivElement>(null);
  const passengersContainerRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originContainerRef.current && !originContainerRef.current.contains(event.target as Node)) {
        setOriginOpen(false);
      }
      if (destContainerRef.current && !destContainerRef.current.contains(event.target as Node)) {
        setDestOpen(false);
      }
      if (passengersContainerRef.current && !passengersContainerRef.current.contains(event.target as Node)) {
        setPassengersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Swap animation trigger
  const handleSwap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSwapping(true);
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
    setTimeout(() => setIsSwapping(false), 240);
  };

  // Filter airports for Origin
  const filteredOriginAirports = useMemo(() => {
    const q = originQuery.trim().toLowerCase();
    return majorAirports.filter((a) => {
      if (a.code === destination.code) return false;
      if (airportFilterTab === 'domestic' && a.country !== 'India') return false;
      if (airportFilterTab === 'international' && a.country === 'India') return false;
      if (!q) return true;
      return (
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
      );
    });
  }, [originQuery, destination.code, airportFilterTab]);

  // Filter airports for Destination
  const filteredDestAirports = useMemo(() => {
    const q = destQuery.trim().toLowerCase();
    return majorAirports.filter((a) => {
      if (a.code === origin.code) return false;
      if (airportFilterTab === 'domestic' && a.country !== 'India') return false;
      if (airportFilterTab === 'international' && a.country === 'India') return false;
      if (!q) return true;
      return (
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
      );
    });
  }, [destQuery, origin.code, airportFilterTab]);

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return isoStr;
  };

  return (
    <div className="w-full max-w-[1140px] mx-auto pt-10 pb-6 px-4 sm:px-6 lg:px-8">
      {/* 1. Pill Badge */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-xs text-xs text-slate-600 font-medium select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Independent · Zero FairFare markup</span>
        </div>
      </div>

      {/* 2. Main Title & Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-8 select-none">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Pure aviation <span className="text-[#1D4ED8]">metasearch.</span>
        </h1>
        <p className="text-slate-500 text-sm sm:text-[15px] mt-3 font-normal leading-relaxed">
          Every fare itemised, every seller ranked twice — cheapest overall<br className="hidden sm:inline" />
          and cheapest you can trust.
        </p>
      </div>

      {/* 3. Main Search Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-7 relative z-10">
        {/* Top Controls: Trip Type Pill & Demo Tag */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div className="inline-flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => onTripTypeChange('round-trip')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                tripType === 'round-trip'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Round trip
            </button>
            <button
              type="button"
              onClick={() => onTripTypeChange('one-way')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                tripType === 'one-way'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              One way
            </button>
            <button
              type="button"
              onClick={() => onTripTypeChange('multi-city')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                tripType === 'multi-city'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Multi-city
            </button>
          </div>

          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Live Metasearch Engine · 75+ Hubs</span>
          </div>
        </div>

        {/* Inputs Layout: Horizontal Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* FROM & TO with Swap (6 cols on lg) */}
          <div className="lg:col-span-6 flex items-center gap-2 w-full">
            {/* Origin Combobox */}
            <div ref={originContainerRef} className="flex-1 relative">
              <div
                onClick={() => {
                  setOriginOpen(true);
                  setDestOpen(false);
                }}
                className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white cursor-pointer transition-all shadow-xs h-[78px] flex flex-col justify-between"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  FROM
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {origin.city}
                  </span>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {origin.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {origin.name}
                </div>
              </div>

              {/* Origin Popover */}
              {originOpen && (
                <div className="absolute top-full left-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Select Departure Airport
                    </span>
                    <button onClick={() => setOriginOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setAirportFilterTab('all')}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                        airportFilterTab === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All (75+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAirportFilterTab('domestic')}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        airportFilterTab === 'domestic'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Domestic India</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAirportFilterTab('international')}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        airportFilterTab === 'international'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>International</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    autoFocus
                    ref={originInputRef}
                    placeholder="Search city, code, or airport (e.g. MAA, Delhi, London)..."
                    value={originQuery}
                    onChange={(e) => setOriginQuery(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-2.5 outline-none focus:border-blue-500 focus:bg-white"
                  />

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredOriginAirports.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No airports match &ldquo;{originQuery}&rdquo;
                      </div>
                    ) : (
                      filteredOriginAirports.map((a) => (
                        <button
                          key={a.code}
                          type="button"
                          onClick={() => {
                            onOriginChange(a);
                            setOriginOpen(false);
                            setOriginQuery('');
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{a.city}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({a.country})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[240px]">{a.name}</div>
                          </div>
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {a.code}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className={`w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-xs flex items-center justify-center text-slate-400 hover:text-slate-700 transition-transform shrink-0 ${
                isSwapping ? 'rotate-180' : ''
              }`}
              style={{ transitionDuration: '240ms' }}
              aria-label="Swap origin and destination"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Destination Combobox */}
            <div ref={destContainerRef} className="flex-1 relative">
              <div
                onClick={() => {
                  setDestOpen(true);
                  setOriginOpen(false);
                }}
                className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white cursor-pointer transition-all shadow-xs h-[78px] flex flex-col justify-between"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  TO
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {destination.city}
                  </span>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {destination.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {destination.name}
                </div>
              </div>

              {/* Destination Popover */}
              {destOpen && (
                <div className="absolute top-full right-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Select Destination Airport
                    </span>
                    <button onClick={() => setDestOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setAirportFilterTab('all')}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                        airportFilterTab === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All (75+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAirportFilterTab('domestic')}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        airportFilterTab === 'domestic'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Domestic India</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAirportFilterTab('international')}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        airportFilterTab === 'international'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>International</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    autoFocus
                    placeholder="Search city, code, or airport (e.g. DEL, BOM, DXB)..."
                    value={destQuery}
                    onChange={(e) => setDestQuery(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-2.5 outline-none focus:border-blue-500 focus:bg-white"
                  />

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredDestAirports.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No airports match &ldquo;{destQuery}&rdquo;
                      </div>
                    ) : (
                      filteredDestAirports.map((a) => (
                        <button
                          key={a.code}
                          type="button"
                          onClick={() => {
                            onDestinationChange(a);
                            setDestOpen(false);
                            setDestQuery('');
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{a.city}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({a.country})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[240px]">{a.name}</div>
                          </div>
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {a.code}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DEPART, RETURN & TRAVELLERS (6 cols on lg) */}
          <div className="lg:col-span-6 grid grid-cols-3 gap-2.5 w-full">
            {/* Depart Box */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-xs h-[78px] flex flex-col justify-between relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                DEPART
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 tabular-nums">
                  {formatDisplayDate(departureDate)}
                </span>
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => onDepartureDateChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            {/* Return Box */}
            <div className={`p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-xs h-[78px] flex flex-col justify-between relative ${
              tripType === 'one-way' ? 'opacity-50' : ''
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                RETURN
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 tabular-nums">
                  {returnDate ? formatDisplayDate(returnDate) : '—'}
                </span>
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              {tripType !== 'one-way' && (
                <input
                  type="date"
                  value={returnDate || ''}
                  onChange={(e) => onReturnDateChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              )}
            </div>

            {/* Travellers Box */}
            <div ref={passengersContainerRef} className="relative">
              <div
                onClick={() => setPassengersOpen(!passengersOpen)}
                className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white cursor-pointer shadow-xs h-[78px] flex flex-col justify-between"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  TRAVELLERS
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900 leading-tight">
                    {totalPassengers} {totalPassengers === 1 ? 'traveller' : 'travellers'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{cabinClass}</div>
                </div>
              </div>

              {/* Passengers Drawer / Popover */}
              {passengersOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                    Travelers & Cabin
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">Adults</span>
                      <span className="block text-[10px] text-slate-400">Age 12+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={passengers.adults <= 1}
                        onClick={() =>
                          onPassengersChange({ ...passengers, adults: Math.max(1, passengers.adults - 1) })
                        }
                        className="w-6 h-6 rounded-full border border-slate-200 font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="tabular-nums font-semibold w-4 text-center">
                        {passengers.adults}
                      </span>
                      <button
                        type="button"
                        disabled={passengers.adults >= 9}
                        onClick={() =>
                          onPassengersChange({ ...passengers, adults: passengers.adults + 1 })
                        }
                        className="w-6 h-6 rounded-full border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cabin Class Selection */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Cabin Class
                    </span>
                    {(['Economy', 'Premium Economy', 'Business'] as CabinClass[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onCabinClassChange(c);
                          setPassengersOpen(false);
                        }}
                        className={`w-full text-left text-xs py-1.5 px-2.5 rounded-xl flex items-center justify-between transition-colors ${
                          cabinClass === c
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{c}</span>
                        {cabinClass === c && <Check className="w-3.5 h-3.5 text-blue-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Notice Text & Search CTA Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Prices include mandatory taxes. Seller fees shown before you leave FairFare.
          </p>

          <button
            type="button"
            onClick={onSearch}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md cursor-pointer select-none"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search flights</span>
          </button>
        </div>
      </div>

      {/* Sentinel Element Observed by IntersectionObserver */}
      <div ref={sentinelRef} className="h-[1px] w-full" aria-hidden="true" />
    </div>
  );
}
