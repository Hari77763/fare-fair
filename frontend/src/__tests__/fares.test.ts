import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildBookingUrl,
  getConfig,
  normalizeCalendar,
  normalizePricesForDates,
  parseCalendarQuery,
  parseFareQuery,
  searchDeepLink,
} from '../lib/fares/travelpayouts';
import { liveFareToItinerary, wallClockISO } from '../lib/fares/toItinerary';
import { GET as faresGET } from '../app/api/fares/route';
import { GET as calendarGET } from '../app/api/fares/calendar/route';

// Synthetic payload in the prices_for_dates format
const SAMPLE = {
  success: true,
  currency: 'inr',
  data: [
    {
      origin: 'DEL',
      destination: 'BOM',
      origin_airport: 'DEL',
      destination_airport: 'BOM',
      price: 5120,
      airline: '6E',
      flight_number: '2041',
      departure_at: '2026-12-14T06:15:00+05:30',
      transfers: 0,
      duration_to: 130,
      link: '/search/DEL1412BOM1?t=abc',
    },
    {
      origin: 'DEL',
      destination: 'BOM',
      price: 4890,
      airline: 'QP',
      flight_number: 1101,
      departure_at: '2026-12-14T22:30:00+05:30',
      transfers: 1,
      duration: 300,
      link: 'https://evil.example.com/phish',
    },
    // duplicate of the first, more expensive → dropped
    { ...{ price: 6000, airline: '6E', flight_number: '2041', departure_at: '2026-12-14T06:15:00+05:30' } },
    // unusable rows → dropped
    { price: 0, departure_at: '2026-12-14T10:00:00+05:30' },
    { price: 3000 },
    'garbage',
  ],
};

const CTX = { origin: 'DEL', destination: 'BOM', departureDate: '2026-12-14', marker: '12345' };

describe('normalizePricesForDates', () => {
  const fares = normalizePricesForDates(SAMPLE, CTX);

  it('keeps valid rows, dedupes by flight and sorts by price', () => {
    expect(fares.map((f) => f.priceInr)).toEqual([4890, 5120]);
  });

  it('maps fields and builds a marked Aviasales booking link', () => {
    const f = fares.find((x) => x.airlineCode === '6E')!;
    expect(f.flightNumber).toBe('6E 2041');
    expect(f.durationMinutes).toBe(130);
    expect(f.transfers).toBe(0);
    expect(f.bookingUrl).toBe('https://www.aviasales.com/search/DEL1412BOM1?t=abc&marker=12345');
  });

  it('never links to a non-Aviasales host (falls back to a search deep link)', () => {
    const f = fares.find((x) => x.airlineCode === 'QP')!;
    expect(f.bookingUrl).toBe('https://www.aviasales.com/search/DEL1412BOM1?marker=12345');
  });

  it('does not trust durations for connecting itineraries (they exclude layovers)', () => {
    const f = fares.find((x) => x.airlineCode === 'QP')!;
    expect(f.transfers).toBe(1);
    expect(f.durationMinutes).toBeNull();
  });

  it('refuses prices in a currency other than INR', () => {
    expect(() => normalizePricesForDates({ ...SAMPLE, currency: 'rub' }, CTX)).toThrow(/currency/);
  });

  it('returns [] for unexpected payloads', () => {
    expect(normalizePricesForDates(null, CTX)).toEqual([]);
    expect(normalizePricesForDates({ data: {} }, CTX)).toEqual([]);
  });
});

describe('booking links', () => {
  it('rejects other hosts, non-https and non-strings', () => {
    expect(buildBookingUrl('https://example.com/x')).toBeNull();
    expect(buildBookingUrl('http://www.aviasales.com/x')).toBeNull();
    expect(buildBookingUrl(42)).toBeNull();
  });

  it('builds round-trip deep links', () => {
    expect(searchDeepLink('DEL', 'GOI', '2026-12-14', undefined, '2026-12-21')).toBe(
      'https://www.aviasales.com/search/DEL1412GOI21121'
    );
  });
});

