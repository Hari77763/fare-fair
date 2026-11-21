import { Airport, FlightItinerary, DayFare, SeatCell } from '../types/flight';

// 10 Major Airports
export const majorAirports: Airport[] = [
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International', country: 'India' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International', country: 'India' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International', country: 'India' },
  { code: 'GOI', city: 'Goa', name: 'Manohar International (Mopa)', country: 'India' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'United Arab Emirates' },
  { code: 'SIN', city: 'Singapore', name: 'Changi International', country: 'Singapore' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'United Kingdom' },
];

export const airportMap: Record<string, Airport> = Object.fromEntries(
  majorAirports.map((a) => [a.code, a])
);

// 8 Rich Flight Itineraries
export const mockItineraries: FlightItinerary[] = [
  {
    id: 'fl-101',
    stops: 0,
    totalDurationMinutes: 130,
    onTimePercent: 94,
    seatsRemaining: 3,
    tags: ['non-stop', 'cheapest'],
    segments: [
      {
        id: 'seg-101',
        airlineCode: '6E',
        airlineName: 'IndiGo',
        flightNumber: '6E 2041',
        aircraft: 'Airbus A321neo',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T06:15:00Z',
        arrivalISO: '2026-12-14T08:25:00Z',
        terminalOrigin: 'T1D',
        terminalDest: 'T2',
        durationMinutes: 130,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Saver',
        priceInr: 4450,
        taxesInr: 720,
        cabinBagKg: 7,
        checkinBagKg: 15,
        cancellationFeeInr: 3000,
        seatSelectionFree: false,
        mealIncluded: false,
      },
      {
        id: 'flex',
        name: 'Flexi Plus',
        priceInr: 5850,
        taxesInr: 720,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 500,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'Stretch XL',
        priceInr: 9800,
        taxesInr: 950,
        cabinBagKg: 10,
        checkinBagKg: 30,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-102',
    stops: 0,
    totalDurationMinutes: 125,
    onTimePercent: 91,
    seatsRemaining: 5,
    tags: ['non-stop', 'fastest'],
    segments: [
      {
        id: 'seg-102',
        airlineCode: 'AI',
        airlineName: 'Air India',
        flightNumber: 'AI 865',
        aircraft: 'Boeing 787-8 Dreamliner',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T07:45:00Z',
        arrivalISO: '2026-12-14T09:50:00Z',
        terminalOrigin: 'T3',
        terminalDest: 'T2',
        durationMinutes: 125,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Comfort Economy',
        priceInr: 4890,
        taxesInr: 790,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 2500,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'flex',
        name: 'Flexi Fare',
        priceInr: 6300,
        taxesInr: 790,
        cabinBagKg: 8,
        checkinBagKg: 25,
        cancellationFeeInr: 400,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'Business Class',
        priceInr: 16500,
        taxesInr: 1400,
        cabinBagKg: 12,
        checkinBagKg: 35,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-103',
    stops: 0,
    totalDurationMinutes: 135,
    onTimePercent: 96,
    seatsRemaining: 8,
    tags: ['non-stop', 'eco'],
    segments: [
      {
        id: 'seg-103',
        airlineCode: 'QP',
        airlineName: 'Akasa Air',
        flightNumber: 'QP 1102',
        aircraft: 'Boeing 737 MAX 8',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T09:30:00Z',
        arrivalISO: '2026-12-14T11:45:00Z',
        terminalOrigin: 'T2',
        terminalDest: 'T1',
        durationMinutes: 135,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Saver',
        priceInr: 4620,
        taxesInr: 710,
        cabinBagKg: 7,
        checkinBagKg: 15,
        cancellationFeeInr: 2900,
        seatSelectionFree: false,
        mealIncluded: false,
      },
      {
        id: 'flex',
        name: 'Flexi',
        priceInr: 5900,
        taxesInr: 710,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 450,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'Akasa Premium',
        priceInr: 10500,
        taxesInr: 990,
        cabinBagKg: 10,
        checkinBagKg: 30,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-104',
    stops: 0,
    totalDurationMinutes: 130,
    onTimePercent: 92,
    seatsRemaining: 2,
    tags: ['non-stop'],
    segments: [
      {
        id: 'seg-104',
        airlineCode: 'UK',
        airlineName: 'Vistara',
        flightNumber: 'UK 995',
        aircraft: 'Airbus A321neo',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T11:00:00Z',
        arrivalISO: '2026-12-14T13:10:00Z',
        terminalOrigin: 'T3',
        terminalDest: 'T2',
        durationMinutes: 130,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Value',
        priceInr: 5200,
        taxesInr: 810,
        cabinBagKg: 7,
        checkinBagKg: 15,
        cancellationFeeInr: 2800,
        seatSelectionFree: false,
        mealIncluded: true,
      },
      {
        id: 'flex',
        name: 'Standard',
        priceInr: 6800,
        taxesInr: 810,
        cabinBagKg: 8,
        checkinBagKg: 20,
        cancellationFeeInr: 500,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'Club Vistara Business',
        priceInr: 18200,
        taxesInr: 1600,
        cabinBagKg: 12,
        checkinBagKg: 35,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-105',
    stops: 1,
    totalDurationMinutes: 240,
    onTimePercent: 88,
    seatsRemaining: 6,
    tags: [],
    segments: [
      {
        id: 'seg-105a',
        airlineCode: '6E',
        airlineName: 'IndiGo',
        flightNumber: '6E 502',
        aircraft: 'Airbus A320neo',
        origin: airportMap['DEL'],
        destination: airportMap['JAI'] || { code: 'JAI', city: 'Jaipur', name: 'Jaipur Airport', country: 'India' },
        departureISO: '2026-12-14T13:30:00Z',
        arrivalISO: '2026-12-14T14:30:00Z',
        terminalOrigin: 'T1',
        terminalDest: 'T2',
        durationMinutes: 60,
        layoverAfterMinutes: 50,
      },
      {
        id: 'seg-105b',
        airlineCode: '6E',
        airlineName: 'IndiGo',
        flightNumber: '6E 503',
        aircraft: 'Airbus A320neo',
        origin: airportMap['JAI'] || { code: 'JAI', city: 'Jaipur', name: 'Jaipur Airport', country: 'India' },
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T15:20:00Z',
        arrivalISO: '2026-12-14T17:30:00Z',
        terminalOrigin: 'T2',
        terminalDest: 'T2',
        durationMinutes: 130,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Saver',
        priceInr: 4190,
        taxesInr: 890,
        cabinBagKg: 7,
        checkinBagKg: 15,
        cancellationFeeInr: 3000,
        seatSelectionFree: false,
        mealIncluded: false,
      },
      {
        id: 'flex',
        name: 'Flexi Plus',
        priceInr: 5450,
        taxesInr: 890,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 600,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'Comfort XL',
        priceInr: 8900,
        taxesInr: 1100,
        cabinBagKg: 10,
        checkinBagKg: 30,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-106',
    stops: 0,
    totalDurationMinutes: 130,
    onTimePercent: 95,
    seatsRemaining: 4,
    tags: ['non-stop'],
    segments: [
      {
        id: 'seg-106',
        airlineCode: 'SG',
        airlineName: 'SpiceJet',
        flightNumber: 'SG 8169',
        aircraft: 'Boeing 737-800',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T16:45:00Z',
        arrivalISO: '2026-12-14T18:55:00Z',
        terminalOrigin: 'T1D',
        terminalDest: 'T2',
        durationMinutes: 130,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'SpiceSaver',
        priceInr: 4580,
        taxesInr: 740,
        cabinBagKg: 7,
        checkinBagKg: 15,
        cancellationFeeInr: 2900,
        seatSelectionFree: false,
        mealIncluded: false,
      },
      {
        id: 'flex',
        name: 'SpiceFlex',
        priceInr: 5950,
        taxesInr: 740,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 400,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'SpiceMax',
        priceInr: 9900,
        taxesInr: 1020,
        cabinBagKg: 10,
        checkinBagKg: 30,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-107',
    stops: 0,
    totalDurationMinutes: 125,
    onTimePercent: 93,
    seatsRemaining: 7,
    tags: ['non-stop'],
    segments: [
      {
        id: 'seg-107',
        airlineCode: 'AI',
        airlineName: 'Air India',
        flightNumber: 'AI 677',
        aircraft: 'Airbus A350-900',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T19:15:00Z',
        arrivalISO: '2026-12-14T21:20:00Z',
        terminalOrigin: 'T3',
        terminalDest: 'T2',
        durationMinutes: 125,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Economy',
        priceInr: 4950,
        taxesInr: 790,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 2500,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'flex',
        name: 'Flex Economy',
        priceInr: 6500,
        taxesInr: 790,
        cabinBagKg: 8,
        checkinBagKg: 25,
        cancellationFeeInr: 400,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'A350 Luxury Suite',
        priceInr: 19500,
        taxesInr: 1750,
        cabinBagKg: 14,
        checkinBagKg: 40,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
  {
    id: 'fl-108',
    stops: 0,
    totalDurationMinutes: 130,
    onTimePercent: 90,
    seatsRemaining: 1,
    tags: ['non-stop'],
    segments: [
      {
        id: 'seg-108',
        airlineCode: '6E',
        airlineName: 'IndiGo',
        flightNumber: '6E 5318',
        aircraft: 'Airbus A321neo',
        origin: airportMap['DEL'],
        destination: airportMap['BOM'],
        departureISO: '2026-12-14T22:30:00Z',
        arrivalISO: '2026-12-15T00:40:00Z',
        terminalOrigin: 'T1D',
        terminalDest: 'T2',
        durationMinutes: 130,
      },
    ],
    fareTiers: [
      {
        id: 'saver',
        name: 'Saver Late Night',
        priceInr: 4320,
        taxesInr: 720,
        cabinBagKg: 7,
        checkinBagKg: 15,
        cancellationFeeInr: 3000,
        seatSelectionFree: false,
        mealIncluded: false,
      },
      {
        id: 'flex',
        name: 'Flexi Plus',
        priceInr: 5700,
        taxesInr: 720,
        cabinBagKg: 7,
        checkinBagKg: 20,
        cancellationFeeInr: 500,
        seatSelectionFree: true,
        mealIncluded: true,
      },
      {
        id: 'business',
        name: 'Stretch XL',
        priceInr: 9600,
        taxesInr: 950,
        cabinBagKg: 10,
        checkinBagKg: 30,
        cancellationFeeInr: null,
        seatSelectionFree: true,
        mealIncluded: true,
      },
    ],
  },
];

// 7-Day Flexible Fare Strip
export const mockDayFares: DayFare[] = [
  { dateISO: '2026-12-11', weekday: 'Fri', dayNumber: 11, lowestPriceInr: 4790, isCheapest: false },
  { dateISO: '2026-12-12', weekday: 'Sat', dayNumber: 12, lowestPriceInr: 5350, isCheapest: false },
  { dateISO: '2026-12-13', weekday: 'Sun', dayNumber: 13, lowestPriceInr: 5120, isCheapest: false },
  { dateISO: '2026-12-14', weekday: 'Mon', dayNumber: 14, lowestPriceInr: 4190, isCheapest: true },
  { dateISO: '2026-12-15', weekday: 'Tue', dayNumber: 15, lowestPriceInr: 4450, isCheapest: false },
  { dateISO: '2026-12-16', weekday: 'Wed', dayNumber: 16, lowestPriceInr: 4620, isCheapest: false },
  { dateISO: '2026-12-17', weekday: 'Thu', dayNumber: 17, lowestPriceInr: 4890, isCheapest: false },
];

// 24-Row Cabin Layout (A B C - aisle - D E F)
export function generateMockSeats(): SeatCell[] {
  const seats: SeatCell[] = [];
  const cols: ('A' | 'B' | 'C' | 'D' | 'E' | 'F')[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (let row = 1; row <= 24; row++) {
    const isExitRow = row === 12 || row === 13;
    const isFrontRow = row <= 3;

    for (const col of cols) {
      const id = `${row}${col}`;
      // Pre-occupy ~35% of seats randomly for realistic density
      const seed = (row * 7 + col.charCodeAt(0) * 13) % 100;
      let status: 'available' | 'occupied' | 'extra-legroom' = 'available';

      if (seed < 36) {
        status = 'occupied';
      } else if (isExitRow || isFrontRow) {
        status = 'extra-legroom';
      }

      const fee = status === 'extra-legroom' ? 800 : (status === 'available' && row <= 6 ? 400 : 250);

      seats.push({
        id,
        row,
        col,
        status,
        feeInr: status === 'occupied' ? 0 : fee,
      });
    }
  }

  return seats;
}

// Currency Converter Multipliers (INR Base)
export const CURRENCY_RATES = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.0118 },
  EUR: { symbol: '€', rate: 0.0112 },
};

export function convertPrice(amountInr: number, currency: 'INR' | 'USD' | 'EUR'): string {
  const config = CURRENCY_RATES[currency] || CURRENCY_RATES.INR;
  const converted = Math.round(amountInr * config.rate);
  if (currency === 'INR') {
    return `₹${converted.toLocaleString('en-IN')}`;
  }
  return `${config.symbol}${converted.toLocaleString('en-US')}`;
}
