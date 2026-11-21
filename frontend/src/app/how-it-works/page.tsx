import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShieldCheck, Scale, Cpu, Search, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col">
      <Navbar />

      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-8 py-16 flex-1 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
            Platform Architecture & Methodology
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-navy tracking-tight mt-4">
            How FareFair Works
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            FareFair is an independent, multi-supplier flight metasearch platform. We do not sell tickets or hold inventory — we query hundreds of authorised airlines and ticketing providers concurrently to reveal the true total price.
          </p>
        </div>

        {/* 4-Step Metasearch Workflow */}
        <div className="space-y-8 mb-20">
          <h2 className="text-xl font-bold text-navy mb-6">The 4-Step Metasearch Workflow</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 font-semibold tracking-tight flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-navy mb-2">Concurrent Supplier Fan-Out</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you initiate a flight search, FareFair’s asynchronous orchestrator fans out concurrent API queries across Amadeus, Travelport, Wego, and top Indian OTAs (Cleartrip, MakeMyTrip, EaseMyTrip, ixigo) with individual timeouts.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-900 font-semibold tracking-tight flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-navy mb-2">Canonical Deduplication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We generate SHA-256 journey fingerprints using departure/arrival UTC timestamps, operating carriers, and segment sequences. The exact same flight across multiple providers is grouped under one clean itinerary.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 font-semibold tracking-tight flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-navy mb-2">Transparent Total Price Calculation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We enforce the formula: <strong>P_total = P_base + P_tax + P_mandatory_fees</strong>. Zero surprise convenience fees or seat markups at checkout. What you see is what you pay.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 font-semibold tracking-tight flex items-center justify-center text-sm mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-navy mb-2">Direct Seller Redirect</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                FareFair performs an instantaneous pre-booking price revalidation check, then transfers you directly to the airline or authorized OTA checkout page. We never store passenger payment credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Two Ranking Algorithms Explained */}
        <div id="trust-ranking" className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm mb-20 space-y-6">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-navy">Two Distinct Price Rankings</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike traditional flight engines where sellers can pay for sponsored top placement, FareFair separates offers into two strictly transparent rankings:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200">
              <h3 className="text-sm font-bold text-blue-950 mb-2">1. Absolute Cheapest</h3>
              <p className="text-xs text-blue-900 leading-relaxed">
                Strict price-first ranking. Displays the lowest payable price across all connected suppliers regardless of seller tier or commercial relationship.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200">
              <h3 className="text-sm font-bold text-teal-950 mb-2">2. Cheapest Trusted</h3>
              <p className="text-xs text-teal-900 leading-relaxed">
                Trust-first eligibility ranking. Filters offers to providers meeting our 85%+ reliability threshold: 30% price accuracy, 25% booking completion, 20% dispute rate, and 15% refund performance.
              </p>
            </div>
          </div>
        </div>

        {/* Indian Civil Aviation & DGCA 2026 Compliance */}
        <div id="dgca-compliance" className="bg-navy rounded-2xl text-white p-8 sm:p-12 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Indian Aviation & DGCA 2026 Compliance</h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The Directorate General of Civil Aviation (DGCA) revised refund and fare disclosure requirements (effective March 2026) mandate:
          </p>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Mandatory refund of User Development Fee (UDF), Passenger Service Fee (PSF), and statutory taxes even on non-refundable tickets.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Full disclosure of applicable airline cancellation rules and OTA processing charges prior to redirection.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Strict prohibition of non-disclosed hidden checkout markup on domestic itineraries.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
