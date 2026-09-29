/**
 * Estado de búsqueda en la URL (compartible y deep-linkeable). Todos los valores son
 * strings planos (`?o=BUE&dm=theme&dv=Beach,Skiing&los=6,7,8`), no JSON.
 */
import { plusDays, today, type DestinationMode, type OriginMode, type SearchCriteria, type Travelers } from '@/api/mappers';

export type RawSearch = Record<string, string | undefined>;

const list = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export const ORIGIN_MODES: OriginMode[] = ['place', 'multi', 'country'];
export const DESTINATION_MODES: DestinationMode[] = ['anywhere', 'place', 'country', 'region', 'theme'];

/** Ventana por defecto: desde dentro de 2 semanas hasta 3 meses después. */
export function defaultWindow() {
  const from = plusDays(today(), 14);
  return { from, to: plusDays(from, 90) };
}

export function criteriaFromSearch(s: RawSearch): SearchCriteria | undefined {
  const origins = list(s.o);
  if (!origins.length) return undefined;
  const { from, to } = defaultWindow();
  const originMode = (ORIGIN_MODES.includes(s.om as OriginMode) ? s.om : origins.length > 1 ? 'multi' : 'place') as OriginMode;
  const los = list(s.los).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 21).slice(0, 21);
  const destinationMode = (DESTINATION_MODES.includes(s.dm as DestinationMode) ? s.dm : 'anywhere') as DestinationMode;
  return {
    originMode,
    origins,
    destinationMode,
    destinations: list(s.dv),
    exclude: list(s.x),
    tripType: s.t === 'ow' ? 'oneway' : 'roundtrip',
    dateMode: s.dt === 'exact' ? 'exact' : 'flexible',
    fromDate: s.from && s.from >= today() ? s.from : from,
    toDate: s.to ?? to,
    lengthsOfStay: los.length ? los : [7],
    departDate: s.dep,
    returnDate: s.ret,
    budget: num(s.b),
    nonStop: s.ns === '1',
  };
}

export function criteriaToSearch(c: SearchCriteria): RawSearch {
  return {
    o: c.origins.join(','),
    om: c.originMode === 'place' ? undefined : c.originMode,
    dm: c.destinationMode === 'anywhere' ? undefined : c.destinationMode,
    dv: c.destinations.length ? c.destinations.join(',') : undefined,
    x: c.exclude.length ? c.exclude.join(',') : undefined,
    t: c.tripType === 'oneway' ? 'ow' : undefined,
    dt: c.dateMode === 'exact' ? 'exact' : undefined,
    from: c.dateMode === 'flexible' ? c.fromDate : undefined,
    to: c.dateMode === 'flexible' ? c.toDate : undefined,
    los: c.tripType === 'roundtrip' && c.dateMode === 'flexible' ? c.lengthsOfStay.join(',') : undefined,
    dep: c.dateMode === 'exact' ? c.departDate : undefined,
    ret: c.dateMode === 'exact' && c.tripType === 'roundtrip' ? c.returnDate : undefined,
    b: c.budget ? String(c.budget) : undefined,
    ns: c.nonStop ? '1' : undefined,
  };
}

export function travelersFromSearch(pax?: string): Travelers {
  const [ADT, CNN, INF] = (pax ?? '1-0-0').split('-').map((n) => Math.max(0, Math.min(9, Number(n) || 0)));
  return { ADT: Math.max(1, ADT), CNN, INF: Math.min(INF, Math.max(1, ADT)) };
}

export const travelersToSearch = (t: Travelers) => `${t.ADT}-${t.CNN}-${t.INF}`;

/** Serialización plana para TanStack Router. */
export function parseSearch(searchStr: string): RawSearch {
  return Object.fromEntries(new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr));
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  const str = params.toString().replace(/%2C/g, ',');
  return str ? `?${str}` : '';
}
