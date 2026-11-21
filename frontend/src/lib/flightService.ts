import { Airport, FlightItinerary, DayFare } from '../types/flight';
import { majorAirports, airportMap, generateFlightsForRoute, generateDayFaresForRoute } from '../data/mockFlights';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Search airports across both backend API and frontend catalog
 */
export async function searchAirports(query: string): Promise<Airport[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return majorAirports.slice(0, 15);

  try {
    const res = await fetch(`${API_BASE_URL}/airports/search?q=${encodeURIComponent(trimmed)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          code: item.code,
          city: item.city,
          name: item.name,
          country: item.country || 'India',
        }));
      }
    }
  } catch (err) {
    // Graceful fallback to local catalog
    console.debug('Backend airport search offline, using local catalog');
  }

  // Local fallback search across 75+ airports
  return majorAirports.filter((a) => {
    return (
      a.code.toLowerCase().includes(trimmed) ||
      a.city.toLowerCase().includes(trimmed) ||
      a.name.toLowerCase().includes(trimmed) ||
      a.country.toLowerCase().includes(trimmed)
    );
  }).slice(0, 15);
}

/**
 * Fetch flights for any specific origin -> destination route
 */
export async function getFlightsForRoute(
  origin: Airport,
  destination: Airport,
  departureDateISO: string
): Promise<FlightItinerary[]> {
  try {
    // 1. Initiate search on FastAPI backend
    const searchRes = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: origin.code,
        destination: destination.code,
        departure_date: departureDateISO,
        adults: 1,
        cabin_class: 'economy',
        trip_type: 'one_way',
      }),
      cache: 'no-store',
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const searchId = searchData.id;

      // 2. Fetch results for this search ID
      const resultsRes = await fetch(`${API_BASE_URL}/search/${searchId}/results`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (resultsRes.ok) {
        const journeys = await resultsRes.json();
        if (Array.isArray(journeys) && journeys.length > 0) {
          // Map backend JourneySchema to frontend FlightItinerary
          return journeys.map((j: any, idx: number) => {
            const seg = j.segments[0] || {};
            const basePrice = Math.round(j.cheapest_price_paise / 100);
            const taxes = Math.round(basePrice * 0.16);

            return {
              id: j.id || `fl-${origin.code.toLowerCase()}-${destination.code.toLowerCase()}-${idx + 1}`,
              stops: j.stops || 0,
              totalDurationMinutes: j.duration_minutes || 120,
              onTimePercent: 90 + ((idx * 3) % 8),
              seatsRemaining: ((idx * 2 + 1) % 5) + 1,
              tags: idx === 0 ? ['cheapest', 'non-stop'] : j.stops === 0 ? ['non-stop'] : ['eco'],
              segments: [
                {
                  id: `seg-${origin.code.toLowerCase()}-${idx + 1}`,
                  airlineCode: j.airline_code || '6E',
                  airlineName: j.airline_name || 'IndiGo',
                  flightNumber: seg.flight_number || `${j.airline_code || '6E'} ${idx * 150 + 201}`,
                  aircraft: seg.aircraft_type || 'Airbus A321neo',
                  origin,
                  destination,
                  departureISO: j.departure_time,
                  arrivalISO: j.arrival_time,
                  terminalOrigin: 'T1',
                  terminalDest: 'T2',
                  durationMinutes: j.duration_minutes || 120,
                },
              ],
              fareTiers: [
                {
                  id: 'saver',
                  name: 'Saver',
                  priceInr: basePrice,
                  taxesInr: taxes,
                  cabinBagKg: 7,
                  checkinBagKg: 15,
                  cancellationFeeInr: Math.round(basePrice * 0.6),
                  seatSelectionFree: false,
                  mealIncluded: false,
                },
                {
                  id: 'flex',
                  name: 'Flexi Plus',
                  priceInr: Math.round(basePrice * 1.25),
                  taxesInr: taxes,
                  cabinBagKg: 7,
                  checkinBagKg: 20,
                  cancellationFeeInr: 500,
                  seatSelectionFree: true,
                  mealIncluded: true,
                },
                {
                  id: 'business',
                  name: 'Stretch XL',
                  priceInr: Math.round(basePrice * 2.2),
                  taxesInr: Math.round(taxes * 1.5),
                  cabinBagKg: 10,
                  checkinBagKg: 30,
                  cancellationFeeInr: null,
                  seatSelectionFree: true,
                  mealIncluded: true,
                },
              ],
            };
          });
        }
      }
    }
  } catch (err) {
    console.debug('Direct backend API fetch error, utilizing dynamic route engine');
  }

  // High-fidelity fallback dynamic generator (100% reliable for any route)
  return generateFlightsForRoute(origin, destination, departureDateISO);
}
