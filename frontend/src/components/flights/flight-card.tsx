"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plane, 
  Clock, 
  Luggage, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { FlightResult, SupplierOffer } from "@/lib/mock-data";
import { formatPriceINR, formatDuration, formatTime, isNextDay } from "@/lib/utils";
import { SupplierTrustBadge } from "./supplier-trust-badge";
import { PriceBreakdownModal } from "./price-breakdown-modal";

interface FlightCardProps {
  flight: FlightResult;
  rankingMode: "cheapest" | "trusted";
}

export function FlightCard({ flight, rankingMode }: FlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOfferForModal, setSelectedOfferForModal] = useState<SupplierOffer | null>(null);

  const segment = flight.segments[0];
  const nextDay = isNextDay(flight.departureTime, flight.arrivalTime);

  // Offers sorted by price
  const sortedOffers = [...flight.offers].sort((a, b) => a.totalPaise - b.totalPaise);
  
  // Identify cheapest offer & cheapest trusted offer
  const absoluteCheapestOffer = sortedOffers[0];
  const cheapestTrustedOffer = sortedOffers.find((o) => o.trustScore >= 0.85) || sortedOffers[0];

  // Featured offer based on the current user ranking tab
  const activeOffer = rankingMode === "trusted" ? cheapestTrustedOffer : absoluteCheapestOffer;

  // Verification state styling
  const verificationBadges = {
    verified: { text: "Verified ✓", class: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    unverified: { text: "Needs Refresh ⟳", class: "bg-amber-50 text-amber-800 border-amber-200" },
    stale: { text: "Price may change", class: "bg-slate-100 text-slate-600 border-slate-200" },
  };

  const badgeInfo = verificationBadges[activeOffer.verificationState] || verificationBadges.verified;

  return (
    <>
      <div className="glass-card rounded-2xl lift-on-hover p-5 sm:p-6 mb-4 relative overflow-hidden">
        {/* Top Badges Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            {rankingMode === "cheapest" && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Absolute Cheapest
              </span>
            )}
            {rankingMode === "trusted" && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-700" />
                Cheapest Trusted
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${badgeInfo.class}`}>
              {badgeInfo.text}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium">
              Compared across {flight.offers.length} booking sources
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Last revalidated: {formatTime(activeOffer.lastVerifiedAt)} IST
          </div>
        </div>

        {/* Main Card Content (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Col 1: Airline & Flight Info (3 cols) */}
          <div className="md:col-span-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-xl shrink-0">
              ✈
            </div>
            <div>
              <div className="font-bold text-slate-900">{segment.airlineName}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{segment.flightNumber}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{segment.aircraft}</div>
            </div>
          </div>

          {/* Col 2: Times, Route & Duration (6 cols) */}
          <div className="md:col-span-6 flex items-center justify-between sm:px-4">
            {/* Departure */}
            <div className="text-left">
              <div className="text-xl sm:text-2xl font-bold text-navy">
                {formatTime(flight.departureTime)}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                {flight.departureAirport}
              </div>
            </div>

            {/* Flight Path / Duration */}
            <div className="flex-1 px-4 text-center">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(flight.totalDurationMinutes)}
              </span>
              <div className="relative my-2 flex items-center">
                <div className="w-2 h-2 rounded-full border-2 border-slate-300 bg-white"></div>
                <div className="flex-1 h-[2px] bg-slate-200"></div>
                <Plane className="w-3.5 h-3.5 text-blue-500 mx-1 rotate-90" />
                <div className="flex-1 h-[2px] bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full border-2 border-slate-300 bg-white"></div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}
              </span>
            </div>

            {/* Arrival */}
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-navy">
                {formatTime(flight.arrivalTime)}
                {nextDay && <span className="text-xs text-blue-600 font-bold ml-1">+1d</span>}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                {flight.arrivalAirport}
              </div>
            </div>
          </div>

          {/* Col 3: Price & Direct Booking CTA (3 cols) */}
          <div className="md:col-span-3 text-right flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-navy">
              {formatPriceINR(activeOffer.totalPaise)}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>via <strong>{activeOffer.supplierName}</strong></span>
              <SupplierTrustBadge
                supplierName={activeOffer.supplierName}
                trustScore={activeOffer.trustScore}
              />
            </div>
            <div className="text-[10px] text-teal-700 font-medium mt-1">
              Includes taxes & mandatory fees
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOfferForModal(activeOffer)}
                className="text-xs text-slate-500 hover:text-navy underline font-medium"
              >
                Price Breakdown
              </button>
              <Link
                href={`/flights/${flight.id}`}
                className="text-xs text-slate-500 hover:text-navy underline font-medium"
              >
                Details
              </Link>
              <a
                href={activeOffer.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-navy text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <span>View Deal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Expand/Collapse All Supplier Deals Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Luggage className="w-3.5 h-3.5" />
              {activeOffer.checkInBaggage} Check-in · {activeOffer.cabinBaggage} Cabin
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {activeOffer.refundable ? "Refundable (fees apply)" : "Non-refundable"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-slate-700 font-semibold hover:text-blue-600 transition-colors"
          >
            <span>Compare all {flight.offers.length} sellers</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Multi-Supplier Comparison Table */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              All Available Offers for this Itinerary
            </h4>
            <div className="space-y-2">
              {sortedOffers.map((offer, idx) => (
                <div
                  key={offer.supplierId + idx}
                  className={`flex flex-wrap items-center justify-between p-3 rounded-2xl border transition-colors ${
                    offer.supplierId === activeOffer.supplierId
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-slate-50/80 border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">{offer.supplierName}</span>
                    <SupplierTrustBadge supplierName={offer.supplierName} trustScore={offer.trustScore} />
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      {offer.checkInBaggage}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-base font-bold text-navy">{formatPriceINR(offer.totalPaise)}</span>
                      <span className="block text-[10px] text-slate-400">Total payable</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOfferForModal(offer)}
                      className="text-xs text-slate-500 hover:text-navy px-2 py-1 rounded bg-white border border-slate-200 font-medium"
                    >
                      Breakdown
                    </button>

                    <a
                      href={offer.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <span>Book</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