describe('normalizeCalendar', () => {
  it('reads the documented v1 shape (keyed by date) and fills gaps with null', () => {
    const days = normalizeCalendar(
      [{ success: true, data: { '2026-12-11': { price: 4790 }, '2026-12-13': { price: 5120 } } }],
      '2026-12-11',
      4
    );
    expect(days).toEqual([
      { dateISO: '2026-12-11', priceInr: 4790 },
      { dateISO: '2026-12-12', priceInr: null },
      { dateISO: '2026-12-13', priceInr: 5120 },
      { dateISO: '2026-12-14', priceInr: null },
    ]);
  });

  it('reads the v3 month shape (departure_at + price) used in production', () => {
    const days = normalizeCalendar(
      [
        {
          currency: 'inr',
          data: [
            { departure_at: '2026-12-13T07:10:00+05:30', price: 7036 },
            { departure_at: '2026-12-13T21:00:00+05:30', price: 6900 },
            { departure_at: '2026-12-14T06:00:00+05:30', price: 5200 },
          ],
        },
      ],
      '2026-12-13',
      2
    );
    expect(days).toEqual([
      { dateISO: '2026-12-13', priceInr: 6900 },
      { dateISO: '2026-12-14', priceInr: 5200 },
    ]);
  });

  it('reads the v2 array shape and keeps the cheapest per day across months', () => {
    const days = normalizeCalendar(
      [
        { data: [{ depart_date: '2026-12-31', value: 7000 }, { depart_date: '2026-12-31', value: 6500 }] },
        { data: [{ depart_date: '2027-01-01', value: 5000 }] },
      ],
      '2026-12-31',
      2
    );
    expect(days).toEqual([
      { dateISO: '2026-12-31', priceInr: 6500 },
      { dateISO: '2027-01-01', priceInr: 5000 },
    ]);
  });
});

describe('query validation', () => {
  const today = new Date('2026-11-21T12:00:00Z');
  const q = (s: string) => parseFareQuery(new URLSearchParams(s), today);

  it('accepts a valid one-way and round-trip query', () => {
    expect(q('origin=del&destination=bom&departure_date=2026-12-14')).toMatchObject({ ok: true });
    expect(q('origin=DEL&destination=BOM&departure_date=2026-12-14&return_date=2026-12-21')).toMatchObject({
      ok: true,
      value: { returnDate: '2026-12-21' },
    });
  });

  it.each([
    'origin=DELHI&destination=BOM&departure_date=2026-12-14',
    'origin=DEL&destination=DEL&departure_date=2026-12-14',
    'origin=DEL&destination=BOM&departure_date=2026-02-30',
    'origin=DEL&destination=BOM&departure_date=2025-01-01',
    'origin=DEL&destination=BOM&departure_date=2026-12-14&return_date=2026-12-10',
    'origin=DEL&destination=BOM',
  ])('rejects %s', (s) => {
    expect(q(s).ok).toBe(false);
  });

  it('validates calendar windows', () => {
    expect(parseCalendarQuery(new URLSearchParams('origin=DEL&destination=BOM&start=2026-12-11&days=7')).ok).toBe(true);
    expect(parseCalendarQuery(new URLSearchParams('origin=DEL&destination=BOM&start=2026-12-11&days=40')).ok).toBe(false);
  });
});

describe('liveFareToItinerary', () => {
  const [cheap, direct] = normalizePricesForDates(SAMPLE, CTX);

  it('shows local times in the airport time zone and computes arrival', () => {
    const it6E = liveFareToItinerary(direct, false);
    expect(it6E.segments[0].departureISO).toBe('2026-12-14T06:15:00Z'); // 06:15 IST wall clock
    expect(it6E.segments[0].arrivalISO).toBe('2026-12-14T08:25:00Z');
    expect(it6E.segments[0].airlineName).toBe('IndiGo');
    expect(it6E.live?.bookingUrl).toContain('aviasales.com');
    expect(it6E.fareTiers[0].priceInr).toBe(5120);
  });

  it('crosses midnight and time zones correctly (DEL 22:30 → DXB)', () => {
    const fare = { ...cheap, destination: 'DXB', destinationAirport: 'DXB', durationMinutes: 240 };
    const it = liveFareToItinerary(fare, true);
    // 22:30 IST + 4h = 02:30 IST = 01:00 in Dubai (UTC+4), next day
    expect(it.segments[0].arrivalISO).toBe('2026-12-15T01:00:00Z');
    expect(it.live?.roundTrip).toBe(true);
    expect(it.stops).toBe(1);
  });

  it('leaves arrival unknown for airports without a time zone', () => {
    const fare = { ...cheap, destination: 'XYZ', destinationAirport: 'XYZ' };
    expect(liveFareToItinerary(fare, false).segments[0].arrivalISO).toBe('');
  });

  it('wallClockISO formats in the requested zone', () => {
    expect(wallClockISO(Date.parse('2026-06-01T12:00:00Z'), 'Europe/London')).toBe('2026-06-01T13:00:00Z');
  });
});

