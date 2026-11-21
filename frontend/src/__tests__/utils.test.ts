import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatPriceINR, formatTime, isNextDay } from '../lib/utils';
import { mockFlights } from '../lib/mock-data';
import { convertPrice, generateMockSeats, mockItineraries } from '../data/mockFlights';

describe('formatTime', () => {
  it('passes wall-clock HH:MM strings through (regression: rendered "Invalid Date")', () => {
    expect(formatTime('06:15')).toBe('06:15');
    expect(formatTime('9:05')).toBe('09:05');
  });

  it('formats ISO timestamps in IST regardless of the machine time zone', () => {
    expect(formatTime('2026-11-21T04:00:00Z')).toBe('09:30');
  });

  it('never returns "Invalid Date"', () => {
    expect(formatTime('not a time')).toBe('--:--');
  });
});

describe('isNextDay', () => {
  it('is false for same-day HH:MM pairs (regression: was true for every flight)', () => {
    expect(isNextDay('06:15', '08:25')).toBe(false);
  });

  it('is true when arrival wraps past midnight', () => {
    expect(isNextDay('22:30', '00:40')).toBe(true);
  });

  it('compares calendar dates for ISO timestamps', () => {
    expect(isNextDay('2026-12-14T22:30:00Z', '2026-12-15T00:40:00Z')).toBe(true);
    expect(isNextDay('2026-12-14T06:15:00Z', '2026-12-14T08:25:00Z')).toBe(false);
  });
});

describe('formatDate', () => {
  it('keeps the calendar day stable for date-only strings', () => {
    expect(formatDate('2026-12-14')).toMatch(/14 Dec/);
  });
});

describe('money formatting', () => {
  it('formats paise as rupees with Indian grouping', () => {
    expect(formatPriceINR(12500000)).toBe('₹1,25,000');
  });

  it('converts INR into display currencies', () => {
    expect(convertPrice(10000, 'INR')).toBe('₹10,000');
    expect(convertPrice(10000, 'USD')).toBe('$118');
    expect(convertPrice(10000, 'EUR')).toBe('€112');
  });

  it('formats durations', () => {
    expect(formatDuration(130)).toBe('2h 10m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45m');
  });
});

describe('supplier trust scores', () => {
  const offers = mockFlights.flatMap((f) => f.offers);

  it('are normalised to 0–1 (regression: 0–100 rendered "9200% Trust")', () => {
    for (const o of offers) {
      expect(o.trustScore).toBeGreaterThan(0);
      expect(o.trustScore).toBeLessThanOrEqual(1);
    }
  });

  it('let "Cheapest Trusted" differ from "Absolute Cheapest" when a low-trust seller is cheapest', () => {
    const differs = mockFlights.some((f) => {
      const cheapest = Math.min(...f.offers.map((o) => o.totalPaise));
      const trusted = f.offers.filter((o) => o.trustScore >= 0.85);
      return trusted.length > 0 && Math.min(...trusted.map((o) => o.totalPaise)) !== cheapest;
    });
    expect(differs).toBe(true);
  });
});

describe('itinerary and seat data integrity', () => {
  it('every itinerary has at least one segment and fare tier', () => {
    for (const f of mockItineraries) {
      expect(f.segments.length).toBeGreaterThan(0);
      expect(f.fareTiers.length).toBeGreaterThan(0);
    }
  });

  it('generates a full 24×6 cabin with deterministic occupancy', () => {
    const a = generateMockSeats();
    const b = generateMockSeats();
    expect(a).toHaveLength(144);
    expect(a.map((s) => s.status)).toEqual(b.map((s) => s.status));
  });

  it('default seat 12B is selectable', () => {
    const seat = generateMockSeats().find((s) => s.id === '12B');
    expect(seat?.status).not.toBe('occupied');
  });
});

describe('demo date strip', () => {
  it('weekday labels match the real calendar', async () => {
    const { mockDayFares } = await import('../data/mockFlights');
    for (const d of mockDayFares) {
      const real = new Date(`${d.dateISO}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
      expect(d.weekday).toBe(real);
    }
  });
});
