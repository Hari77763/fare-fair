import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-16 flex-1 w-full">
        <h1 className="text-3xl font-semibold tracking-tight text-navy mb-4">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: November 2026</p>

        <div className="glass-card rounded-2xl p-8 sm:p-12 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <p>
            FairFare (&ldquo;we&rdquo;, &ldquo;our&rdquo;) is an independent flight metasearch platform. We prioritize consumer privacy and do not collect or sell personal travel data for advertising purposes.
          </p>

          <h2 className="text-base font-bold text-navy">1. Information We Collect</h2>
          <p>
            When searching for flights, we process non-personally identifiable query parameters (origin airport, destination, travel dates, passenger counts). When you subscribe to Price Alerts, we retain only your email address and preferred route targets.
          </p>

          <h2 className="text-base font-bold text-navy">2. Direct Supplier Redirection</h2>
          <p>
            FairFare does not process payment cards, identity documents, or ticketing transactions. When you click &ldquo;View Deal&rdquo;, you are transferred directly to the airline or authorized OTA website under their respective privacy policies.
          </p>

          <h2 className="text-base font-bold text-navy">3. Zero Data Scraping & API Compliance</h2>
          <p>
            All price data is retrieved through authorized commercial feeds, GDS interfaces, and approved OTA metasearch APIs.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
