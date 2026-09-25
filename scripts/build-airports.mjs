// Genera src/data/airports.json a partir de OurAirports (dominio público):
// https://github.com/davidmegginson/ourairports-data
// Solo aeropuertos grandes/medianos con código IATA y servicio regular.
// Uso: npm run build:airports
import { writeFile, mkdir } from 'node:fs/promises';

const BASE = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main';

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function fetchCsv(name) {
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

const [airports, countries] = await Promise.all([fetchCsv('airports.csv'), fetchCsv('countries.csv')]);

const out = {};
for (const a of airports) {
  if (!a.iata_code || !/^[A-Z]{3}$/.test(a.iata_code)) continue;
  if (a.scheduled_service !== 'yes') continue;
  if (a.type !== 'large_airport' && a.type !== 'medium_airport') continue;
  const lat = Math.round(Number(a.latitude_deg) * 1e4) / 1e4;
  const lon = Math.round(Number(a.longitude_deg) * 1e4) / 1e4;
  // [lat, lon, nombre, ciudad, país ISO-2, tamaño L/M]
  out[a.iata_code] = [lat, lon, a.name, a.municipality || '', a.iso_country, a.type === 'large_airport' ? 'L' : 'M'];
}

const countryNames = Object.fromEntries(countries.map((c) => [c.code, c.name]));

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/airports.json', import.meta.url), JSON.stringify(out));
await writeFile(new URL('../src/data/countries.json', import.meta.url), JSON.stringify(countryNames));
console.log(`✓ ${Object.keys(out).length} aeropuertos, ${Object.keys(countryNames).length} países`);
