/**
 * Datos geográficos locales: aeropuertos (OurAirports, dominio público), códigos de
 * ciudad IATA multi-aeropuerto y utilidades de distancia/búsqueda.
 * Flight Search devuelve solo códigos IATA; con esto ubicamos cada destino en el mapa.
 */
import airportsRaw from './airports.json';

type AirportTuple = [lat: number, lon: number, name: string, city: string, country: string, size: 'L' | 'M'];
const AIRPORTS = airportsRaw as unknown as Record<string, AirportTuple>;

export interface Place {
  code: string;
  kind: 'airport' | 'city';
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  /** Para ordenar sugerencias: aeropuertos grandes y ciudades primero. */
  weight: number;
  airports?: string[];
}

/** Códigos de ciudad IATA (áreas metropolitanas) más usados en la demo. */
const METRO_CITIES: Record<string, { city: string; airports: string[] }> = {
  BUE: { city: 'Buenos Aires', airports: ['EZE', 'AEP'] },
  NYC: { city: 'Nueva York', airports: ['JFK', 'EWR', 'LGA'] },
  LON: { city: 'Londres', airports: ['LHR', 'LGW', 'STN', 'LTN', 'LCY'] },
  PAR: { city: 'París', airports: ['CDG', 'ORY'] },
  SAO: { city: 'San Pablo', airports: ['GRU', 'CGH', 'VCP'] },
  RIO: { city: 'Río de Janeiro', airports: ['GIG', 'SDU'] },
  TYO: { city: 'Tokio', airports: ['HND', 'NRT'] },
  CHI: { city: 'Chicago', airports: ['ORD', 'MDW'] },
  WAS: { city: 'Washington', airports: ['IAD', 'DCA', 'BWI'] },
  MIL: { city: 'Milán', airports: ['MXP', 'LIN', 'BGY'] },
  ROM: { city: 'Roma', airports: ['FCO', 'CIA'] },
  MOW: { city: 'Moscú', airports: ['SVO', 'DME', 'VKO'] },
  STO: { city: 'Estocolmo', airports: ['ARN', 'BMA'] },
  YTO: { city: 'Toronto', airports: ['YYZ', 'YTZ'] },
  SEL: { city: 'Seúl', airports: ['ICN', 'GMP'] },
  BJS: { city: 'Pekín', airports: ['PEK', 'PKX'] },
  SHA: { city: 'Shanghái', airports: ['PVG', 'SHA'] },
  OSA: { city: 'Osaka', airports: ['KIX', 'ITM'] },
  JKT: { city: 'Yakarta', airports: ['CGK', 'HLP'] },
  BKK: { city: 'Bangkok', airports: ['BKK', 'DMK'] },
  MEX: { city: 'Ciudad de México', airports: ['MEX', 'NLU'] },
  QDF: { city: 'Dallas', airports: ['DFW', 'DAL'] },
  HOU: { city: 'Houston', airports: ['IAH', 'HOU'] },
  IST: { city: 'Estambul', airports: ['IST', 'SAW'] },
  DXB: { city: 'Dubái', airports: ['DXB', 'DWC'] },
  MIA: { city: 'Miami', airports: ['MIA', 'FLL'] },
  ORL: { city: 'Orlando', airports: ['MCO', 'SFB'] },
  BHZ: { city: 'Belo Horizonte', airports: ['CNF', 'PLU'] },
};

/**
 * Ciudad servida por el aeropuerto, en español, cuando el municipio de OurAirports no es el
 * que reconoce un viajero (p. ej. MVD está en "Ciudad de la Costa", pero es Montevideo).
 */
