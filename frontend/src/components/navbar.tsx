"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plane, Globe, User, Menu, X, ShieldCheck, Bell } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 w-full px-4 sm:px-8 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Plane className="w-5 h-5 text-amber-400 rotate-45" />
          </div>
          <div>
            <span className="font-bold text-2xl tracking-tight text-navy">
              Fare<span className="text-amber-500">Fair</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Metasearch
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-navy transition-colors font-semibold text-navy">
            Home
          </Link>
          <Link href="/search" className="hover:text-navy transition-colors">
            Search Flights
          </Link>
          <Link href="/price-alerts" className="hover:text-navy transition-colors flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            Price Alerts
          </Link>
          <Link href="/how-it-works" className="hover:text-navy transition-colors">
            How It Works
          </Link>
          <Link href="/about" className="hover:text-navy transition-colors">
            About Us
          </Link>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Currency / Language Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm text-xs font-medium text-slate-700 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>INR (₹)</span>
            <span className="text-slate-300">|</span>
            <span>IN</span>
          </div>

          {/* User Account / Dashboard Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shadow-sm transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span>Dashboard</span>
          </Link>

          {/* Sign In CTA Button */}
          <Link
            href="/dashboard"
            className="px-5 py-2 rounded-full bg-navy text-white text-xs font-semibold hover:bg-navy-light shadow-md hover:shadow-lg transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-white/80 border border-slate-200 text-slate-700 shadow-sm"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-800">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100">
              Home
            </Link>
            <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100">
              Search Flights
            </Link>
            <Link href="/price-alerts" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 flex items-center justify-between">
              <span>Price Alerts</span>
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold">Live</span>
            </Link>
            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100">
              How It Works
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100">
              About Us
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2">
              My Dashboard
            </Link>
          </nav>
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Currency: INR (₹)</span>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-full bg-navy text-white text-xs font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