describe('API routes', () => {
  const env = { ...process.env };
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  const req = (path: string) => new Request(`http://localhost${path}`);
  const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  it('reports "unconfigured" (not an error) when no token is set', async () => {
    delete process.env.TRAVELPAYOUTS_TOKEN;
    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'unconfigured', fares: [] });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects invalid input with 400', async () => {
    const res = await faresGET(req('/api/fares?origin=DEL&destination=BOM&departure_date=bad'));
    expect(res.status).toBe(400);
  });

  it('returns normalised live fares and never leaks the token', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 'secret-token-123';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(SAMPLE), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).not.toContain('secret-token-123');
    const body = JSON.parse(text);
    expect(body.status).toBe('live');
    expect(body.fares).toHaveLength(2); // main + non-stop queries merged and de-duplicated
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.allResultsUrl).toMatch(/^https:\/\/www\.aviasales\.com\/search\/DELBOM|^https:\/\/www\.aviasales\.com\/search\/DEL\d{4}BOM1/);

    // Token travels only in the upstream request header, not the URL
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/aviasales/v3/prices_for_dates');
    expect(url).toContain('currency=inr');
    expect(url).not.toContain('secret-token-123');
    expect((init.headers as Record<string, string>)['X-Access-Token']).toBe('secret-token-123');
  });

  it('maps an upstream 401 to a friendly 502 error', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 'bad';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ status: 'error', message: 'The live fare source rejected our access key.' });
  });

  it('still returns fares when only the optional non-stop query fails', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 't';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('direct=true')
          ? new Response('{}', { status: 500 })
          : new Response(JSON.stringify(SAMPLE), { status: 200 })
      )
    );
    const res = await faresGET(req(`/api/fares?origin=DEL&destination=BOM&departure_date=${future}`));
    expect(res.status).toBe(200);
    expect((await res.json()).fares).toHaveLength(2);
  });

  it('calendar route fetches each month in the window', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 't';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await calendarGET(req('/api/fares/calendar?origin=DEL&destination=BOM&start=2026-12-29&days=7'));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2); // December + January
    expect((await res.json()).days).toHaveLength(7);
  });

  it('getConfig ignores blank values', () => {
    expect(getConfig({ TRAVELPAYOUTS_TOKEN: '  ', TRAVELPAYOUTS_MARKER: 'm' })).toEqual({
      token: undefined,
      marker: 'm',
      market: undefined,
    });
  });
});

// ------------------------------------------------------------- reference data
import { AIRPORT_COUNT, airlineDisplayName, enrichFare, lookupAirport, searchAirports } from '../lib/reference/directory';
import { GET as airportsGET } from '../app/api/airports/route';

describe('airport & airline directory (OurAirports + OpenFlights)', () => {
  it('covers thousands of airports, each with a time zone', () => {
    expect(AIRPORT_COUNT).toBeGreaterThan(3000);
    expect(lookupAirport('NMI')?.tz).toBe('Asia/Kolkata');
    expect(lookupAirport('SHJ')?.tz).toBe('Asia/Dubai');
    expect(lookupAirport('jfk')?.tz).toBe('America/New_York');
  });

  it('keeps curated names over generated ones', () => {
    expect(lookupAirport('GOX')?.city).toBe('Goa');
    expect(lookupAirport('DEL')?.name).toBe('Indira Gandhi International');
  });

  it('ranks exact codes, then cities, then names', () => {
    expect(searchAirports('lhr')[0].code).toBe('LHR');
    expect(searchAirports('goa').map((a) => a.code).slice(0, 3)).toEqual(['GOI', 'GOX', 'GOA']); // Goa first, Genoa still listed
    expect(searchAirports('heathrow')[0].code).toBe('LHR');
    expect(searchAirports('zürich')[0]?.code).toBe('ZRH'); // accents folded
    expect(searchAirports('')).toHaveLength(12); // popular list
  });

  it('prefers curated airline names where OpenFlights is out of date', () => {
    expect(airlineDisplayName('QP')).toBe('Akasa Air'); // OpenFlights still says "Air Kenya"
    expect(airlineDisplayName('LX')).toBe('SWISS');
    expect(airlineDisplayName('ZZ9')).toBe('ZZ9');
  });

  it('enriches live fares so any airport gets correct local times', () => {
    const [fare] = normalizePricesForDates(
      {
        currency: 'inr',
        data: [
          {
            origin: 'BOM', destination: 'DXB', origin_airport: 'BOM', destination_airport: 'SHJ',
            price: 17238, airline: 'G9', flight_number: 402, transfers: 0, duration_to: 195,
            departure_at: '2026-12-13T21:30:00+05:30', link: '/search/BOM1312DXB1?t=x',
          },
        ],
      },
      { origin: 'BOM', destination: 'DXB', departureDate: '2026-12-13' }
    );
    const enriched = enrichFare(fare);
    expect(enriched.destinationInfo?.city).toBe('Sharjah');
    expect(enriched.airlineName).toBe('Air Arabia');
    const it = liveFareToItinerary(enriched, false);
    // 21:30 IST + 3h15 = 00:45 IST = 23:15 in Sharjah (UTC+4), same calendar day
    expect(it.segments[0].arrivalISO).toBe('2026-12-13T23:15:00Z');
    expect(it.segments[0].destination.city).toBe('Sharjah');
  });

  it('serves search results over the API with long caching', async () => {
    const res = await airportsGET(new Request('http://localhost/api/airports?q=sharjah'));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400');
    expect((await res.json()).airports[0].code).toBe('SHJ');
    expect((await airportsGET(new Request('http://localhost/api/airports?q=<script>'))).status).toBe(400);
  });
});

