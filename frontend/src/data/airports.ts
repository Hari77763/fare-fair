import type { Airport } from '../types/flight';

/**
 * Airports offered in the search picker. `tz` (IANA) lets live fares show
 * local departure/arrival times correctly, including across time zones.
 */
export const AIRPORTS: Airport[] = [
  // India — metros
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International', country: 'India', tz: 'Asia/Kolkata' },
  // India — other major airports
  { code: 'GOI', city: 'Goa', name: 'Goa International (Dabolim)', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'GOX', city: 'Goa', name: 'Manohar International (Mopa)', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'PNQ', city: 'Pune', name: 'Pune International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'IXC', city: 'Chandigarh', name: 'Chandigarh International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Thiruvananthapuram International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'SXR', city: 'Srinagar', name: 'Srinagar International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'IDR', city: 'Indore', name: 'Devi Ahilya Bai Holkar', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'IXB', city: 'Bagdogra', name: 'Bagdogra International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'CCJ', city: 'Kozhikode', name: 'Calicut International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'IXE', city: 'Mangaluru', name: 'Mangaluru International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'CJB', city: 'Coimbatore', name: 'Coimbatore International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam International', country: 'India', tz: 'Asia/Kolkata' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar International', country: 'India', tz: 'Asia/Kolkata' },
  // International
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'United Arab Emirates', tz: 'Asia/Dubai' },
  { code: 'AUH', city: 'Abu Dhabi', name: 'Zayed International', country: 'United Arab Emirates', tz: 'Asia/Dubai' },
  { code: 'DOH', city: 'Doha', name: 'Hamad International', country: 'Qatar', tz: 'Asia/Qatar' },
  { code: 'MCT', city: 'Muscat', name: 'Muscat International', country: 'Oman', tz: 'Asia/Muscat' },
  { code: 'BAH', city: 'Bahrain', name: 'Bahrain International', country: 'Bahrain', tz: 'Asia/Bahrain' },
  { code: 'RUH', city: 'Riyadh', name: 'King Khalid International', country: 'Saudi Arabia', tz: 'Asia/Riyadh' },
  { code: 'JED', city: 'Jeddah', name: 'King Abdulaziz International', country: 'Saudi Arabia', tz: 'Asia/Riyadh' },
  { code: 'SIN', city: 'Singapore', name: 'Changi', country: 'Singapore', tz: 'Asia/Singapore' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'Thailand', tz: 'Asia/Bangkok' },
  { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International', country: 'Malaysia', tz: 'Asia/Kuala_Lumpur' },
  { code: 'CMB', city: 'Colombo', name: 'Bandaranaike International', country: 'Sri Lanka', tz: 'Asia/Colombo' },
  { code: 'KTM', city: 'Kathmandu', name: 'Tribhuvan International', country: 'Nepal', tz: 'Asia/Kathmandu' },
  { code: 'MLE', city: 'Malé', name: 'Velana International', country: 'Maldives', tz: 'Indian/Maldives' },
  { code: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Türkiye', tz: 'Europe/Istanbul' },
  { code: 'LHR', city: 'London', name: 'Heathrow', country: 'United Kingdom', tz: 'Europe/London' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'France', tz: 'Europe/Paris' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany', tz: 'Europe/Berlin' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', country: 'United States', tz: 'America/New_York' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'United States', tz: 'America/Los_Angeles' },
  { code: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International', country: 'Canada', tz: 'America/Toronto' },
  { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith', country: 'Australia', tz: 'Australia/Sydney' },
];

const BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]));

export function findAirport(code: string): Airport | undefined {
  return BY_CODE.get(code?.toUpperCase());
}

/** A displayable airport for any IATA code, even ones not in the picker. */
export function airportOrCode(code: string): Airport {
  return findAirport(code) ?? { code: code.toUpperCase(), city: code.toUpperCase(), name: '', country: '' };
}
