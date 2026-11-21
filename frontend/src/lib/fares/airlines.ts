/**
 * IATA airline code → display name. Fare sources return codes only.
 * Unknown codes fall back to the code itself.
 */
const AIRLINES: Record<string, string> = {
  // India
  '6E': 'IndiGo',
  AI: 'Air India',
  IX: 'Air India Express',
  I5: 'Air India Express',
  QP: 'Akasa Air',
  SG: 'SpiceJet',
  UK: 'Vistara',
  '9I': 'Alliance Air',
  S5: 'Star Air',
  G8: 'Go First',
  // Gulf & Middle East
  EK: 'Emirates',
  EY: 'Etihad Airways',
  QR: 'Qatar Airways',
  FZ: 'flydubai',
  G9: 'Air Arabia',
  WY: 'Oman Air',
  GF: 'Gulf Air',
  SV: 'Saudia',
  KU: 'Kuwait Airways',
  J9: 'Jazeera Airways',
  // Asia-Pacific
  SQ: 'Singapore Airlines',
  TR: 'Scoot',
  MH: 'Malaysia Airlines',
  AK: 'AirAsia',
  D7: 'AirAsia X',
  OD: 'Batik Air Malaysia',
  TG: 'Thai Airways',
  FD: 'Thai AirAsia',
  UL: 'SriLankan Airlines',
  BG: 'Biman Bangladesh',
  RA: 'Nepal Airlines',
  CX: 'Cathay Pacific',
  NH: 'ANA',
  JL: 'Japan Airlines',
  KE: 'Korean Air',
  QF: 'Qantas',
  // Europe, Africa & Americas
  BA: 'British Airways',
  VS: 'Virgin Atlantic',
  LH: 'Lufthansa',
  LX: 'SWISS',
  AF: 'Air France',
  KL: 'KLM',
  TK: 'Turkish Airlines',
  ET: 'Ethiopian Airlines',
  MS: 'EgyptAir',
  AA: 'American Airlines',
  UA: 'United Airlines',
  DL: 'Delta Air Lines',
  AC: 'Air Canada',
};

export function airlineName(code: string): string {
  return AIRLINES[code?.toUpperCase()] ?? code;
}
