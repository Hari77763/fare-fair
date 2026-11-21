import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LiquidGlass } from "@/components/LiquidGlass";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FairFare — Transparent flight metasearch for India",
    template: "%s · FairFare",
  },
  description:
    "Compare flight prices across airlines and authorised booking sites. Two independent rankings, itemised fees and zero FairFare markup.",
};

export const viewport: Viewport = {
  themeColor: "#F7F8FA",
  width: "device-width",
  initialScale: 1,
};

// Marks the document as JS-capable before first paint so scroll-reveal
// elements only start hidden when they can actually be revealed.
const revealBootstrap = `document.documentElement.classList.add('js-reveal');`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body className="font-sans">
        <LiquidGlass />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--text-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
