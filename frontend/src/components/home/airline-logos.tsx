import React from "react";

export function AirlineLogos() {
  const airlines = [
    { name: "IndiGo", code: "6E", tag: "India's Largest" },
    { name: "Air India", code: "AI", tag: "Full Service" },
    { name: "Akasa Air", code: "QP", tag: "Modern Fleet" },
    { name: "SpiceJet", code: "SG", tag: "Value Airline" },
    { name: "Vistara", code: "UK", tag: "Premium Domestic" },
  ];

  return (
    <section className="py-12 border-y border-slate-200/60 bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-6">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Comparing live fares across all major Indian domestic and international carriers
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
          {airlines.map((airline) => (
            <div
              key={airline.code}
              className="flex items-center gap-2 text-slate-700 hover:text-navy transition-colors opacity-80 hover:opacity-100"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold font-mono text-xs text-navy">
                {airline.code}
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block leading-none">{airline.name}</span>
                <span className="text-[10px] text-slate-400">{airline.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
