export type CurrencyCode = 'INR' | 'USD' | 'EUR';
export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First';
export type TripType = 'round-trip' | 'one-way' | 'multi-city';
export type SortOption = 'best' | 'cheapest' | 'fastest' | 'earliest';
export type TimeWindow = 'early' | 'morning' | 'afternoon' | 'evening'; // 00-06, 06-12, 12-18, 18-24

export interface Airport {
  code: string;       // e.g. 'DEL'
  city: string;       // e.g. 'New Delhi'
  name: string;       // e.g. 'Indira Gandhi International'
  country: string;
  tz?: string;        // IANA time zone, e.g. 'Asia/Kolkata'
}

export interface FlightSegment {
  id: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  aircraft: string;   // e.g. 'Airbus A321neo'
  origin: Airport;
  destination: Airport;
  departureISO: string;
  arrivalISO: string;
  terminalOrigin: string;
  terminalDest: string;
  durationMinutes: number;
  layoverAfterMinutes?: number;
}

export interface FareTier {
  id: 'saver' | 'flex' | 'business';
  name: string;
  priceInr: number;   // Base currency stored in INR; convert cleanly for USD/EUR
  taxesInr: number;
  cabinBagKg: number;
  checkinBagKg: number;
  cancellationFeeInr: number | null; // null = free cancellation
  seatSelectionFree: boolean;
  mealIncluded: boolean;
}

export interface FlightItinerary {
  id: string;
  segments: FlightSegment[];
  totalDurationMinutes: number;
  stops: number;
  onTimePercent: number;
  seatsRemaining: number;
  fareTiers: FareTier[];
  tags: ('non-stop' | 'cheapest' | 'fastest' | 'eco')[];
  /** Present when this itinerary comes from a live fare source, not demo data */
  live?: {
    bookingUrl: string;
    roundTrip: boolean;
    foundAt?: string;
    sourceName: string;
  };
}

export interface SeatCell {
  id: string;         // e.g. '12A'
  row: number;
  col: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  status: 'available' | 'occupied' | 'extra-legroom';
  feeInr: number;
}

export interface DayFare {
  dateISO: string;
  weekday: string;
  dayNumber: number;
  lowestPriceInr: number | null; // null = no recent fare known for that day
  isCheapest: boolean;
}

export interface SearchState {
  tripType: TripType;
  origin: Airport;
  destination: Airport;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: CabinClass;
  currency: CurrencyCode;
}
