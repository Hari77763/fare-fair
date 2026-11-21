import React from "react";
import Link from "next/link";
import { Plane, ArrowRight } from "lucide-react";
import { popularRoutes } from "@/lib/mock-data";
import { formatPriceINR } from "@/lib/utils";

export function PopularRoutes() {
  return (
    <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 px-3 py-1 bg-teal-50 rounded-full border border-teal-200">
            Top Indian Routes
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-2">
            Trending flights this week
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time observed minimum prices across all connected suppliers
          </p>
        </div>
        <Link
          href="/search"
          className="text-xs font-bold text-navy hover:text-amber-600 flex items-center gap-1.5 transition-colors"
        >
          <span>Explore all 100+ destinations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularRoutes.map((route, idx) => (
          <Link
            key={idx}
            href={`/search?origin=${route.origin}&destination=${route.destination}`}
            className="group bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {route.imageEmoji}
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-navy group-hover:text-amber-600 transition-colors">
                  <span>{route.originCity}</span>
                  <span className="text-slate-300">→</span>
                  <span>{route.destinationCity}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {route.origin} · {route.destination}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">From</span>
              <span className="text-base font-extrabold text-navy">{formatPriceINR(route.cheapestPaise)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
