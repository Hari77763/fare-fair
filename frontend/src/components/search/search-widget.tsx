"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Calendar, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { AirportAutocomplete } from "./airport-autocomplete";
import { PassengerSelector } from "./passenger-selector";

export function SearchWidget() {
  const router = useRouter();

  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [departureDate, setDepartureDate] = useState("2026-12-15");
  const [returnDate, setReturnDate] = useState("2026-12-22");
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");

  // Swap origin and destination
  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      origin,
      destination,
      departure_date: departureDate,
      trip_type: tripType,
      adults: adults.toString(),
      cabin: cabinClass,
    });
    if (tripType === "roundtrip" && returnDate) {
      params.set("return_date", returnDate);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Outer Floating Search Container (Fluttertop Design Style) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/60 relative">
        {/* Top Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Trip Type Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => setTripType("oneway")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  tripType === "oneway" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setTripType("roundtrip")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  tripType === "roundtrip" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Round Trip
              </button>
            </div>

            {/* Quick Tag */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Direct + Connecting Flights
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>Searching 8+ Indian OTAs & Airlines</span>
          </div>
        </div>

        {/* Search Fields Grid */}
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            {/* Origin Airport (Col 1-3) */}
            <div className="lg:col-span-3 bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 transition-all">
              <AirportAutocomplete
                label="From"
                value={origin}
                onChange={setOrigin}
                placeholder="Departure city"
              />
            </div>

            {/* Swap Button (Centered between From & To) */}
            <div className="lg:col-span-1 flex justify-center -my-2 lg:my-0">
              <button
                type="button"
                onClick={handleSwapAirports}
                aria-label="Swap airports"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-amber-600 hover:border-amber-300 transition-all active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Airport (Col 4-6) */}
            <div className="lg:col-span-3 bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 transition-all">
              <AirportAutocomplete
                label="To"
                value={destination}
                onChange={setDestination}
                placeholder="Arrival city"
              />
            </div>

            {/* Departure Date (Col 7-8) */}
            <div className="lg:col-span-2 bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 transition-all">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Departure
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={departureDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-navy focus:outline-none cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(departureDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>

            {/* Return Date or Travellers (Col 9-10) */}
            {tripType === "roundtrip" ? (
              <div className="lg:col-span-3 bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 transition-all">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Return
                </span>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-navy focus:outline-none cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(returnDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </p>
              </div>
            ) : (
              <div className="lg:col-span-3 bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 transition-all">
                <PassengerSelector
                  adults={adults}
                  childrenCount={childrenCount}
                  infants={infants}
                  cabinClass={cabinClass}
                  onChange={(a, c, i, cabin) => {
                    setAdults(a);
                    setChildrenCount(c);
                    setInfants(i);
                    setCabinClass(cabin);
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom Centered Search Button (Fluttertop signature pill button) */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="px-10 py-4 rounded-full bg-navy hover:bg-navy-light text-white font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-3 active:scale-95 group"
            >
              <span>Search Flights</span>
              <Search className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
