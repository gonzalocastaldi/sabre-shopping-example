/**
 * Núcleo del motor de mocks: aleatoriedad determinística, precios coherentes y armado de
 * itinerarios. Search, Shop y Check usan la MISMA función de precio, así la cadena
 * Search → Shop → Check muestra precios consistentes (como en la vida real, con pequeñas
 * variaciones al revalidar).
 */
import { distanceKm, getAirport, getCity, type Place } from '@/data/geo';
import { stableHash } from '@/lib/stableHash';
import type { MosaicFlight } from '@/api/mosaic';

// ---------- Aleatoriedad determinística ----------

export function rng(seed: string): () => number {
  let a = parseInt(stableHash(seed), 16) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)];

/** UUID v4 con formato válido (los specs piden format: uuid), derivado de una semilla. */
export function uuid(seed: string): string {
  const r = rng(seed);
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${pick(r, ['8', '9', 'a', 'b'])}${hex(3)}-${hex(12)}`;
}

// ---------- Monedas ----------

/** Tipos de cambio aproximados, solo para que el mock responda en la moneda pedida. */
export const FX: Record<string, number> = { USD: 1, EUR: 0.92, BRL: 5.4, MXN: 18.2, ARS: 1400, UYU: 40, CLP: 950, COP: 4050, PEN: 3.7, GBP: 0.79, CAD: 1.37 };
export const fx = (usd: number, currency: string) => usd * (FX[currency] ?? 1);
export const money = (n: number, currency = 'USD') => (currency === 'USD' || currency === 'EUR' || currency === 'GBP' ? n.toFixed(2) : Math.round(n).toString());

// ---------- Lugares ----------

/** Aeropuerto principal de un código (ciudad → su primer aeropuerto). */
export function mainAirport(code: string): Place | undefined {
  const city = getCity(code);
  if (city?.airports) return city.airports.map(getAirport).find((a): a is Place => Boolean(a));
  return getAirport(code);
}

export function routeDistance(from: string, to: string): number {
  const a = mainAirport(from);
  const b = mainAirport(to);
  return a && b ? distanceKm(a, b) : 3000;
}

// ---------- Aerolíneas ----------

type Region = 'SA' | 'NA' | 'CA' | 'EU' | 'ME' | 'AS' | 'OC' | 'AF';

const REGION_BY_COUNTRY: Record<string, Region> = {};
const assign = (region: Region, countries: string) => countries.split(' ').forEach((c) => (REGION_BY_COUNTRY[c] = region));
assign('SA', 'AR BR CL UY PY BO PE EC CO VE GY SR');
assign('NA', 'US CA');
assign('CA', 'MX CR PA GT SV HN NI BZ DO CU JM PR BS AW CW BB TT LC AG KY TC SX HT VG VI');
assign('EU', 'ES PT FR IT DE GB NL BE CH AT GR IE CZ PL HU HR SE NO DK FI IS RO BG RS SI SK LU MT CY TR');
assign('ME', 'AE QA SA OM BH KW JO IL EG LB');
assign('AS', 'JP KR CN HK TW MO TH VN MY SG ID PH KH IN LK NP MV BD MN');
assign('OC', 'AU NZ FJ PF NC');
assign('AF', 'ZA KE TZ MA NG GH ET SN MU NA BW ZW MZ ZM');

const regionOf = (code: string): Region => REGION_BY_COUNTRY[mainAirport(code)?.country ?? ''] ?? 'NA';

export interface Carrier {
  code: string;
  hub: string;
  ndc?: boolean;
  lcc?: boolean;
}

const CARRIERS: Record<Region, Carrier[]> = {
  SA: [
    { code: 'AR', hub: 'AEP' },
    { code: 'LA', hub: 'LIM', ndc: true },
    { code: 'G3', hub: 'GRU', lcc: true },
    { code: 'JA', hub: 'SCL', lcc: true },
    { code: 'AV', hub: 'BOG', ndc: true },
    { code: 'H2', hub: 'SCL', lcc: true },
  ],
  CA: [
    { code: 'CM', hub: 'PTY' },
    { code: 'AM', hub: 'MEX', ndc: true },
    { code: 'AV', hub: 'BOG' },
  ],
  NA: [
    { code: 'AA', hub: 'MIA', ndc: true },
    { code: 'UA', hub: 'IAH', ndc: true },
    { code: 'DL', hub: 'ATL' },
    { code: 'AC', hub: 'YYZ' },
    { code: 'B6', hub: 'JFK', lcc: true },
  ],
  EU: [
    { code: 'IB', hub: 'MAD', ndc: true },
    { code: 'UX', hub: 'MAD' },
    { code: 'AF', hub: 'CDG', ndc: true },
    { code: 'KL', hub: 'AMS' },
    { code: 'LH', hub: 'FRA', ndc: true },
    { code: 'BA', hub: 'LHR', ndc: true },
    { code: 'TP', hub: 'LIS' },
    { code: 'TK', hub: 'IST' },
  ],
  ME: [
    { code: 'EK', hub: 'DXB', ndc: true },
    { code: 'QR', hub: 'DOH' },
    { code: 'EY', hub: 'AUH' },
  ],
  AS: [
    { code: 'SQ', hub: 'SIN', ndc: true },
    { code: 'CX', hub: 'HKG' },
    { code: 'NH', hub: 'HND' },
    { code: 'KE', hub: 'ICN' },
  ],
  OC: [
    { code: 'QF', hub: 'SYD', ndc: true },
    { code: 'NZ', hub: 'AKL' },
  ],
  AF: [
    { code: 'ET', hub: 'ADD' },
    { code: 'MS', hub: 'CAI' },
  ],
};

/** Desvío relativo de conectar en el hub del carrier (1 = sin desvío). */
function detour(carrier: Carrier, from: string, to: string): number {
  const origin = mainAirport(from)?.code;
  const destination = mainAirport(to)?.code;
  if (carrier.hub === origin || carrier.hub === destination) return 1;
  const direct = routeDistance(from, to);
  return (routeDistance(from, carrier.hub) + routeDistance(carrier.hub, to)) / Math.max(direct, 1);
}

/**
 * Aerolíneas plausibles para una ruta: de la región de origen y de destino, sin low cost en
 * rutas interregionales, y descartando las que conectarían en un hub muy desviado
 * (nadie vuela Buenos Aires–Río vía Bogotá).
 */
export function carriersFor(from: string, to: string): Carrier[] {
  const a = CARRIERS[regionOf(from)];
  const b = CARRIERS[regionOf(to)];
  const merged = [...a, ...b.filter((c) => !a.some((x) => x.code === c.code))];
  const list = regionOf(from) === regionOf(to) ? merged : merged.filter((c) => !c.lcc);
  const sensible = list.filter((c) => detour(c, from, to) < 1.35 || (hasNonStop(from, to) && detour(c, from, to) < 1.6));
  return sensible.length ? sensible : list.sort((x, y) => detour(x, from, to) - detour(y, from, to)).slice(0, 2);
}

/** ¿El carrier tiene que conectar sí o sí? Si el desvío es grande, vuela directo. */
export const mustFlyDirect = (carrier: Carrier, from: string, to: string) => detour(carrier, from, to) >= 1.35;

// ---------- Memoria de precios (coherencia Search/Shop → Check) ----------

/**
 * El mock de Check recibe solo vuelos y clases (como la API real), sin precio. Para que la
 * revalidación sea coherente con lo que se mostró, Search y Shop registran acá el precio
 * base (tarifa Light por adulto, USD) de cada itinerario generado.
 */
const priceMemory = new Map<string, number>();
export const flightsSignature = (flights: { marketingAirlineCode: string; marketingFlightNumber: number; departureDate: string }[]) =>
  flights.map((f) => `${f.marketingAirlineCode}${f.marketingFlightNumber}${f.departureDate}`).join('|');
export const rememberPrice = (signature: string, lightUsd: number) => priceMemory.set(signature, lightUsd);
export const recallPrice = (signature: string) => priceMemory.get(signature);

// ---------- Precios ----------

const dayOfYear = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
};

/**
 * Precio base USD por pasajero adulto para una ruta, fecha y duración.
 * Temporada alta en enero/julio/diciembre, fines de semana más caros y un poco de ruido
 * estable por día (así el calendario tiene textura, pero no cambia entre recargas).
 */
export function farePrice(from: string, to: string, departDate: string, lengthOfStay?: number, nonStop = false): number {
  const km = routeDistance(from, to);
  const oneWay = 55 + km * 0.082;
  const roundTrip = lengthOfStay !== undefined ? oneWay * 1.72 : oneWay;
  const doy = dayOfYear(departDate);
  const season = 1 + 0.2 * Math.cos(((doy - 10) / 365) * 2 * Math.PI * 2) + (doy > 350 || doy < 12 ? 0.18 : 0);
  const weekday = new Date(`${departDate}T12:00:00Z`).getUTCDay();
  const dow = [1.08, 0.95, 0.9, 0.92, 1.0, 1.12, 1.05][weekday];
  const daysAhead = (Date.parse(`${departDate}T12:00:00Z`) - Date.now()) / 86400000;
  const advance = daysAhead < 14 ? 1.3 : daysAhead < 30 ? 1.12 : 1;
  const stay = lengthOfStay !== undefined ? 1 + Math.max(0, 7 - lengthOfStay) * 0.015 : 1;
  const noise = 0.85 + rng(`${from}${to}${departDate}${lengthOfStay ?? ''}`)() * 0.3;
  const direct = nonStop ? 1.14 : 1;
  return Math.max(49, roundTrip * season * dow * advance * stay * noise * direct);
}

/** ¿Tiene vuelo directo la ruta? Determinístico: corto = casi siempre; largo = según hubs. */
export function hasNonStop(from: string, to: string): boolean {
  const km = routeDistance(from, to);
  if (km < 1500) return true;
  const big = (mainAirport(from)?.weight ?? 1) + (mainAirport(to)?.weight ?? 1);
  return km < 9500 && big >= 4 && rng(`ns${[from, to].sort().join('')}`)() < 0.55;
}

// ---------- Itinerarios ----------

const AIRCRAFT_SHORT = ['320', '32N', '738', '7M8', 'E90'];
const AIRCRAFT_LONG = ['789', '788', '77W', '359', '332'];

function hhmm(totalMinutes: number): { time: string; dayOffset: number } {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return {
    time: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
    dayOffset: Math.floor(totalMinutes / 1440),
  };
}

const addDaysIso = (iso: string, days: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

/** Diferencia horaria aproximada por longitud (suficiente para horas locales verosímiles). */
const tzOffsetMin = (code: string) => Math.round(((mainAirport(code)?.lon ?? 0) / 15) * 60 / 60) * 60;

export interface BuiltFlight extends MosaicFlight {
  distanceKm: number;
}

/**
 * Arma los vuelos de un tramo: directo o con una conexión en el hub del carrier.
 * Las horas son locales de cada aeropuerto (como en la API real).
 */
export function buildLeg(
  seed: string,
  from: string,
  to: string,
  date: string,
  opts: { carrier: Carrier; nonStop: boolean; departMinutes: number },
): BuiltFlight[] {
  const r = rng(seed);
  const origin = mainAirport(from)?.code ?? from;
  const destination = mainAirport(to)?.code ?? to;
  const hub = opts.carrier.hub;
  const sameCity = (a: string, b: string) => mainAirport(a)?.city === mainAirport(b)?.city;
  const direct = opts.nonStop || sameCity(hub, origin) || sameCity(hub, destination) || mustFlyDirect(opts.carrier, origin, destination);
  const stops = direct ? [origin, destination] : [origin, hub, destination];

  const flights: BuiltFlight[] = [];
  let cursorUtc = opts.departMinutes - tzOffsetMin(origin); // minutos UTC desde la medianoche local de `date`
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const km = routeDistance(a, b);
    const duration = Math.round(35 + km / 13.5);
    const dep = hhmm(cursorUtc + tzOffsetMin(a));
    const arrUtc = cursorUtc + duration;
    const arr = hhmm(arrUtc + tzOffsetMin(b));
    const number = 100 + Math.floor(r() * 8800);
    flights.push({
      id: uuid(`${seed}-f${i}`),
      departureAirportCode: a,
      departureDate: addDaysIso(date, dep.dayOffset),
      departureTime: dep.time,
      arrivalAirportCode: b,
      arrivalDate: addDaysIso(date, arr.dayOffset),
      arrivalTime: arr.time,
      operatingAirlineCode: opts.carrier.code,
      operatingFlightNumber: number,
      marketingAirlineCode: opts.carrier.code,
      marketingFlightNumber: number,
      aircraftTypeCode: pick(r, km > 3500 ? AIRCRAFT_LONG : AIRCRAFT_SHORT),
      durationInMinutes: duration,
      distanceKm: km,
    });
    cursorUtc = arrUtc + 70 + Math.floor(r() * 150); // conexión de 70 a 220 minutos
  }
  return flights;
}

export const ECONOMY_RBDS = ['Y', 'B', 'M', 'H', 'K', 'L', 'Q', 'V', 'S', 'O'];
export const RBDS_BY_CABIN: Record<string, string[]> = {
  Economy: ECONOMY_RBDS,
  'Premium Economy': ['W', 'E', 'T'],
  Business: ['J', 'C', 'D', 'I'],
  First: ['F', 'A'],
};

export const stripFlight = ({ distanceKm: _km, ...f }: BuiltFlight): MosaicFlight => f;
