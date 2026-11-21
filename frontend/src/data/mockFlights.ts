import { Airport, FlightItinerary, DayFare, SeatCell, CurrencyCode } from '../types/flight';

// Comprehensive catalog of 75+ Indian and major international airports
export const majorAirports: Airport[] = [
  // Top Tier 1 Indian Metro Hubs
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International', country: 'India' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International', country: 'India' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International', country: 'India' },
  { code: 'GOI', city: 'Goa', name: 'Dabolim Airport', country: 'India' },
  { code: 'GOX', city: 'Goa (Mopa)', name: 'Manohar International Airport', country: 'India' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International', country: 'India' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International', country: 'India' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport', country: 'India' },

  // Tier 2 & Regional Indian Hubs
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International', country: 'India' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International', country: 'India' },
  { code: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh International', country: 'India' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International', country: 'India' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam International', country: 'India' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International', country: 'India' },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik International', country: 'India' },
  { code: 'IDR', city: 'Indore', name: 'Devi Ahilya Bai Holkar Airport', country: 'India' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Airport', country: 'India' },
  { code: 'IXB', city: 'Bagdogra (Siliguri)', name: 'Bagdogra International', country: 'India' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar International', country: 'India' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri International', country: 'India' },
  { code: 'RPR', city: 'Raipur', name: 'Swami Vivekananda Airport', country: 'India' },
  { code: 'IXR', city: 'Ranchi', name: 'Birsa Munda Airport', country: 'India' },
  { code: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam International', country: 'India' },
  { code: 'CJB', city: 'Coimbatore', name: 'Coimbatore International', country: 'India' },
  { code: 'IXM', city: 'Madurai', name: 'Madurai Airport', country: 'India' },
  { code: 'IMF', city: 'Imphal', name: 'Bir Tikendrajit International', country: 'India' },
  { code: 'CCJ', city: 'Kozhikode', name: 'Calicut International Airport', country: 'India' },
  { code: 'UDR', city: 'Udaipur', name: 'Maharana Pratap Airport', country: 'India' },
  { code: 'STV', city: 'Surat', name: 'Surat International Airport', country: 'India' },
  { code: 'DED', city: 'Dehradun', name: 'Jolly Grant Airport', country: 'India' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar International', country: 'India' },
  { code: 'MAQ', city: 'Mangalore', name: 'Mangaluru International', country: 'India' },
  { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International', country: 'India' },
  { code: 'BDQ', city: 'Vadodara', name: 'Vadodara Airport', country: 'India' },
  { code: 'IXL', city: 'Leh (Ladakh)', name: 'Kushok Bakula Rimpochee Airport', country: 'India' },
  { code: 'IXJ', city: 'Jammu', name: 'Jammu Airport', country: 'India' },
  { code: 'BHO', city: 'Bhopal', name: 'Raja Bhoj Airport', country: 'India' },
  { code: 'GWL', city: 'Gwalior', name: 'Rajmata Vijaya Raje Scindia Airport', country: 'India' },
  { code: 'TIR', city: 'Tirupati', name: 'Tirupati Airport', country: 'India' },
  { code: 'TRZ', city: 'Tiruchirappalli', name: 'Tiruchirappalli International', country: 'India' },
  { code: 'VGA', city: 'Vijayawada', name: 'Vijayawada International', country: 'India' },
  { code: 'JDH', city: 'Jodhpur', name: 'Jodhpur Airport', country: 'India' },
  { code: 'IXU', city: 'Aurangabad', name: 'Chhatrapati Sambhajinagar Airport', country: 'India' },
  { code: 'KNU', city: 'Kanpur', name: 'Kanpur Airport', country: 'India' },
  { code: 'DMU', city: 'Dimapur', name: 'Dimapur Airport', country: 'India' },
  { code: 'AJL', city: 'Aizawl', name: 'Lengpui Airport', country: 'India' },
  { code: 'SHL', city: 'Shillong', name: 'Shillong Airport (Umroi)', country: 'India' },
  { code: 'TEZ', city: 'Tezpur', name: 'Tezpur Airport', country: 'India' },
  { code: 'DIB', city: 'Dibrugarh', name: 'Dibrugarh Airport', country: 'India' },
  { code: 'JLR', city: 'Jabalpur', name: 'Jabalpur Airport', country: 'India' },

  // Top International Destinations
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'United Arab Emirates' },
  { code: 'AUH', city: 'Abu Dhabi', name: 'Zayed International Airport', country: 'United Arab Emirates' },
  { code: 'DOH', city: 'Doha', name: 'Hamad International Airport', country: 'Qatar' },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
  { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International', country: 'Malaysia' },
  { code: 'LHR', city: 'London', name: 'London Heathrow Airport', country: 'United Kingdom' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany' },
  { code: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', country: 'Netherlands' },
  { code: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', country: 'United States' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'United States' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International Airport", country: 'United States' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport', country: 'United States' },
  { code: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International', country: 'Canada' },
  { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia' },
  { code: 'MEL', city: 'Melbourne', name: 'Melbourne Airport', country: 'Australia' },
  { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong International Airport', country: 'Hong Kong' },
  { code: 'NRT', city: 'Tokyo', name: 'Narita International Airport', country: 'Japan' },
  { code: 'ICN', city: 'Seoul', name: 'Incheon International Airport', country: 'South Korea' },
  { code: 'CMB', city: 'Colombo', name: 'Bandaranaike International Airport', country: 'Sri Lanka' },
  { code: 'DAC', city: 'Dhaka', name: 'Hazrat Shahjalal International', country: 'Bangladesh' },
  { code: 'KTM', city: 'Kathmandu', name: 'Tribhuvan International Airport', country: 'Nepal' },
  { code: 'MLE', city: 'Male', name: 'Velana International Airport', country: 'Maldives' },
];

export const airportMap: Record<string, Airport> = Object.fromEntries(
  majorAirports.map((a) => [a.code, a])
);

// Route parameters calculation helper
export function getRouteProfile(originCode: string, destCode: string) {
  const intlLong = new Set(['LHR', 'CDG', 'FRA', 'AMS', 'ZRH', 'JFK', 'SFO', 'ORD', 'LAX', 'YYZ', 'SYD', 'MEL']);
  const intlMid = new Set(['DXB', 'AUH', 'DOH', 'SIN', 'BKK', 'KUL', 'HKG', 'NRT', 'ICN']);
  const intlShort = new Set(['CMB', 'DAC', 'KTM', 'MLE']);

  const isIntlLong = intlLong.has(originCode) || intlLong.has(destCode);
  const isIntlMid = intlMid.has(originCode) || intlMid.has(destCode);
  const isIntlShort = intlShort.has(originCode) || intlShort.has(destCode);

  // Transcontinental US / Europe
  if (isIntlLong) {
    if (['JFK', 'SFO', 'ORD', 'LAX', 'YYZ'].includes(originCode) || ['JFK', 'SFO', 'ORD', 'LAX', 'YYZ'].includes(destCode)) {
      return {
        baseDurationMinutes: 940, // ~15h 40m
        basePriceInr: 64500,
        baseTaxesInr: 7800,
        airlines: [
          { code: 'AI', name: 'Air India', aircraft: 'Boeing 777-300ER', baggage: 23 },
          { code: 'EK', name: 'Emirates', aircraft: 'Airbus A380-800', baggage: 25 },
          { code: 'QR', name: 'Qatar Airways', aircraft: 'Airbus A350-1000', baggage: 25 },
          { code: 'BA', name: 'British Airways', aircraft: 'Boeing 787-9 Dreamliner', baggage: 23 },
        ],
      };
    }
    return {
      baseDurationMinutes: 550, // ~9h 10m
      basePriceInr: 42000,
      baseTaxesInr: 5900,
      airlines: [
        { code: 'AI', name: 'Air India', aircraft: 'Boeing 787-8 Dreamliner', baggage: 23 },
        { code: 'BA', name: 'British Airways', aircraft: 'Boeing 777-200ER', baggage: 23 },
        { code: 'LH', name: 'Lufthansa', aircraft: 'Airbus A350-900', baggage: 23 },
        { code: 'EK', name: 'Emirates', aircraft: 'Boeing 777-300ER', baggage: 25 },
      ],
    };
  }

  // Middle East & Southeast Asia
  if (isIntlMid) {
    if (['DXB', 'AUH', 'DOH'].includes(originCode) || ['DXB', 'AUH', 'DOH'].includes(destCode)) {
      return {
        baseDurationMinutes: 235, // ~3h 55m
        basePriceInr: 15800,
        baseTaxesInr: 2850,
        airlines: [
          { code: 'EK', name: 'Emirates', aircraft: 'Boeing 777-300ER', baggage: 25 },
          { code: '6E', name: 'IndiGo', aircraft: 'Airbus A321neo', baggage: 20 },
          { code: 'AI', name: 'Air India', aircraft: 'Airbus A320neo', baggage: 25 },
          { code: 'QR', name: 'Qatar Airways', aircraft: 'Boeing 787-8 Dreamliner', baggage: 25 },
        ],
      };
    }
    return {
      baseDurationMinutes: 260, // ~4h 20m
      basePriceInr: 17900,
      baseTaxesInr: 3100,
      airlines: [
        { code: 'SQ', name: 'Singapore Airlines', aircraft: 'Airbus A350-900', baggage: 25 },
        { code: '6E', name: 'IndiGo', aircraft: 'Airbus A321neo', baggage: 20 },
        { code: 'AI', name: 'Air India', aircraft: 'Airbus A320neo', baggage: 25 },
        { code: 'TG', name: 'Thai Airways', aircraft: 'Boeing 787-8 Dreamliner', baggage: 25 },
      ],
    };
  }

  // Neighboring International
  if (isIntlShort) {
    return {
      baseDurationMinutes: 140, // ~2h 20m
      basePriceInr: 11200,
      baseTaxesInr: 2150,
      airlines: [
        { code: '6E', name: 'IndiGo', aircraft: 'Airbus A320neo', baggage: 20 },
        { code: 'AI', name: 'Air India', aircraft: 'Airbus A320neo', baggage: 25 },
        { code: 'UL', name: 'SriLankan Airlines', aircraft: 'Airbus A321neo', baggage: 25 },
      ],
    };
  }

  // Domestic Short Routes (MAA-BLR, BOM-GOI, DEL-JAI, etc.)
  const shortDomestic = [
    'MAA-BLR', 'BLR-MAA', 'BOM-GOI', 'GOI-BOM', 'BOM-PNQ', 'PNQ-BOM',
    'DEL-JAI', 'JAI-DEL', 'DEL-IXC', 'IXC-DEL', 'BLR-HYD', 'HYD-BLR',
    'MAA-CJB', 'CJB-MAA', 'BOM-AMD', 'AMD-BOM', 'COK-BLR', 'BLR-COK',
  ];
  if (shortDomestic.includes(`${originCode}-${destCode}`)) {
    return {
      baseDurationMinutes: 65, // ~1h 05m
      basePriceInr: 2950,
      baseTaxesInr: 580,
      airlines: [
        { code: '6E', name: 'IndiGo', aircraft: 'Airbus A320neo', baggage: 15 },
        { code: 'QP', name: 'Akasa Air', aircraft: 'Boeing 737 MAX 8', baggage: 15 },
        { code: 'AI', name: 'Air India', aircraft: 'Airbus A320neo', baggage: 15 },
        { code: 'SG', name: 'SpiceJet', aircraft: 'Boeing 737-800', baggage: 15 },
      ],
    };
  }

  // Domestic Long Routes (MAA-DEL, BLR-DEL, CCU-BOM, TRV-DEL, etc.)
  const longDomestic = [
    'MAA-DEL', 'DEL-MAA', 'BLR-DEL', 'DEL-BLR', 'CCU-BOM', 'BOM-CCU',
    'TRV-DEL', 'DEL-TRV', 'COK-DEL', 'DEL-COK', 'GAU-DEL', 'DEL-GAU',
    'SXR-BOM', 'BOM-SXR', 'MAA-CCU', 'CCU-MAA', 'HYD-DEL', 'DEL-HYD',
  ];
  if (longDomestic.includes(`${originCode}-${destCode}`)) {
    return {
      baseDurationMinutes: 165, // ~2h 45m
      basePriceInr: 4790,
      baseTaxesInr: 780,
      airlines: [
        { code: '6E', name: 'IndiGo', aircraft: 'Airbus A321neo', baggage: 15 },
        { code: 'AI', name: 'Air India', aircraft: 'Airbus A320neo', baggage: 15 },
        { code: 'UK', name: 'Vistara', aircraft: 'Airbus A321neo', baggage: 15 },
        { code: 'QP', name: 'Akasa Air', aircraft: 'Boeing 737 MAX 8', baggage: 15 },
        { code: 'SG', name: 'SpiceJet', aircraft: 'Boeing 737-800', baggage: 15 },
      ],
    };
  }

  // Domestic Medium Routes (DEL-BOM, BOM-BLR, CCU-DEL, etc.)
  return {
    baseDurationMinutes: 130, // ~2h 10m
    basePriceInr: 3950,
    baseTaxesInr: 690,
    airlines: [
      { code: '6E', name: 'IndiGo', aircraft: 'Airbus A321neo', baggage: 15 },
      { code: 'QP', name: 'Akasa Air', aircraft: 'Boeing 737 MAX 8', baggage: 15 },
      { code: 'AI', name: 'Air India', aircraft: 'Airbus A320neo', baggage: 15 },
      { code: 'UK', name: 'Vistara', aircraft: 'Airbus A321neo', baggage: 15 },
      { code: 'SG', name: 'SpiceJet', aircraft: 'Boeing 737-800', baggage: 15 },
    ],
  };
}

// Dynamically generate flights tailored specifically to ANY requested origin and destination
export function generateFlightsForRoute(
  origin: Airport,
  destination: Airport,
  departureDateISO: string = '2027-01-28'
): FlightItinerary[] {
  const profile = getRouteProfile(origin.code, destination.code);
  const baseDate = new Date(departureDateISO);

  // 10 realistic flight schedules throughout the day
  const flightSchedules = [
    { depH: 6, depM: 15, stops: 0, mult: 0.95, tags: ['cheapest', 'non-stop'] as ('cheapest' | 'non-stop')[], onTime: 95 },
    { depH: 7, depM: 45, stops: 0, mult: 0.92, tags: ['non-stop', 'fastest'] as ('non-stop' | 'fastest')[], onTime: 92 },
    { depH: 9, depM: 30, stops: 0, mult: 1.08, tags: ['non-stop'] as 'non-stop'[], onTime: 90 },
    { depH: 11, depM: 15, stops: 0, mult: 1.02, tags: ['non-stop'] as 'non-stop'[], onTime: 93 },
    { depH: 13, depM: 30, stops: 1, mult: 0.88, tags: ['eco'] as 'eco'[], onTime: 86 }, // 1-stop budget option
    { depH: 15, depM: 20, stops: 0, mult: 1.04, tags: ['non-stop'] as 'non-stop'[], onTime: 91 },
    { depH: 17, depM: 45, stops: 0, mult: 1.15, tags: ['non-stop'] as 'non-stop'[], onTime: 89 },
    { depH: 19, depM: 10, stops: 0, mult: 1.10, tags: ['non-stop'] as 'non-stop'[], onTime: 92 },
    { depH: 21, depM: 0, stops: 0, mult: 0.96, tags: ['non-stop'] as 'non-stop'[], onTime: 94 },
    { depH: 22, depM: 45, stops: 0, mult: 0.90, tags: ['non-stop', 'cheapest'] as ('non-stop' | 'cheapest')[], onTime: 96 },
  ];

  return flightSchedules.map((sched, idx) => {
    const airlineInfo = profile.airlines[idx % profile.airlines.length];
    const duration = sched.stops === 0 ? profile.baseDurationMinutes : (profile.baseDurationMinutes + 80);

    const depDate = new Date(baseDate);
    depDate.setUTCHours(sched.depH, sched.depM, 0, 0);

    const arrDate = new Date(depDate.getTime() + duration * 60000);

    const calculatedBase = Math.round(profile.basePriceInr * sched.mult / 10) * 10;
    const taxes = profile.baseTaxesInr;

    // Terminal logic
    const tOrigin = ['DEL', 'BOM'].includes(origin.code)
      ? (airlineInfo.code === '6E' || airlineInfo.code === 'QP' ? 'T1' : 'T2')
      : 'T1';
    const tDest = ['DEL', 'BOM'].includes(destination.code)
      ? (airlineInfo.code === 'AI' || airlineInfo.code === 'UK' ? 'T3' : 'T2')
      : 'T1';

    const numCode = (idx * 179 + 201) % 899 + 100;
    const flightNum = `${airlineInfo.code} ${numCode}`;

    return {
      id: `fl-${origin.code.toLowerCase()}-${destination.code.toLowerCase()}-${idx + 1}`,
      stops: sched.stops,
      totalDurationMinutes: duration,
      onTimePercent: sched.onTime,
      seatsRemaining: ((idx * 3 + 2) % 6) + 1,
      tags: sched.tags,
      segments: [
        {
          id: `seg-${origin.code.toLowerCase()}-${idx + 1}`,
          airlineCode: airlineInfo.code,
          airlineName: airlineInfo.name,
          flightNumber: flightNum,
          aircraft: airlineInfo.aircraft,
          origin,
          destination,
          departureISO: depDate.toISOString(),
          arrivalISO: arrDate.toISOString(),
          terminalOrigin: tOrigin,
          terminalDest: tDest,
          durationMinutes: duration,
        },
      ],
      fareTiers: [
        {
          id: 'saver',
          name: 'Saver',
          priceInr: calculatedBase,
          taxesInr: taxes,
          cabinBagKg: 7,
          checkinBagKg: airlineInfo.baggage,
          cancellationFeeInr: Math.round(calculatedBase * 0.65),
          seatSelectionFree: false,
          mealIncluded: false,
        },
        {
          id: 'flex',
          name: 'Flexi Plus',
          priceInr: Math.round(calculatedBase * 1.25),
          taxesInr: taxes,
          cabinBagKg: 7,
          checkinBagKg: airlineInfo.baggage + 5,
          cancellationFeeInr: 500,
          seatSelectionFree: true,
          mealIncluded: true,
        },
        {
          id: 'business',
          name: profile.baseDurationMinutes > 300 ? 'Business Class' : 'Stretch XL',
          priceInr: Math.round(calculatedBase * 2.3),
          taxesInr: Math.round(taxes * 1.5),
          cabinBagKg: 12,
          checkinBagKg: airlineInfo.baggage + 15,
          cancellationFeeInr: null, // free cancellation
          seatSelectionFree: true,
          mealIncluded: true,
        },
      ],
    };
  });
}

// Generate dynamic 7-day flexible date strip around any chosen departure date
export function generateDayFaresForRoute(
  origin: Airport,
  destination: Airport,
  baseDateISO: string = '2027-01-28'
): DayFare[] {
  const profile = getRouteProfile(origin.code, destination.code);
  const baseDate = new Date(baseDateISO);

  const days: DayFare[] = [];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 7 days starting from baseDate
  const variations = [1.02, 1.12, 1.08, 0.88, 0.94, 0.98, 1.04];
  let lowestIdx = 3; // day 4 (index 3) is cheapest

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setUTCDate(baseDate.getUTCDate() + i);

    const dateISO = d.toISOString().split('T')[0];
    const weekday = weekdays[d.getUTCDay()];
    const dayNumber = d.getUTCDate();

    const fare = Math.round((profile.basePriceInr * variations[i] + profile.baseTaxesInr) / 10) * 10;

    days.push({
      dateISO,
      weekday,
      dayNumber,
      lowestPriceInr: fare,
      isCheapest: i === lowestIdx,
    });
  }

  return days;
}

// Default initial datasets (Chennai MAA -> Bengaluru BLR)
export const mockItineraries: FlightItinerary[] = generateFlightsForRoute(
  airportMap['MAA'] || majorAirports[3],
  airportMap['BLR'] || majorAirports[2],
  '2027-01-28'
);

export const mockDayFares: DayFare[] = generateDayFaresForRoute(
  airportMap['MAA'] || majorAirports[3],
  airportMap['BLR'] || majorAirports[2],
  '2027-01-28'
);

// Cabin Seat Map Generator
export function generateMockSeats(): SeatCell[] {
  const seats: SeatCell[] = [];
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20];
  const cols: ('A' | 'B' | 'C' | 'D' | 'E' | 'F')[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  rows.forEach((r) => {
    cols.forEach((c) => {
      const isExtraLeg = r === 1 || r === 12 || r === 14;
      const isOcc = (r * 7 + c.charCodeAt(0)) % 4 === 0;
      seats.push({
        id: `${r}${c}`,
        row: r,
        col: c,
        status: isOcc ? 'occupied' : isExtraLeg ? 'extra-legroom' : 'available',
        feeInr: isExtraLeg ? 800 : r <= 4 ? 350 : 0,
      });
    });
  });
  return seats;
}

// Live Multi-Currency Converter
export function convertPrice(amountInr: number, currency: CurrencyCode): string {
  if (currency === 'USD') {
    const usd = (amountInr / 86.5).toFixed(0);
    return `$${Number(usd).toLocaleString('en-US')}`;
  }
  if (currency === 'EUR') {
    const eur = (amountInr / 91.2).toFixed(0);
    return `€${Number(eur).toLocaleString('en-US')}`;
  }
  return `₹${amountInr.toLocaleString('en-IN')}`;
}
