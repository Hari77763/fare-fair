"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { mockPriceAlerts } from "@/lib/mock-data";
import { formatDate, formatPriceINR } from "@/lib/utils";
import { Bell, TrendingDown, TrendingUp, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState(mockPriceAlerts);
  const [newOrigin, setNewOrigin] = useState("DEL");
  const [newDestination, setNewDestination] = useState("BOM");
  const [targetPrice, setTargetPrice] = useState("4000");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleDelete = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): string | null => {
    const iata = /^[A-Z]{3}$/;
    if (!iata.test(newOrigin)) return "Origin must be a 3-letter airport code, e.g. DEL.";
    if (!iata.test(newDestination)) return "Destination must be a 3-letter airport code, e.g. BOM.";
    if (newOrigin === newDestination) return "Origin and destination must be different.";
    const price = Number(targetPrice);
    if (!Number.isFinite(price) || price < 500 || price > 500000) return "Target price must be between ₹500 and ₹5,00,000.";
    if (alerts.some((a) => a.origin === newOrigin && a.destination === newDestination && a.isActive)) {
      return `You already track ${newOrigin} → ${newDestination}.`;
    }
    return null;
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    setFormError(error);
    if (error) return;
    const newAlert = {
      id: `pa-${Date.now()}`,
      origin: newOrigin,
      destination: newDestination,
      departureDate: "2026-12-25",
      targetPricePaise: Number(targetPrice) * 100,
      currentPricePaise: (Number(targetPrice) + 400) * 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
      priceHistory: [
        { date: "2026-11-20", pricePaise: (Number(targetPrice) + 800) * 100 },
        { date: "2026-11-21", pricePaise: (Number(targetPrice) + 400) * 100 },
      ],
    };
    setAlerts([newAlert, ...alerts]);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main id="main" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 mb-2">
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Fare Trackers</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-navy">Flight Price Alerts</h1>
            <p className="text-xs text-slate-500 mt-1">
              We monitor 8+ airlines and OTAs 24/7. When fares hit your target, we notify you immediately.
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError(null);
            }}
            aria-expanded={showAddForm}
            className="px-5 py-2.5 rounded-full bg-navy text-white text-xs font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Track New Route</span>
          </button>
        </div>

        {/* Add Alert Form Modal/Panel */}
        {showAddForm && (
          <div className="glass-card rounded-2xl p-6 shadow-md mb-8 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-navy mb-4">Set Up New Fare Alert</h3>
            <form onSubmit={handleCreateAlert} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Origin Code</label>
                <input
                  type="text"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  maxLength={3}
                  aria-invalid={!!formError && formError.startsWith("Origin")}
                  placeholder="e.g. DEL"
                  className="input font-semibold uppercase tracking-wider"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Destination Code</label>
                <input
                  type="text"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  maxLength={3}
                  aria-invalid={!!formError && formError.startsWith("Destination")}
                  placeholder="e.g. BOM"
                  className="input font-semibold uppercase tracking-wider"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Target Price (₹)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min={500}
                  step={100}
                  inputMode="numeric"
                  placeholder="e.g. 4000"
                  className="input font-semibold tabular-nums"
                  required
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="btn btn-primary h-[42px] w-full text-sm"
                >
                  Save Alert
                </button>
              </div>
            </form>
            {formError && (
              <p role="alert" className="mt-3 text-xs font-medium text-[var(--semantic-danger)]">
                {formError}
              </p>
            )}
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.length === 0 && (
            <div className="glass-card rounded-2xl border-dashed px-6 py-14 text-center">
              <Bell className="mx-auto h-6 w-6 text-slate-400" />
              <h2 className="mt-3 text-base font-semibold text-navy">No routes tracked</h2>
              <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                Track a route and we&apos;ll flag it here when the fare drops to your target.
              </p>
              <button type="button" onClick={() => setShowAddForm(true)} className="btn btn-primary mt-5 h-10 px-5 text-sm">
                Track a route
              </button>
            </div>
          )}
          {alerts.map((alert) => {
            const isGoodDeal = alert.currentPricePaise <= alert.targetPricePaise;
            return (
              <div
                key={alert.id}
                className="glass-card rounded-2xl p-6 shadow-sm lift-on-hover flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-navy shrink-0">
                    ✈
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold tracking-tight text-navy">{alert.origin}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-lg font-semibold tracking-tight text-navy">{alert.destination}</span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                        {formatDate(alert.departureDate, { weekday: undefined })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Target: <strong>{formatPriceINR(alert.targetPricePaise)}</strong> · Alert Active
                    </div>
                  </div>
                </div>

                {/* Price and status */}
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Current Lowest</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      {isGoodDeal ? (
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-xl font-semibold tracking-tight text-navy">
                        {formatPriceINR(alert.currentPricePaise)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/search?origin=${alert.origin}&destination=${alert.destination}`}
                    className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    View Flights
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(alert.id)}
                    className="btn btn-ghost h-9 w-9 p-0 hover:text-rose-600"
                    title="Delete alert"
                    aria-label={`Delete alert for ${alert.origin} to ${alert.destination}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
