import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ShieldCheck, Target, Heart, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col">
      <Navbar />

      <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-16 flex-1 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
            Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-navy tracking-tight mt-4">
            About FareFair
          </h1>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            Building India’s independent, honest, and truly transparent flight metasearch platform.
          </p>
        </div>

        {/* Narrative */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed mb-12">
          <div>
            <h2 className="text-xl font-bold text-navy mb-3">Why FareFair Exists</h2>
            <p>
              Travelers in India have long faced misleading flight prices. An advertised ₹3,500 ticket frequently turns into ₹4,200+ once mandatory seat selection, undisclosed convenience fees, and payment charges are tacked on at checkout.
            </p>
            <p className="mt-3">
              FareFair was created to solve this problem through engineering transparency. We own the comparison and ranking experience while aggregating real-time inventory from authorized suppliers.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h2 className="text-xl font-bold text-navy mb-3">Our Three Core Principles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-navy block mb-1">1. Zero Scraping</span>
                <p className="text-xs text-slate-500">
                  Only authorized GDS feeds, NDC direct connects, and official OTA APIs are integrated.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-navy block mb-1">2. Zero Paid Rank</span>
                <p className="text-xs text-slate-500">
                  Sellers cannot pay commission to rank higher than cheaper eligible competitors.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-navy block mb-1">3. Zero Fake Fares</span>
                <p className="text-xs text-slate-500">
                  Every fare shows its exact data source, timestamp, and verification state.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