// ------------------------------------------------------- nearest-date fallback
import { searchNearbyFares } from '../lib/fares/travelpayouts';

describe('nearest-date fallback (sparse cached routes)', () => {
  const month = {
    currency: 'inr',
    data: [
      { price: 7214, airline: '6E', flight_number: 1, departure_at: '2026-12-01T08:00:00+05:30', transfers: 0, duration_to: 150 },
      { price: 7836, airline: '6E', flight_number: 2, departure_at: '2026-12-02T08:00:00+05:30', transfers: 0, duration_to: 150 },
      { price: 9000, airline: 'AI', flight_number: 3, departure_at: '2026-12-02T18:00:00+05:30', transfers: 0, duration_to: 150 },
      { price: 6500, airline: 'QP', flight_number: 4, departure_at: '2026-12-20T10:00:00+05:30', transfers: 0, duration_to: 150 },
      { price: 5000, airline: 'SG', flight_number: 5, departure_at: '2026-11-20T10:00:00+05:30', transfers: 0, duration_to: 150 }, // past
      { price: 4000, airline: 'SG', flight_number: 6, departure_at: '2026-12-31T10:00:00+05:30', transfers: 0, duration_to: 150 }, // > 14 days
    ],
  };
  const q = { origin: 'MAA', destination: 'AMD', departureDate: '2026-12-14' };
  const cfg = { token: 't', marker: 'm' };
  const fetchMonth = vi.fn(async () => new Response(JSON.stringify(month), { status: 200 }));

  it('returns the cheapest fare on each of the closest days, nearest first', async () => {
    const fares = await searchNearbyFares(q, cfg, fetchMonth as unknown as typeof fetch, 14, 3, '2026-11-22');
    expect(fares.map((f) => [f.departureAt.slice(0, 10), f.priceInr])).toEqual([
      ['2026-12-20', 6500], // 6 days away
      ['2026-12-02', 7836], // 12 days away, cheapest that day
      ['2026-12-01', 7214], // 13 days away
    ]);
    // booking links point at each fare's own date
    expect(fares[0].bookingUrl).toContain('/search/MAA2012AMD1');
  });

  it('skips round trips and missing tokens', async () => {
    expect(await searchNearbyFares({ ...q, returnDate: '2026-12-20' }, cfg, fetchMonth as unknown as typeof fetch)).toEqual([]);
    expect(await searchNearbyFares(q, { token: undefined }, fetchMonth as unknown as typeof fetch)).toEqual([]);
  });

  it('the fares route offers nearby days only when the exact day is empty', async () => {
    process.env.TRAVELPAYOUTS_TOKEN = 't';
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const near = new Date(Date.now() + 33 * 86_400_000).toISOString().slice(0, 10);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const isMonth = /departure_at=\d{4}-\d{2}(&|$)/.test(url);
        const body = isMonth
          ? { currency: 'inr', data: [{ price: 7000, airline: '6E', flight_number: 9, departure_at: `${near}T09:00:00+05:30`, transfers: 0 }] }
          : { currency: 'inr', data: [] };
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );
    const res = await faresGET(new Request(`http://localhost/api/fares?origin=MAA&destination=AMD&departure_date=${future}`));
    const body = await res.json();
    expect(body.status).toBe('live');
    expect(body.fares).toHaveLength(0);
    expect(body.nearbyFares).toHaveLength(1);
    expect(body.nearbyFares[0].originInfo.city).toBe('Chennai');
    vi.unstubAllGlobals();
    delete process.env.TRAVELPAYOUTS_TOKEN;
  });
});
