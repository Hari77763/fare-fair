/**
 * FairFare Mock Data
 * ===================
 * All data in this file is SIMULATED for demonstration purposes.
 * Prices are stored as integer paise (1 INR = 100 paise).
 * Timestamps are in UTC; display times use airport local timezone.
 *
 * NOTE: This data does not represent real flight prices or availability.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Airport {
  code: string;
  name: string;
  city: string;
  timezone: string;
}

export interface Airline {
  code: string;
  name: string;
  logo: string; // emoji placeholder for demo
}

export interface SupplierOffer {
  supplierId: string;
  supplierName: string;
  supplierLogo: string;
  pricePaise: number;
  taxesPaise: number;
  totalPaise: number;
  deepLink: string;
  verificationState: "verified" | "unverified" | "stale";
  lastVerifiedAt: string;
  trustScore: number;
  cabinBaggage: string;
  checkInBaggage: string;
  refundable: boolean;
  cancellationFeePaise: number;
  dateChangeFeePaise: number;
  mealIncluded: boolean;
  seatSelection: boolean;
}

export interface FlightSegment {
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  aircraft: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  durationMinutes: number;
}

export interface FlightResult {
  id: string;
  segments: FlightSegment[];
  totalDurationMinutes: number;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  offers: SupplierOffer[];
  cheapestPaise: number;
  cheapestTrustedPaise: number;
  isSimulated: boolean;
}

export interface PriceAlert {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  targetPricePaise: number;
  currentPricePaise: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt: string | null;
  priceHistory: { date: string; pricePaise: number }[];
}

export interface RecentSearch {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  passengers: number;
  cheapestPricePaise: number;
  searchedAt: string;
}

export interface PopularRoute {
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  cheapestPaise: number;
  imageEmoji: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

export const airports: Record<string, Airport> = {
  DEL: { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", timezone: "Asia/Kolkata" },
  BOM: { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", timezone: "Asia/Kolkata" },
  BLR: { code: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", timezone: "Asia/Kolkata" },
  MAA: { code: "MAA", name: "Chennai International Airport", city: "Chennai", timezone: "Asia/Kolkata" },
  CCU: { code: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", timezone: "Asia/Kolkata" },
  HYD: { code: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", timezone: "Asia/Kolkata" },
  GOI: { code: "GOI", name: "Manohar International Airport", city: "Goa", timezone: "Asia/Kolkata" },
  JAI: { code: "JAI", name: "Jaipur International Airport", city: "Jaipur", timezone: "Asia/Kolkata" },
  COK: { code: "COK", name: "Cochin International Airport", city: "Kochi", timezone: "Asia/Kolkata" },
  PNQ: { code: "PNQ", name: "Pune Airport", city: "Pune", timezone: "Asia/Kolkata" },
};

export const airlines: Record<string, Airline> = {
  "6E": { code: "6E", name: "IndiGo", logo: "🔵" },
  AI: { code: "AI", name: "Air India", logo: "🟠" },
  SG: { code: "SG", name: "SpiceJet", logo: "🔴" },
  UK: { code: "UK", name: "Vistara", logo: "🟣" },
  QP: { code: "QP", name: "Akasa Air", logo: "🟡" },
  IX: { code: "IX", name: "Air India Express", logo: "🟤" },
  I5: { code: "I5", name: "AirAsia India", logo: "⚪" },
};

export const suppliers = [
  { id: "cleartrip", name: "Cleartrip", logo: "🟩", trustScore: 92 },
  { id: "makemytrip", name: "MakeMyTrip", logo: "🟥", trustScore: 90 },
  { id: "goibibo", name: "Goibibo", logo: "🟧", trustScore: 88 },
  { id: "yatra", name: "Yatra", logo: "🟦", trustScore: 85 },
  { id: "easemytrip", name: "EaseMyTrip", logo: "🟨", trustScore: 82 },
  { id: "ixigo", name: "Ixigo", logo: "🟪", trustScore: 87 },
  { id: "paytm", name: "Paytm Flights", logo: "⬜", trustScore: 78 },
  { id: "happyeasygo", name: "HappyEasyGo", logo: "🟫", trustScore: 65 },
];

// ─── Mock Flight Results (DEL → BOM) ────────────────────────────────────────

function makeOffer(
  supplierId: string,
  basePaise: number,
  opts: Partial<SupplierOffer> = {}
): SupplierOffer {
  const supplier = suppliers.find((s) => s.id === supplierId)!;
  const taxesPaise = Math.round(basePaise * 0.12);
  const totalPaise = basePaise + taxesPaise;
  return {
    supplierId,
    supplierName: supplier.name,
    supplierLogo: supplier.logo,
    pricePaise: basePaise,
    taxesPaise,
    totalPaise,
    deepLink: `https://${supplierId}.example.com/book?flight=demo`,
    verificationState: "verified",
    lastVerifiedAt: "2026-11-21T04:00:00Z",
    cabinBaggage: "7 kg",
    checkInBaggage: "15 kg",
    refundable: false,
    cancellationFeePaise: 350000,
    dateChangeFeePaise: 275000,
    mealIncluded: false,
    seatSelection: false,
    ...opts,
    // Supplier catalogue scores are 0–100; offers expose 0–1, which is what the
    // trust badge and the ≥0.85 "Cheapest Trusted" threshold expect. Applied
    // after opts so per-offer overrides are normalised too.
    trustScore: normaliseTrust(opts.trustScore ?? supplier.trustScore),
  };
}

function normaliseTrust(score: number): number {
  return score > 1 ? score / 100 : score;
}

export const mockFlightResults: FlightResult[] = [
  {
    id: "fl-001",
    segments: [
      {
        airlineCode: "6E",
        airlineName: "IndiGo",
        flightNumber: "6E 2015",
        aircraft: "Airbus A320neo",
        departureAirport: "DEL",
        departureTime: "06:15",
        arrivalAirport: "BOM",
        arrivalTime: "08:30",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "06:15",
    arrivalTime: "08:30",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("cleartrip", 439900),
      makeOffer("makemytrip", 445000),
      makeOffer("ixigo", 449900),
      makeOffer("easemytrip", 455000, { verificationState: "stale", lastVerifiedAt: "2026-11-20T18:00:00Z" }),
    ],
    cheapestPaise: 492688,
    cheapestTrustedPaise: 492688,
    isSimulated: true,
  },
  {
    id: "fl-002",
    segments: [
      {
        airlineCode: "AI",
        airlineName: "Air India",
        flightNumber: "AI 865",
        aircraft: "Boeing 787-8",
        departureAirport: "DEL",
        departureTime: "07:00",
        arrivalAirport: "BOM",
        arrivalTime: "09:20",
        durationMinutes: 140,
      },
    ],
    totalDurationMinutes: 140,
    stops: 0,
    departureTime: "07:00",
    arrivalTime: "09:20",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("makemytrip", 529900, { checkInBaggage: "25 kg", mealIncluded: true, refundable: true }),
      makeOffer("cleartrip", 535000, { checkInBaggage: "25 kg", mealIncluded: true, refundable: true }),
      makeOffer("yatra", 539900, { checkInBaggage: "25 kg", mealIncluded: true }),
      makeOffer("goibibo", 549900, { checkInBaggage: "25 kg", mealIncluded: true }),
    ],
    cheapestPaise: 593488,
    cheapestTrustedPaise: 593488,
    isSimulated: true,
  },
  {
    id: "fl-003",
    segments: [
      {
        airlineCode: "SG",
        airlineName: "SpiceJet",
        flightNumber: "SG 8169",
        aircraft: "Boeing 737-800",
        departureAirport: "DEL",
        departureTime: "05:45",
        arrivalAirport: "BOM",
        arrivalTime: "08:10",
        durationMinutes: 145,
      },
    ],
    totalDurationMinutes: 145,
    stops: 0,
    departureTime: "05:45",
    arrivalTime: "08:10",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("easemytrip", 389900),
      makeOffer("happyeasygo", 385000, { verificationState: "unverified", trustScore: 65 }),
      makeOffer("paytm", 395000),
      makeOffer("ixigo", 399900),
    ],
    cheapestPaise: 431200,
    cheapestTrustedPaise: 436688,
    isSimulated: true,
  },
  {
    id: "fl-004",
    segments: [
      {
        airlineCode: "UK",
        airlineName: "Vistara",
        flightNumber: "UK 955",
        aircraft: "Airbus A321neo",
        departureAirport: "DEL",
        departureTime: "08:30",
        arrivalAirport: "BOM",
        arrivalTime: "10:50",
        durationMinutes: 140,
      },
    ],
    totalDurationMinutes: 140,
    stops: 0,
    departureTime: "08:30",
    arrivalTime: "10:50",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("cleartrip", 559900, { checkInBaggage: "20 kg", seatSelection: true }),
      makeOffer("makemytrip", 565000, { checkInBaggage: "20 kg", seatSelection: true }),
      makeOffer("goibibo", 569900, { checkInBaggage: "20 kg" }),
    ],
    cheapestPaise: 627088,
    cheapestTrustedPaise: 627088,
    isSimulated: true,
  },
  {
    id: "fl-005",
    segments: [
      {
        airlineCode: "QP",
        airlineName: "Akasa Air",
        flightNumber: "QP 1372",
        aircraft: "Boeing 737 MAX 8",
        departureAirport: "DEL",
        departureTime: "09:15",
        arrivalAirport: "BOM",
        arrivalTime: "11:30",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "09:15",
    arrivalTime: "11:30",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("cleartrip", 419900),
      makeOffer("ixigo", 425000),
      makeOffer("makemytrip", 429900),
      makeOffer("goibibo", 435000),
    ],
    cheapestPaise: 470288,
    cheapestTrustedPaise: 470288,
    isSimulated: true,
  },
  {
    id: "fl-006",
    segments: [
      {
        airlineCode: "6E",
        airlineName: "IndiGo",
        flightNumber: "6E 5309",
        aircraft: "Airbus A321neo",
        departureAirport: "DEL",
        departureTime: "10:00",
        arrivalAirport: "BOM",
        arrivalTime: "12:10",
        durationMinutes: 130,
      },
    ],
    totalDurationMinutes: 130,
    stops: 0,
    departureTime: "10:00",
    arrivalTime: "12:10",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("makemytrip", 469900),
      makeOffer("cleartrip", 475000),
      makeOffer("goibibo", 479900),
      makeOffer("yatra", 485000),
      makeOffer("easemytrip", 489900),
    ],
    cheapestPaise: 526288,
    cheapestTrustedPaise: 526288,
    isSimulated: true,
  },
  {
    id: "fl-007",
    segments: [
      {
        airlineCode: "AI",
        airlineName: "Air India",
        flightNumber: "AI 677",
        aircraft: "Airbus A320neo",
        departureAirport: "DEL",
        departureTime: "12:30",
        arrivalAirport: "BOM",
        arrivalTime: "14:50",
        durationMinutes: 140,
      },
    ],
    totalDurationMinutes: 140,
    stops: 0,
    departureTime: "12:30",
    arrivalTime: "14:50",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("yatra", 509900, { checkInBaggage: "25 kg", mealIncluded: true }),
      makeOffer("cleartrip", 515000, { checkInBaggage: "25 kg", mealIncluded: true }),
      makeOffer("makemytrip", 519900, { checkInBaggage: "25 kg", mealIncluded: true }),
    ],
    cheapestPaise: 571088,
    cheapestTrustedPaise: 571088,
    isSimulated: true,
  },
  {
    id: "fl-008",
    segments: [
      {
        airlineCode: "6E",
        airlineName: "IndiGo",
        flightNumber: "6E 2735",
        aircraft: "Airbus A320neo",
        departureAirport: "DEL",
        departureTime: "06:00",
        arrivalAirport: "JAI",
        arrivalTime: "07:00",
        durationMinutes: 60,
      },
      {
        airlineCode: "6E",
        airlineName: "IndiGo",
        flightNumber: "6E 831",
        aircraft: "Airbus A320neo",
        departureAirport: "JAI",
        departureTime: "08:30",
        arrivalAirport: "BOM",
        arrivalTime: "10:30",
        durationMinutes: 120,
      },
    ],
    totalDurationMinutes: 270,
    stops: 1,
    departureTime: "06:00",
    arrivalTime: "10:30",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("cleartrip", 349900),
      makeOffer("ixigo", 355000),
      makeOffer("easemytrip", 359900),
    ],
    cheapestPaise: 391888,
    cheapestTrustedPaise: 391888,
    isSimulated: true,
  },
  {
    id: "fl-009",
    segments: [
      {
        airlineCode: "SG",
        airlineName: "SpiceJet",
        flightNumber: "SG 713",
        aircraft: "Boeing 737-800",
        departureAirport: "DEL",
        departureTime: "14:00",
        arrivalAirport: "BOM",
        arrivalTime: "16:20",
        durationMinutes: 140,
      },
    ],
    totalDurationMinutes: 140,
    stops: 0,
    departureTime: "14:00",
    arrivalTime: "16:20",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("happyeasygo", 365000, { verificationState: "unverified", trustScore: 65 }),
      makeOffer("easemytrip", 379900),
      makeOffer("paytm", 385000),
      makeOffer("goibibo", 389900),
    ],
    cheapestPaise: 408800,
    cheapestTrustedPaise: 425488,
    isSimulated: true,
  },
  {
    id: "fl-010",
    segments: [
      {
        airlineCode: "QP",
        airlineName: "Akasa Air",
        flightNumber: "QP 1388",
        aircraft: "Boeing 737 MAX 8",
        departureAirport: "DEL",
        departureTime: "16:30",
        arrivalAirport: "BOM",
        arrivalTime: "18:45",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "16:30",
    arrivalTime: "18:45",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("cleartrip", 429900),
      makeOffer("makemytrip", 435000),
      makeOffer("ixigo", 439900),
    ],
    cheapestPaise: 481488,
    cheapestTrustedPaise: 481488,
    isSimulated: true,
  },
  {
    id: "fl-011",
    segments: [
      {
        airlineCode: "UK",
        airlineName: "Vistara",
        flightNumber: "UK 963",
        aircraft: "Boeing 787-9",
        departureAirport: "DEL",
        departureTime: "18:00",
        arrivalAirport: "BOM",
        arrivalTime: "20:15",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "18:00",
    arrivalTime: "20:15",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("makemytrip", 589900, { checkInBaggage: "25 kg", seatSelection: true, mealIncluded: true, refundable: true }),
      makeOffer("cleartrip", 595000, { checkInBaggage: "25 kg", seatSelection: true, mealIncluded: true, refundable: true }),
    ],
    cheapestPaise: 660688,
    cheapestTrustedPaise: 660688,
    isSimulated: true,
  },
  {
    id: "fl-012",
    segments: [
      {
        airlineCode: "AI",
        airlineName: "Air India",
        flightNumber: "AI 619",
        aircraft: "Airbus A321neo",
        departureAirport: "DEL",
        departureTime: "20:30",
        arrivalAirport: "BOM",
        arrivalTime: "22:45",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "20:30",
    arrivalTime: "22:45",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("goibibo", 499900, { checkInBaggage: "25 kg", mealIncluded: true }),
      makeOffer("yatra", 505000, { checkInBaggage: "25 kg", mealIncluded: true }),
      makeOffer("makemytrip", 509900, { checkInBaggage: "25 kg", mealIncluded: true }),
      makeOffer("cleartrip", 515000, { checkInBaggage: "25 kg", mealIncluded: true }),
    ],
    cheapestPaise: 559888,
    cheapestTrustedPaise: 559888,
    isSimulated: true,
  },
  {
    id: "fl-013",
    segments: [
      {
        airlineCode: "SG",
        airlineName: "SpiceJet",
        flightNumber: "SG 8723",
        aircraft: "Boeing 737 MAX 8",
        departureAirport: "DEL",
        departureTime: "07:30",
        arrivalAirport: "HYD",
        arrivalTime: "09:45",
        durationMinutes: 135,
      },
      {
        airlineCode: "SG",
        airlineName: "SpiceJet",
        flightNumber: "SG 271",
        aircraft: "Boeing 737-800",
        departureAirport: "HYD",
        departureTime: "11:00",
        arrivalAirport: "BOM",
        arrivalTime: "12:30",
        durationMinutes: 90,
      },
    ],
    totalDurationMinutes: 300,
    stops: 1,
    departureTime: "07:30",
    arrivalTime: "12:30",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("easemytrip", 329900),
      makeOffer("happyeasygo", 325000, { verificationState: "unverified", trustScore: 65 }),
      makeOffer("paytm", 335000),
    ],
    cheapestPaise: 364000,
    cheapestTrustedPaise: 369488,
    isSimulated: true,
  },
  {
    id: "fl-014",
    segments: [
      {
        airlineCode: "6E",
        airlineName: "IndiGo",
        flightNumber: "6E 6587",
        aircraft: "ATR 72-600",
        departureAirport: "DEL",
        departureTime: "11:30",
        arrivalAirport: "PNQ",
        arrivalTime: "13:45",
        durationMinutes: 135,
      },
      {
        airlineCode: "6E",
        airlineName: "IndiGo",
        flightNumber: "6E 5042",
        aircraft: "Airbus A320neo",
        departureAirport: "PNQ",
        departureTime: "15:00",
        arrivalAirport: "BOM",
        arrivalTime: "16:00",
        durationMinutes: 60,
      },
    ],
    totalDurationMinutes: 270,
    stops: 1,
    departureTime: "11:30",
    arrivalTime: "16:00",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("ixigo", 359900),
      makeOffer("cleartrip", 365000),
      makeOffer("makemytrip", 369900),
    ],
    cheapestPaise: 403088,
    cheapestTrustedPaise: 403088,
    isSimulated: true,
  },
  {
    id: "fl-015",
    segments: [
      {
        airlineCode: "IX",
        airlineName: "Air India Express",
        flightNumber: "IX 1452",
        aircraft: "Boeing 737-800",
        departureAirport: "DEL",
        departureTime: "22:00",
        arrivalAirport: "BOM",
        arrivalTime: "00:15",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "22:00",
    arrivalTime: "00:15",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("cleartrip", 399900),
      makeOffer("goibibo", 405000),
      makeOffer("ixigo", 409900),
      makeOffer("happyeasygo", 375000, { verificationState: "unverified", trustScore: 65 }),
    ],
    cheapestPaise: 420000,
    cheapestTrustedPaise: 447888,
    isSimulated: true,
  },
  {
    id: "fl-016",
    segments: [
      {
        airlineCode: "AI",
        airlineName: "Air India",
        flightNumber: "AI 801",
        aircraft: "Boeing 777-300ER",
        departureAirport: "DEL",
        departureTime: "15:30",
        arrivalAirport: "BOM",
        arrivalTime: "17:45",
        durationMinutes: 135,
      },
    ],
    totalDurationMinutes: 135,
    stops: 0,
    departureTime: "15:30",
    arrivalTime: "17:45",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    offers: [
      makeOffer("makemytrip", 619900, { checkInBaggage: "25 kg", mealIncluded: true, refundable: true, seatSelection: true, cabinBaggage: "8 kg" }),
      makeOffer("cleartrip", 625000, { checkInBaggage: "25 kg", mealIncluded: true, refundable: true, seatSelection: true, cabinBaggage: "8 kg" }),
      makeOffer("yatra", 629900, { checkInBaggage: "25 kg", mealIncluded: true, refundable: true }),
    ],
    cheapestPaise: 694288,
    cheapestTrustedPaise: 694288,
    isSimulated: true,
  },
];

// ─── Mock Price Alerts ───────────────────────────────────────────────────────

export const mockPriceAlerts: PriceAlert[] = [
  {
    id: "pa-001",
    origin: "DEL",
    destination: "BOM",
    departureDate: "2026-12-15",
    targetPricePaise: 400000,
    currentPricePaise: 439900,
    isActive: true,
    createdAt: "2026-11-15T10:00:00Z",
    triggeredAt: null,
    priceHistory: [
      { date: "2026-11-15", pricePaise: 520000 },
      { date: "2026-11-16", pricePaise: 510000 },
      { date: "2026-11-17", pricePaise: 495000 },
      { date: "2026-11-18", pricePaise: 475000 },
      { date: "2026-11-19", pricePaise: 460000 },
      { date: "2026-11-20", pricePaise: 445000 },
      { date: "2026-11-21", pricePaise: 439900 },
    ],
  },
  {
    id: "pa-002",
    origin: "BLR",
    destination: "GOI",
    departureDate: "2026-12-20",
    targetPricePaise: 300000,
    currentPricePaise: 289900,
    isActive: true,
    createdAt: "2026-11-10T14:00:00Z",
    triggeredAt: "2026-11-20T08:30:00Z",
    priceHistory: [
      { date: "2026-11-10", pricePaise: 380000 },
      { date: "2026-11-12", pricePaise: 360000 },
      { date: "2026-11-14", pricePaise: 340000 },
      { date: "2026-11-16", pricePaise: 320000 },
      { date: "2026-11-18", pricePaise: 305000 },
      { date: "2026-11-20", pricePaise: 289900 },
    ],
  },
  {
    id: "pa-003",
    origin: "DEL",
    destination: "BLR",
    departureDate: "2027-01-05",
    targetPricePaise: 350000,
    currentPricePaise: 489900,
    isActive: true,
    createdAt: "2026-11-18T16:00:00Z",
    triggeredAt: null,
    priceHistory: [
      { date: "2026-11-18", pricePaise: 510000 },
      { date: "2026-11-19", pricePaise: 500000 },
      { date: "2026-11-20", pricePaise: 495000 },
      { date: "2026-11-21", pricePaise: 489900 },
    ],
  },
];

// ─── Mock Recent Searches ────────────────────────────────────────────────────

export const mockRecentSearches: RecentSearch[] = [
  { id: "rs-001", origin: "DEL", destination: "BOM", departureDate: "2026-12-15", returnDate: null, passengers: 1, cheapestPricePaise: 439900, searchedAt: "2026-11-21T04:30:00Z" },
  { id: "rs-002", origin: "BLR", destination: "GOI", departureDate: "2026-12-20", returnDate: "2026-12-27", passengers: 2, cheapestPricePaise: 289900, searchedAt: "2026-11-20T18:00:00Z" },
  { id: "rs-003", origin: "DEL", destination: "BLR", departureDate: "2027-01-05", returnDate: null, passengers: 1, cheapestPricePaise: 489900, searchedAt: "2026-11-20T12:00:00Z" },
  { id: "rs-004", origin: "BOM", destination: "CCU", departureDate: "2026-12-28", returnDate: null, passengers: 3, cheapestPricePaise: 549900, searchedAt: "2026-11-19T22:00:00Z" },
  { id: "rs-005", origin: "MAA", destination: "DEL", departureDate: "2027-01-10", returnDate: "2027-01-15", passengers: 1, cheapestPricePaise: 399900, searchedAt: "2026-11-18T14:00:00Z" },
];

// ─── Popular Routes ──────────────────────────────────────────────────────────

export const popularRoutes: PopularRoute[] = [
  { origin: "DEL", originCity: "New Delhi", destination: "BOM", destinationCity: "Mumbai", cheapestPaise: 389900, imageEmoji: "🌆" },
  { origin: "BLR", originCity: "Bengaluru", destination: "DEL", destinationCity: "New Delhi", cheapestPaise: 429900, imageEmoji: "🏙️" },
  { origin: "DEL", originCity: "New Delhi", destination: "GOI", destinationCity: "Goa", cheapestPaise: 349900, imageEmoji: "🏖️" },
  { origin: "BOM", originCity: "Mumbai", destination: "BLR", destinationCity: "Bengaluru", cheapestPaise: 379900, imageEmoji: "🌳" },
  { origin: "HYD", originCity: "Hyderabad", destination: "DEL", destinationCity: "New Delhi", cheapestPaise: 409900, imageEmoji: "🕌" },
  { origin: "CCU", originCity: "Kolkata", destination: "BOM", destinationCity: "Mumbai", cheapestPaise: 459900, imageEmoji: "🌉" },
];

// ─── Price History for Route Chart ───────────────────────────────────────────

export const mockPriceHistory = [
  { date: "2026-10-21", pricePaise: 580000 },
  { date: "2026-10-28", pricePaise: 550000 },
  { date: "2026-11-04", pricePaise: 520000 },
  { date: "2026-11-07", pricePaise: 490000 },
  { date: "2026-11-10", pricePaise: 510000 },
  { date: "2026-11-13", pricePaise: 475000 },
  { date: "2026-11-15", pricePaise: 460000 },
  { date: "2026-11-17", pricePaise: 445000 },
  { date: "2026-11-19", pricePaise: 455000 },
  { date: "2026-11-21", pricePaise: 439900 },
];

// ─── Similar Flights ─────────────────────────────────────────────────────────

export const mockSimilarFlights = [
  { id: "fl-002", airline: "Air India", flightNumber: "AI 865", departure: "07:00", arrival: "09:20", pricePaise: 529900, stops: 0 },
  { id: "fl-005", airline: "Akasa Air", flightNumber: "QP 1372", departure: "09:15", arrival: "11:30", pricePaise: 419900, stops: 0 },
  { id: "fl-006", airline: "IndiGo", flightNumber: "6E 5309", departure: "10:00", arrival: "12:10", pricePaise: 469900, stops: 0 },
];

// Compatibility exports
export const mockAirports: Airport[] = Object.values(airports);
export const mockFlights: FlightResult[] = mockFlightResults;

