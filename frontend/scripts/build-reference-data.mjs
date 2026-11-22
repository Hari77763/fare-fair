#!/usr/bin/env node
/**
 * Builds FairFare's airport and airline reference data.
 *
 *   npm run data:refresh                     # download the latest sources
 *   SOURCE_DIR=/path npm run data:refresh    # use already-downloaded files
 *
 * Sources
 *  - OurAirports airports.csv + countries.csv — public domain
 *    https://ourairports.com/data/
 *  - OpenFlights airlines.dat — Open Database License (ODbL) 1.0
 *    https://openflights.org/data
 *  - Time zones are computed from each airport's coordinates with tz-lookup
 *    (CC0), because OurAirports does not publish them.
 *
 * Output (committed, so builds never depend on these sites being up)
 *  - src/data/generated/airports.json  [code, city, name, country, tz][]
 *  - src/data/generated/airlines.json  { [iata]: name }
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tzlookup from 'tz-lookup';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '../src/data/generated');

const SOURCES = {
  airports: 'https://davidmegginson.github.io/ourairports-data/airports.csv',
  countries: 'https://davidmegginson.github.io/ourairports-data/countries.csv',
  airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
};

async function load(name, url) {
  if (process.env.SOURCE_DIR) {
    const file = path.join(process.env.SOURCE_DIR, path.basename(new URL(url).pathname));
    return readFile(file, 'utf8');
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} from ${url}`);
  return res.text();
}

/** RFC 4180-style CSV parser (quoted fields, escaped quotes, newlines in quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

const clean = (v) => (v === undefined || v === '\\N' ? '' : v.trim());
const RANK = { large_airport: 3, medium_airport: 2, small_airport: 1 };

function buildAirports(airportsCsv, countriesCsv) {
  const [cHead, ...cRows] = parseCsv(countriesCsv);
  const ci = Object.fromEntries(cHead.map((h, i) => [h, i]));
  const countries = new Map(cRows.map((r) => [r[ci.code], r[ci.name]]));

  const [head, ...rows] = parseCsv(airportsCsv);
  const h = Object.fromEntries(head.map((name, i) => [name, i]));
  const byCode = new Map();
  let tzFailures = 0;

  for (const r of rows) {
    const code = clean(r[h.iata_code]).toUpperCase();
    const type = r[h.type];
    if (!/^[A-Z]{3}$/.test(code) || !(type in RANK)) continue;
    // Airports with airline service; large airports are kept even if the flag is missing
    if (r[h.scheduled_service] !== 'yes' && type !== 'large_airport') continue;

    let tz = '';
    try {
      tz = tzlookup(Number(r[h.latitude_deg]), Number(r[h.longitude_deg]));
    } catch {
      tzFailures++;
    }

    const entry = {
      rank: RANK[type],
      row: [
        code,
        clean(r[h.municipality]) || clean(r[h.name]),
        clean(r[h.name]),
        countries.get(r[h.iso_country]) ?? r[h.iso_country],
        tz,
      ],
    };
    // IATA codes are occasionally duplicated; keep the most significant airport
    const prev = byCode.get(code);
    if (!prev || entry.rank > prev.rank) byCode.set(code, entry);
  }

  const airports = [...byCode.values()]
    .sort((a, b) => b.rank - a.rank || a.row[0].localeCompare(b.row[0]))
    .map((e) => e.row);
  return { airports, tzFailures };
}

function buildAirlines(airlinesDat) {
  const names = new Map();
  for (const r of parseCsv(airlinesDat)) {
    const [, name, , iata, , , , active] = r.map(clean);
    if (!/^[A-Z0-9]{2}$/.test(iata) || !name) continue;
    // Prefer active carriers when an IATA code has been reused
    const prev = names.get(iata);
    if (!prev || (active === 'Y' && prev.active !== 'Y')) names.set(iata, { name, active });
  }
  return Object.fromEntries([...names.entries()].sort().map(([code, v]) => [code, v.name]));
}

async function main() {
  const [airportsCsv, countriesCsv, airlinesDat] = await Promise.all([
    load('airports', SOURCES.airports),
    load('countries', SOURCES.countries),
    load('airlines', SOURCES.airlines),
  ]);

  const { airports, tzFailures } = buildAirports(airportsCsv, countriesCsv);
  const airlines = buildAirlines(airlinesDat);

  // Sanity checks: refuse to overwrite good data with a broken download
  if (airports.length < 2000) throw new Error(`Only ${airports.length} airports parsed — aborting`);
  if (Object.keys(airlines).length < 500) throw new Error('Too few airlines parsed — aborting');
  for (const must of ['DEL', 'BOM', 'BLR', 'NMI', 'GOX', 'DXB', 'LHR', 'JFK']) {
    if (!airports.some((a) => a[0] === must)) throw new Error(`Expected airport ${must} missing — aborting`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'airports.json'), JSON.stringify(airports) + '\n');
  await writeFile(path.join(OUT_DIR, 'airlines.json'), JSON.stringify(airlines) + '\n');

  console.log(
    `airports: ${airports.length} (time zone not found for ${tzFailures}) · airlines: ${Object.keys(airlines).length}`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
