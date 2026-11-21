import React from "react";
import { ShieldCheck, Search, Tag, BellRing, Sparkles, Scale } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Tag className="w-6 h-6 text-amber-500" />,
      title: "100% Transparent Total Prices",
      description:
        "Every rupee is itemized: base fare, statutory airport taxes, and OTAs' mandatory convenience fees. Zero FareFair platform fees.",
    },
    {
      icon: <Scale className="w-6 h-6 text-teal-600" />,
      title: "Cheapest vs Cheapest Trusted",
      description:
        "Switch between the absolute lowest fare across the internet and the lowest fare from verified sellers meeting our strict trust criteria.",
    },
    {
      icon: <Search className="w-6 h-6 text-blue-500" />,
      title: "Multi-Supplier Aggregation",
      description:
        "We query legitimate GDS providers, NDC direct connects, and authorized Indian OTAs simultaneously to surface hidden price differences.",
    },
    {
      icon: <BellRing className="w-6 h-6 text-rose-500" />,
      title: "Smart Fare Trackers & Alerts",
      description:
        "Set custom target prices on your favorite routes. Receive instant alerts when prices drop without spam or predatory surges.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
          Why Indian Travelers Choose FareFair
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight mt-3">
          Flight metasearch built on honesty, not hidden charges
        </h2>
        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
          Traditional booking sites hit you with surprise fees at checkout. FareFair reveals the true final cost across every booking platform before you click.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feat, idx) => (
          <div
            key={idx}
            className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
              {feat.icon}
            </div>
            <h3 className="text-base font-bold text-navy mb-2">{feat.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
