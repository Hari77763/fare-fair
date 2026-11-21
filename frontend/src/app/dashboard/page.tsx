"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { mockRecentSearches } from "@/lib/mock-data";
import { formatPriceINR } from "@/lib/utils";
import { Search, Bell, History, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col">
      <Navbar />

      <main id="main" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 flex-1 w-full">
        {/* Welcome Header */}
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Traveler Dashboard</span>
          <h1 className="text-3xl font-semibold tracking-tight text-navy mt-1">Welcome back, Traveler</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage saved flight alerts, view recent search queries, and track fare movements.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Search className="w-5 h-5" />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-navy">{mockRecentSearches.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Recent Route Searches</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-navy">3</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Active Price Trackers</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-navy">₹1,450</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Avg. Savings per Journey</div>
          </div>
        </div>

        {/* Recent Searches Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Recently Searched Flights</h3>
            </div>
            <Link href="/search" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              New Search →
            </Link>
          </div>

          <div className="space-y-3">
            {mockRecentSearches.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-50 transition-colors gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-navy">
                    <span>{item.origin}</span>
                    <span className="text-slate-300">→</span>
                    <span>{item.destination}</span>
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({item.departureDate})
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {item.passengers} passenger(s) · Searched recently
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Observed Lowest</span>
                    <span className="text-sm font-bold text-navy">{formatPriceINR(item.cheapestPricePaise)}</span>
                  </div>
                  <Link
                    href={`/search?origin=${item.origin}&destination=${item.destination}&departure_date=${item.departureDate}`}
                    className="px-4 py-2 rounded-full bg-navy text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
