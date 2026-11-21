"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FlightCard } from "@/components/flights/flight-card";
import { FlightFilters } from "@/components/flights/flight-filters";
import { mockFlights, mockAirports } from "@/lib/mock-data";
import { Sparkles, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

function SearchResultsContent() {
  const searchParams = useSearchParams();

  const origin = searchParams.get("origin") || "DEL";
  const destination = searchParams.get("destination") || "BOM";
  const departureDate = searchParams.get("departure_date") || "2026-12-15";
  const adults = Number(searchParams.get("adults") || "1");

  const originAirport = mockAirports.find((a) => a.code === origin) || { city: origin, code: origin };
  const destAirport = mockAirports.find((a) => a.code === destination) || { city: destination, code: destination };

  // Ranking Mode state: "cheapest" vs "trusted"
  const [rankingMode, setRankingMode] = useState<"cheapest" | "trusted">("cheapest");

  // Filters State
  const [maxPrice, setMaxPrice] = useState<number>(1000000); // 10,000 INR in paise
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter & Sort flights specifically for origin -> destination
  const allFlights = useMemo(() => {
    const orig = origin.toUpperCase();
    const dest = destination.toUpperCase();
    if (orig === "DEL" && dest === "BOM") {
      return mockFlights;
    }
    const airlinesList = [
      { code: "6E", name: "IndiGo" },
      { code: "AI", name: "Air India" },
      { code: "UK", name: "Vistara" },
      { code: "QP", name: "Akasa Air" },
      { code: "SG", name: "SpiceJet" },
    ];
    return airlinesList.map((al, idx) => {
      const depHour = 6 + idx * 3;
      const depTime = `${String(depHour).padStart(2, "0")}:15`;
      const arrHour = (depHour + 2) % 24;
      const arrTime = `${String(arrHour).padStart(2, "0")}:45`;
      const basePaise = (4200 + idx * 450) * 100;
      return {
        id: `fl-${orig.toLowerCase()}-${dest.toLowerCase()}-${idx + 1}`,
        segments: [
          {
            airlineCode: al.code,
            airlineName: al.name,
            flightNumber: `${al.code} ${idx * 120 + 201}`,
            aircraft: "Airbus A321neo",
            departureAirport: orig,
            departureTime: depTime,
            arrivalAirport: dest,
            arrivalTime: arrTime,
            durationMinutes: 150,
          },
        ],
        totalDurationMinutes: 150,
        stops: idx === 3 ? 1 : 0,
        departureTime: depTime,
        arrivalTime: arrTime,
        departureAirport: orig,
        arrivalAirport: dest,
        cheapestPaise: basePaise,
        cheapestTrustedPaise: basePaise + 15000,
        isSimulated: true,
        offers: [
          {
            supplierId: "cleartrip",
            supplierName: "Cleartrip",
            supplierLogo: "🟩",
            pricePaise: basePaise,
            taxesPaise: Math.round(basePaise * 0.14),
            totalPaise: basePaise,
            deepLink: `https://www.cleartrip.com`,
            verificationState: "verified" as const,
            lastVerifiedAt: new Date().toISOString(),
            trustScore: 92,
            cabinBaggage: "7 kg",
            checkInBaggage: "15 kg",
            refundable: true,
            cancellationFeePaise: 300000,
            dateChangeFeePaise: 250000,
            mealIncluded: false,
            seatSelection: false,
          },
          {
            supplierId: "makemytrip",
            supplierName: "MakeMyTrip",
            supplierLogo: "🟥",
            pricePaise: basePaise + 5000,
            taxesPaise: Math.round(basePaise * 0.14),
            totalPaise: basePaise + 5000,
            deepLink: `https://www.makemytrip.com`,
            verificationState: "verified" as const,
            lastVerifiedAt: new Date().toISOString(),
            trustScore: 90,
            cabinBaggage: "7 kg",
            checkInBaggage: "15 kg",
            refundable: true,
            cancellationFeePaise: 325000,
            dateChangeFeePaise: 275000,
            mealIncluded: false,
            seatSelection: false,
          },
        ],
      };
    });
  }, [origin, destination]);

  const filteredFlights = useMemo(() => {
    return allFlights.filter((flight) => {
      // Filter by max price
      if (flight.cheapestPaise > maxPrice) return false;

      // Filter by stops
      if (selectedStops.length > 0 && !selectedStops.includes(flight.stops)) {
        return false;
      }

      // Filter by airline
      if (selectedAirlines.length > 0) {
        const flightAirline = flight.segments[0].airlineCode;
        if (!selectedAirlines.includes(flightAirline)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (rankingMode === "trusted") {
        return a.cheapestTrustedPaise - b.cheapestTrustedPaise;
      }
      return a.cheapestPaise - b.cheapestPaise;
    });
  }, [maxPrice, selectedStops, selectedAirlines, rankingMode]);

  const handleResetFilters = () => {
    setMaxPrice(1000000);
    setSelectedStops([]);
    setSelectedAirlines([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Top Route Summary Bar */}
      <section className="bg-white border-b border-slate-200/80 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-navy">{originAirport.city}</span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {originAirport.code}
              </span>
              <span className="text-slate-300 mx-1">→</span>
              <span className="text-xl sm:text-2xl font-extrabold text-navy">{destAirport.city}</span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {destAirport.code}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-xs font-semibold text-slate-600">
              {new Date(departureDate).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              · {adults} Traveler(s)
            </span>
          </div>

          <Link
            href="/"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 underline self-start sm:self-auto"
          >
            Modify Search
          </Link>
        </div>
      </section>

      {/* Metasearch Supplier Progress Bar */}
      <div className="bg-amber-50/80 border-b border-amber-200/60 py-2.5 px-4 sm:px-8 text-xs text-amber-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>
              Live metasearch completed: <strong>8 suppliers queried</strong> (Cleartrip, MakeMyTrip, EaseMyTrip, ixigo, Google Flights, Yatra)
            </span>
          </div>
          <span className="font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full text-[11px]">
            Zero FareFair Platform Fees
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filters Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-6">
            <FlightFilters
              maxPrice={maxPrice}
              onPriceChange={setMaxPrice}
              selectedStops={selectedStops}
              onStopsChange={setSelectedStops}
              selectedAirlines={selectedAirlines}
              onAirlineChange={setSelectedAirlines}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Results Area (9 cols) */}
          <section className="lg:col-span-9 space-y-5">
            {/* Two Signature Ranking Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setRankingMode("cheapest")}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    rankingMode === "cheapest"
                      ? "bg-navy text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Absolute Cheapest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRankingMode("trusted")}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    rankingMode === "trusted"
                      ? "bg-teal-700 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>Cheapest Trusted</span>
                </button>
              </div>

              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
              <div className="lg:hidden p-4 bg-white rounded-3xl border border-slate-200 shadow-xl mb-4">
                <FlightFilters
                  maxPrice={maxPrice}
                  onPriceChange={setMaxPrice}
                  selectedStops={selectedStops}
                  onStopsChange={setSelectedStops}
                  selectedAirlines={selectedAirlines}
                  onAirlineChange={setSelectedAirlines}
                  onReset={handleResetFilters}
                />
              </div>
            )}

            {/* Status Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing {filteredFlights.length} flight options</span>
              <span>Prices in INR (₹) inclusive of taxes</span>
            </div>

            {/* Flights List */}
            {filteredFlights.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-2xl">
                  ✈
                </div>
                <h3 className="text-base font-bold text-navy">No flights match your filters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your maximum budget or clearing airline and stop filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2 rounded-full bg-navy text-white text-xs font-bold hover:bg-navy-light"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  rankingMode={rankingMode}
                />
              ))
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-600">Loading flight search...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
