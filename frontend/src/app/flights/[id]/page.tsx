"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { mockFlights } from "@/lib/mock-data";
import { formatPriceINR, formatDuration, formatTime, isNextDay } from "@/lib/utils";
import { SupplierTrustBadge } from "@/components/flights/supplier-trust-badge";
import { PriceBreakdownModal } from "@/components/flights/price-breakdown-modal";
import { 
  Plane, 
  Clock, 
  Luggage, 
  ExternalLink, 
  ShieldCheck, 
  ArrowLeft,
  CheckCircle2,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  const flightId = params?.id || "fl-001";
  const flight = mockFlights.find((f) => f.id === flightId) || mockFlights[0];
  const segment = flight.segments[0];

  const [selectedOfferForModal, setSelectedOfferForModal] = useState<any | null>(null);

  // Sorted offers
  const sortedOffers = [...flight.offers].sort((a, b) => a.totalPaise - b.totalPaise);
  const bestOffer = sortedOffers[0];

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col">
      <Navbar />

      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-8 py-10 flex-1 w-full">
        {/* Back Link */}
        <Link
          href={`/search?origin=${flight.departureAirport}&destination=${flight.arrivalAirport}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search Results</span>
        </Link>

        {/* Flight Overview Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                  {segment.flightNumber}
                </span>
                <span className="text-xs font-semibold text-slate-700">{segment.airlineName}</span>
                <span className="text-xs text-slate-400">· {segment.aircraft}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-navy mt-2">
                {flight.departureAirport} → {flight.arrivalAirport}
              </h1>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Lowest available fare</span>
              <span className="text-3xl font-semibold tracking-tight text-navy">{formatPriceINR(bestOffer.totalPaise)}</span>
              <span className="block text-[11px] text-teal-700 font-medium">via {bestOffer.supplierName}</span>
            </div>
          </div>

          {/* Journey Segment Timeline */}
          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-bold text-navy">{formatTime(flight.departureTime)}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">{flight.departureAirport}</div>
              <div className="text-[11px] text-slate-400">Terminal 3</div>
            </div>

            <div className="flex-1 w-full sm:w-auto px-6 text-center">
              <span className="text-xs text-slate-400 font-medium">{formatDuration(flight.totalDurationMinutes)}</span>
              <div className="relative my-2 flex items-center">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 bg-white"></div>
                <div className="flex-1 h-[2px] bg-slate-200"></div>
                <Plane className="w-4 h-4 text-blue-500 mx-1 rotate-90" />
                <div className="flex-1 h-[2px] bg-slate-200"></div>
                <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 bg-white"></div>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {flight.stops === 0 ? "Non-stop direct flight" : `${flight.stops} stop`}
              </span>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-2xl font-bold text-navy">{formatTime(flight.arrivalTime)}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">{flight.arrivalAirport}</div>
              <div className="text-[11px] text-slate-400">Terminal 2</div>
            </div>
          </div>
        </div>

        {/* Multi-Supplier Comparison Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-navy uppercase tracking-wider">
                Compare All {flight.offers.length} Booking Sellers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent final pricing with no FareFair markup
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Live Verified
            </span>
          </div>

          <div className="space-y-3">
            {sortedOffers.map((offer, idx) => (
              <div
                key={offer.supplierId + idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-all gap-4"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-navy">{offer.supplierName}</span>
                    <SupplierTrustBadge supplierName={offer.supplierName} trustScore={offer.trustScore} />
                    {idx === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        Cheapest Deal
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Luggage className="w-3.5 h-3.5" />
                      {offer.checkInBaggage}
                    </span>
                    <span>·</span>
                    <span>{offer.refundable ? "Refundable (cancellation fee applies)" : "Non-refundable"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <span className="text-xl font-semibold tracking-tight text-navy">{formatPriceINR(offer.totalPaise)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOfferForModal(offer)}
                      className="block text-[11px] text-slate-400 hover:text-navy underline"
                    >
                      View fee breakdown
                    </button>
                  </div>

                  <a
                    href={offer.deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full bg-navy text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Book on {offer.supplierName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Breakdown Modal */}
      {selectedOfferForModal && (
        <PriceBreakdownModal
          isOpen={true}
          onClose={() => setSelectedOfferForModal(null)}
          offer={selectedOfferForModal}
          airlineName={segment.airlineName}
          flightNumber={segment.flightNumber}
        />
      )}

      <Footer />
    </div>
  );
}
