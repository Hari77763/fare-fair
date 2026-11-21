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
  const date = new Date(isoTime);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Formats a date for display.
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date like "Mon, 25 Dec"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Checks if arrival is on the next day relative to departure.
 */
export function isNextDay(departure: string, arrival: string): boolean {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  return arr.getDate() !== dep.getDate();
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