const CITY_ES: Record<string, string> = {
  EZE: 'Buenos Aires', AEP: 'Buenos Aires', MVD: 'Montevideo', GIG: 'Río de Janeiro', SDU: 'Río de Janeiro',
  GRU: 'San Pablo', CGH: 'San Pablo', VCP: 'Campinas', BOG: 'Bogotá', MDE: 'Medellín', CUN: 'Cancún',
  SCL: 'Santiago de Chile', LIM: 'Lima', PTY: 'Ciudad de Panamá', MEX: 'Ciudad de México', NLU: 'Ciudad de México',
  JFK: 'Nueva York', EWR: 'Nueva York', LGA: 'Nueva York', LHR: 'Londres', LGW: 'Londres', CDG: 'París', ORY: 'París',
  FCO: 'Roma', MXP: 'Milán', LIN: 'Milán', ATH: 'Atenas', IST: 'Estambul', SAW: 'Estambul', CPH: 'Copenhague',
  ARN: 'Estocolmo', PRG: 'Praga', VIE: 'Viena', BER: 'Berlín', FRA: 'Fráncfort', MUC: 'Múnich', LIS: 'Lisboa',
  OPO: 'Oporto', SVQ: 'Sevilla', PMI: 'Palma de Mallorca', IBZ: 'Ibiza', DPS: 'Bali', HKT: 'Phuket', MLE: 'Malé',
  NRT: 'Tokio', HND: 'Tokio', PVG: 'Shanghái', PEK: 'Pekín', PKX: 'Pekín', ICN: 'Seúl', SIN: 'Singapur',
  DXB: 'Dubái', DOH: 'Doha', AUH: 'Abu Dabi', CAI: 'El Cairo', CPT: 'Ciudad del Cabo', JNB: 'Johannesburgo',
  SJU: 'San Juan', PUJ: 'Punta Cana', SDQ: 'Santo Domingo', HAV: 'La Habana', FLN: 'Florianópolis', SSA: 'Salvador de Bahía',
  IGR: 'Puerto Iguazú', FTE: 'El Calafate', BRC: 'Bariloche', USH: 'Ushuaia', MDZ: 'Mendoza', CUZ: 'Cusco',
  GPS: 'Galápagos', SJO: 'San José de Costa Rica', LIR: 'Liberia (Guanacaste)', KEF: 'Reikiavik', ZQN: 'Queenstown',
  HNL: 'Honolulu', OGG: 'Maui', ASE: 'Aspen', EGE: 'Vail', MCO: 'Orlando', SNA: 'Anaheim', TLV: 'Tel Aviv', AMM: 'Amán',
  CTG: 'Cartagena', SMR: 'Santa Marta', PDP: 'Punta del Este', GCM: 'Gran Caimán', DFW: 'Dallas', IAH: 'Houston',
  MIA: 'Miami', FLL: 'Fort Lauderdale', YYZ: 'Toronto', YUL: 'Montreal', YVR: 'Vancouver', ADZ: 'San Andrés',
};

const toPlace = (code: string, t: AirportTuple): Place => ({
  code,
  kind: 'airport',
  name: t[2],
  city: CITY_ES[code] ?? t[3] ?? t[2],
  country: t[4],
  lat: t[0],
  lon: t[1],
  weight: t[5] === 'L' ? 2 : 1,
});

export function getAirport(code: string): Place | undefined {
  const t = AIRPORTS[code];
  return t ? toPlace(code, t) : undefined;
}

export function getCity(code: string): Place | undefined {
  const metro = METRO_CITIES[code];
  if (!metro) return undefined;
  const main = metro.airports.map(getAirport).find(Boolean);
  if (!main) return undefined;
  return { ...main, code, kind: 'city', name: metro.city, city: metro.city, weight: 3, airports: metro.airports };
}

/** Aeropuerto o ciudad IATA. Si el código es ambos (MIA, DXB), prioriza la ciudad. */
export function getPlace(code: string): Place | undefined {
  return getCity(code) ?? getAirport(code);
}

export function allAirports(): Place[] {
  return Object.entries(AIRPORTS).map(([code, t]) => toPlace(code, t));
}

export function airportsInCountry(country: string): Place[] {
  return allAirports().filter((a) => a.country === country);
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Búsqueda local (fallback de Geo Autocomplete y modo mock). */
export function searchPlaces(query: string, limit = 8): Place[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const results: { place: Place; score: number }[] = [];
  const consider = (place: Place) => {
    const code = place.code.toLowerCase();
    const city = fold(place.city);
    const name = fold(place.name);
    let score = 0;
    if (code === q) score = 100;
    else if (city.startsWith(q)) score = 60;
    else if (name.startsWith(q)) score = 45;
    else if (city.includes(q) || name.includes(q)) score = 25;
    if (score) results.push({ place, score: score + place.weight * 5 });
  };
  for (const code of Object.keys(METRO_CITIES)) {
    const city = getCity(code);
    if (city) consider(city);
  }
  for (const [code, t] of Object.entries(AIRPORTS)) consider(toPlace(code, t));
  results.sort((a, b) => b.score - a.score || a.place.code.localeCompare(b.place.code));
  const seen = new Set<string>();
  return results
    .filter(({ place }) => (seen.has(`${place.kind}${place.code}`) ? false : (seen.add(`${place.kind}${place.code}`), true)))
    .slice(0, limit)
    .map((r) => r.place);
}

/** Distancia en km (haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;

export function countryName(iso: string): string {
  try {
    return regionNames?.of(iso) ?? iso;
  } catch {
    return iso;
  }
}

/** Etiqueta corta para listas: "Cancún" o "Buenos Aires (todos los aeropuertos)". */
export function placeLabel(code: string): string {
  const place = getPlace(code);
  if (!place) return code;
  return place.kind === 'city' ? place.city : place.city.replace(/\s*\(.*\)$/, '');
}
