import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "./navbar";

const COLUMNS = [
  {
    title: "Popular routes",
    links: [
      { href: "/search?origin=DEL&destination=BOM", label: "Delhi → Mumbai" },
      { href: "/search?origin=BLR&destination=DEL", label: "Bengaluru → Delhi" },
      { href: "/search?origin=DEL&destination=DXB", label: "Delhi → Dubai" },
      { href: "/search?origin=BOM&destination=LHR", label: "Mumbai → London" },
      { href: "/price-alerts", label: "Fare trackers & alerts" },
    ],
  },
  {
    title: "Standards",
    links: [
      { href: "/how-it-works", label: "How metasearch works" },
      { href: "/how-it-works#trust-ranking", label: "Cheapest Trusted ranking" },
      { href: "/how-it-works#dgca-compliance", label: "DGCA refund standards" },
      { href: "/about", label: "Zero-scraping policy" },
      { href: "/about#suppliers", label: "Supplier integrations" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-12 md:grid-cols-12">
          <div className="space-y-4 md:col-span-5">
            <BrandMark />
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              An independent flight metasearch for India. We compare airlines and authorised booking sites and show
              the true total — with zero FareFair markup.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--semantic-trust)]" />
              No booking fees, no paid placement
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Important
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              FareFair is a comparison service. We don&apos;t sell tickets or take payments — every booking is
              completed with the airline or an authorised seller.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--border-hairline)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FareFair Metasearch India</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-[var(--text-primary)]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--text-primary)]">
              Terms
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--semantic-success)]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)]" />
              </span>
              Demo data
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
