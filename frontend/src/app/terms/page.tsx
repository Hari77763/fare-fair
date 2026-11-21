import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col">
      <Navbar />
      <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-16 flex-1 w-full">
        <h1 className="text-3xl font-semibold tracking-tight text-navy mb-4">Terms of Service</h1>
        <p className="text-xs text-slate-400 mb-8">Effective Date: November 2026</p>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-navy">1. Nature of the Service</h2>
          <p>
            FareFair operates exclusively as an information aggregation and metasearch comparison tool. FareFair is not a travel agency, air carrier, or ticket broker.
          </p>

          <h2 className="text-base font-bold text-navy">2. Fare Accuracy & Availability</h2>
          <p>
            While we strive for live precision through frequent revalidation, airfares and seat inventory are dynamic. The final legally binding price is confirmed by the provider prior to payment on their platform.
          </p>

          <h2 className="text-base font-bold text-navy">3. DGCA 2026 Refund Framework</h2>
          <p>
            Airlines operating in India are subject to the Directorate General of Civil Aviation refund mandates. Statutory fees including UDF and PSF remain refundable under applicable regulations regardless of fare category.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
