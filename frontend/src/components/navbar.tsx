"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Menu, X } from "lucide-react";
import type { CurrencyCode } from "@/types/flight";
import { Segmented } from "./Segmented";
import { useDismiss } from "@/hooks/useDismiss";

const NAV_LINKS = [
  { href: "/", label: "Flights" },
  { href: "/search", label: "Compare sellers" },
  { href: "/price-alerts", label: "Price alerts" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

interface NavbarProps {
  /** When provided, shows the live currency switcher (home page). */
  currency?: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  /** When provided, shows the saved-flights pill. */
  savedCount?: number;
  showSavedOnly?: boolean;
  onToggleSaved?: () => void;
}

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--text-primary)] shadow-[0_1px_2px_rgba(11,18,32,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
          <path d="M12 3 3.5 19.5 12 15.6l8.5 3.9L12 3Z" fill="#fff" />
          <path d="M12 3v12.6" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
        Fare<span className="text-[var(--accent-primary)]">Fair</span>
      </span>
    </span>
  );
}

export function Navbar({
  currency,
  onCurrencyChange,
  savedCount,
  showSavedOnly,
  onToggleSaved,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Only flips a boolean at the threshold, so scrolling does not re-render.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useDismiss([menuRef, toggleRef], () => setMenuOpen(false), menuOpen);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header
      className={`sticky top-0 w-full border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-[var(--border-hairline)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sticky)]"
          : "border-transparent bg-[rgba(247,248,250,0.72)]"
      }`}
      style={{ zIndex: "var(--z-sticky-header)", height: "var(--header-h)" }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="FareFair home" className="shrink-0 rounded-lg">
          <BrandMark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 ${
                  active
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3.5 -bottom-px h-px origin-center bg-[var(--text-primary)] transition-transform duration-300 ease-out-expo ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {currency && onCurrencyChange && (
            <Segmented
              ariaLabel="Display currency"
              size="sm"
              className="hidden sm:inline-flex"
              value={currency}
              onChange={onCurrencyChange}
              options={[
                { value: "INR", label: "₹ INR" },
                { value: "USD", label: "$ USD" },
                { value: "EUR", label: "€ EUR" },
              ]}
            />
          )}

          {typeof savedCount === "number" && (
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={!!showSavedOnly}
              aria-label={`Saved flights (${savedCount})${showSavedOnly ? ", showing saved only" : ""}`}
              className={`btn h-9 px-3 text-xs ${showSavedOnly ? "btn-accent" : "btn-secondary"}`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${showSavedOnly ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">Saved</span>
              <span
                key={savedCount}
                className={`tabular-nums ${savedCount > 0 ? "animate-pop-in" : "opacity-50"}`}
              >
                {savedCount}
              </span>
            </button>
          )}

          {!currency && (
            <Link href="/dashboard" className="btn btn-primary hidden h-9 px-4 text-xs sm:inline-flex">
              Dashboard
            </Link>
          )}

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="btn btn-secondary h-9 w-9 p-0 lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className="absolute inset-x-3 top-[calc(var(--header-h)-4px)] origin-top animate-pop-in rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-float)] lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {[...NAV_LINKS, { href: "/dashboard", label: "Dashboard" }].map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-[var(--radius-control)] px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {link.label}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />}
                </Link>
              );
            })}
          </nav>
          {currency && onCurrencyChange && (
            <div className="mt-2 flex items-center justify-between border-t border-[var(--border-hairline)] px-4 pb-2 pt-3 sm:hidden">
              <span className="text-xs font-medium text-[var(--text-muted)]">Currency</span>
              <Segmented
                ariaLabel="Display currency"
                size="sm"
                value={currency}
                onChange={onCurrencyChange}
                options={[
                  { value: "INR", label: "₹" },
                  { value: "USD", label: "$" },
                  { value: "EUR", label: "€" },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
