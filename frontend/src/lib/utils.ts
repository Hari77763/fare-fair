import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx for conditional class composition.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an amount in paise to Indian Rupee display string.
 * Uses the Indian numbering system (lakhs, crores).
 * @param paise - Amount in paise (integer)
 * @returns Formatted string like "₹4,599" or "₹1,25,000"
 */
export function formatPriceINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/**
 * Formats a duration in minutes to a human-readable string.
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 30m"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Formats a time string for display.
 * @param isoTime - ISO 8601 time string
 * @returns Formatted time like "14:30"
 */
export function formatTime(isoTime: string): string {
  // Wall-clock "HH:MM" values (local airport time) are shown as-is; parsing
  // them with Date() yields "Invalid Date".
  const hhmm = /^(\d{1,2}):(\d{2})/.exec(isoTime);
  if (hhmm && !isoTime.includes("T")) {
    return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
  }
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return "--:--";
  // Fixed zone so server and browser render identical text (no hydration drift).
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

/** Minutes since midnight for an "HH:MM" or ISO string, or null if unparseable. */
function minutesOfDay(value: string): number | null {
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Formats a date for display.
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date like "Mon, 25 Dec"
 */
export function formatDate(isoDate: string, options?: Intl.DateTimeFormatOptions): string {
  // "YYYY-MM-DD" parses as UTC midnight; formatting in UTC keeps the calendar
  // day stable for users west of Greenwich and between server and client.
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    ...options,
  });
}

/**
 * Checks if arrival is on the next day relative to departure.
 * Works for both "HH:MM" wall-clock strings and full ISO timestamps.
 */
export function isNextDay(departure: string, arrival: string): boolean {
  if (departure.includes("T") && arrival.includes("T")) {
    return departure.slice(0, 10) !== arrival.slice(0, 10);
  }
  const dep = minutesOfDay(departure);
  const arr = minutesOfDay(arrival);
  return dep !== null && arr !== null && arr < dep;
}

/**
 * Returns the number of days difference between arrival and departure.
 */
export function daysDifference(departure: string, arrival: string): number {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  const diffMs = arr.getTime() - dep.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
