import React from "react";
import Link from "next/link";
import { Plane, ShieldCheck, Heart, AlertCircle, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-16 pb-12 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                <Plane className="w-4 h-4 rotate-45" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Fare<span className="text-amber-400">Fair</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s independent, multi-supplier flight metasearch platform. We search hundreds of airlines and authorized OTAs to find true total prices with zero markup.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/60 border border-teal-800/80 px-3 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400" />
              <span>100% Transparent · No FareFair Booking Fees</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Flight Discovery</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/search?origin=DEL&destination=BOM" className="hover:text-white transition-colors">Delhi to Mumbai Flights</Link></li>
              <li><Link href="/search?origin=BLR&destination=DEL" className="hover:text-white transition-colors">Bengaluru to Delhi Flights</Link></li>
              <li><Link href="/search?origin=DEL&destination=DXB" className="hover:text-white transition-colors">Delhi to Dubai Flights</Link></li>
              <li><Link href="/search?origin=BOM&destination=LHR" className="hover:text-white transition-colors">Mumbai to London Flights</Link></li>
              <li><Link href="/price-alerts" className="hover:text-white transition-colors">Live Fare Trackers & Alerts</Link></li>
            </ul>
          </div>

          {/* Col 3: Architecture & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Metasearch Standards</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How Metasearch Works</Link></li>
              <li><Link href="/how-it-works#trust-ranking" className="hover:text-white transition-colors">Cheapest Trusted Algorithm</Link></li>
              <li><Link href="/how-it-works#dgca-compliance" className="hover:text-white transition-colors">DGCA 2026 Refund Standards</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Our Zero-Scraping Policy</Link></li>
              <li><Link href="/about#suppliers" className="hover:text-white transition-colors">Supplier API Integration Guide</Link></li>
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Disclaimers & Legal</h4>
            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                <strong>Important Notice:</strong> FareFair is an independent metasearch comparison service. We do not sell airline tickets or collect passenger booking payments directly.
              </p>
              <p>
                All bookings are completed on the respective airline or authorized OTA website. Mandatory taxes and known convenience fees are disclosed upfront.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-slate-300">Terms of Use</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Aviation Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} FareFair Metasearch India. Built for Indian travelers with full transparency.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All supplier APIs live & monitored</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
