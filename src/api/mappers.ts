/**
 * Arma los requests de cada API a partir del estado de la UI y de las ofertas normalizadas.
 * Cada builder está cubierto por tests que validan el resultado contra el spec oficial.
 */
import { addDays, format } from 'date-fns';
import { getCity } from '@/data/geo';
import type { Leg, TripOffer } from './normalize';
import type {
  FlightRefreshRequest,
  FlightSearchRequest,
  PassengerTypeCode,
  RegionCode,
  SearchLocation,
  SearchLocationFilter,
  ThemeCode,
} from './requests';

export const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');
export const today = () => isoDate(new Date());
export const plusDays = (iso: string, days: number) => isoDate(addDays(new Date(`${iso}T12:00:00`), days));

/** Máximo que acepta Flight Search: hoy + 330 días. */
export const SEARCH_WINDOW_DAYS = 330;

/**
 * Duración del viaje que acepta Flight Search: `lengthsOfStay` es "Array of integers (1-21)",
 * "Trip duration in days" (días entre la salida de ida y la de vuelta). Cualquier entero del rango.
 * https://developer.sabre.com/rest-api/flightsearch-api/v1
 */
export const MIN_STAY_DAYS = 1;
export const MAX_STAY_DAYS = 21;
export const stayDaysBetween = (departDate: string, returnDate: string) => Math.round((Date.parse(returnDate) - Date.parse(departDate)) / 86400000);

export type DestinationMode = 'anywhere' | 'place' | 'country' | 'region' | 'theme';
export type OriginMode = 'place' | 'multi' | 'country';

export interface Travelers {
  ADT: number;
  CNN: number;
  INF: number;
}

export interface SearchCriteria {
  originMode: OriginMode;
  /** Códigos IATA (1 si originMode = place) o ISO de país (originMode = country). */
  origins: string[];
  destinationMode: DestinationMode;
  destinations: string[];
  /** Países a excluir (filtros "Exclude"). */
  exclude: string[];
  tripType: 'roundtrip' | 'oneway';
  dateMode: 'flexible' | 'exact';
  fromDate: string;
  toDate: string;
  /** Duraciones de estadía (flexible). */
  lengthsOfStay: number[];
  /** Fechas exactas */
  departDate?: string;
  returnDate?: string;
  budget?: number;
  nonStop: boolean;
}

export interface MarketSettings {
  pointOfSale: string;
  currency: string;
  pcc?: string;
}

const placeLocation = (code: string): SearchLocation => ({ locationType: getCity(code) ? 'City' : 'Airport', locationCode: code });

function originLocation(c: SearchCriteria): SearchLocation {
  if (c.originMode === 'country') {
    return c.origins.length > 1
      ? { locationType: 'CountryList', locationCodes: c.origins }
      : { locationType: 'Country', locationCode: c.origins[0] };
  }
  if (c.origins.length > 1) {
    const allCities = c.origins.every((o) => getCity(o));
    return { locationType: allCities ? 'CityList' : 'AirportList', locationCodes: c.origins };
  }
  return placeLocation(c.origins[0]);
}

export const isOpenOrigin = (c: SearchCriteria) => c.originMode === 'country' || c.origins.length > 1;

function arrivalFilters(c: SearchCriteria): SearchLocationFilter[] | undefined {
  const filters: SearchLocationFilter[] = [];
  const limit = (location: SearchLocation) => filters.push({ locationFilter: 'Limit To', location });
  switch (c.destinationMode) {
    case 'place':
      if (c.destinations.length > 1) {
        const allCities = c.destinations.every((d) => getCity(d));
        limit({ locationType: allCities ? 'CityList' : 'AirportList', locationCodes: c.destinations });
      } else if (c.destinations[0]) limit(placeLocation(c.destinations[0]));
      break;
    case 'country':
      if (c.destinations.length > 1) limit({ locationType: 'CountryList', locationCodes: c.destinations });
      else if (c.destinations[0]) limit({ locationType: 'Country', locationCode: c.destinations[0] });
      break;
    case 'region':
      for (const r of c.destinations.slice(0, 4)) limit({ locationType: 'Region', locationCode: r as RegionCode });
      break;
    case 'theme':
      for (const t of c.destinations.slice(0, 4)) limit({ locationType: 'Theme', locationCode: t as ThemeCode });
      break;
    case 'anywhere':
      break;
  }
  // El spec admite hasta 4 filtros en total.
  const room = 4 - filters.length;
  if (c.exclude.length && room > 0) {
    filters.push({
      locationFilter: 'Exclude',
      location: c.exclude.length > 1 ? { locationType: 'CountryList', locationCodes: c.exclude.slice(0, 10) } : { locationType: 'Country', locationCode: c.exclude[0] },
    });
  }
  return filters.length ? filters : undefined;
}

function dateWindow(c: SearchCriteria): { range: { fromDate: string; toDate?: string }; los?: number[] } {
  if (c.dateMode === 'exact' && c.departDate) {
    const los = c.tripType === 'roundtrip' && c.returnDate ? [Math.max(MIN_STAY_DAYS, stayDaysBetween(c.departDate, c.returnDate))] : undefined;
    return { range: { fromDate: c.departDate, toDate: c.departDate }, los };
  }
  return {
    range: { fromDate: c.fromDate, toDate: c.toDate },
    los: c.tripType === 'roundtrip' ? c.lengthsOfStay.slice(0, MAX_STAY_DAYS) : undefined,
  };
}

/**
 * Explorar (mapa): el más barato por destino en todo el rango ("Per Date Range", una oferta
 * por destino), como el ejemplo oficial OpenDestinationWithMapModeRequest pero con ofertas completas.
 */
export function buildExploreSearchRequest(c: SearchCriteria, market: MarketSettings): FlightSearchRequest {
  const { range, los } = dateWindow(c);
  return compact({
    departureLocation: originLocation(c),
    arrivalLocations: arrivalFilters(c),
    departureDateRange: range,
    lengthsOfStay: los,
    processingOptions: {
      publicContentPointOfSaleCountry: market.pointOfSale,
      returnMode: 'Per Date Range',
      returnOffersPerLengthOfStay: false,
      // Ofertas completas: cada pin del mapa trae vuelos y clase tarifaria para Flight Refresh.
      returnFullOffers: true,
      returnLowestNonStopFare: c.nonStop || undefined,
      budget: c.budget ? { maximumTotalFareAmount: c.budget, currencyCode: market.currency } : undefined,
    },
    configuration: market.pcc ? { customerCode: market.pcc } : undefined,
  });
}

/**
 * Calendario de tarifas para un par origen-destino: el más barato por día ("Per Day")
 * con ofertas completas (vuelos y clase tarifaria de cada día).
 */
export function buildCalendarSearchRequest(
  params: { origin: string; destination: string; fromDate: string; toDate: string; lengthOfStay?: number; nonStop?: boolean; budget?: number },
  market: MarketSettings,
): FlightSearchRequest {
  return compact({
    departureLocation: placeLocation(params.origin),
    arrivalLocations: [{ locationFilter: 'Limit To', location: placeLocation(params.destination) }],
    departureDateRange: { fromDate: params.fromDate, toDate: params.toDate },
    lengthsOfStay: params.lengthOfStay !== undefined ? [params.lengthOfStay] : undefined,
    processingOptions: {
      publicContentPointOfSaleCountry: market.pointOfSale,
      returnMode: 'Per Day',
      returnFullOffers: true,
      returnLowestNonStopFare: params.nonStop || undefined,
      budget: params.budget ? { maximumTotalFareAmount: params.budget, currencyCode: market.currency } : undefined,
    },
    configuration: market.pcc ? { customerCode: market.pcc } : undefined,
  });
}

/**
 * Vista anual (franja de 12 meses): el más barato por mes, solo precio. Liviano.
 */
export function buildMonthOverviewRequest(
  params: { origin: string; destination: string; lengthOfStay?: number; nonStop?: boolean },
  market: MarketSettings,
): FlightSearchRequest {
  return compact({
    departureLocation: placeLocation(params.origin),
    arrivalLocations: [{ locationFilter: 'Limit To', location: placeLocation(params.destination) }],
    departureDateRange: { fromDate: plusDays(today(), 1), toDate: plusDays(today(), SEARCH_WINDOW_DAYS) },
    lengthsOfStay: params.lengthOfStay !== undefined ? [params.lengthOfStay] : undefined,
    processingOptions: {
      publicContentPointOfSaleCountry: market.pointOfSale,
      returnMode: 'Per Month',
      returnFullOffers: false,
      returnLowestNonStopFare: params.nonStop || undefined,
    },
    configuration: market.pcc ? { customerCode: market.pcc } : undefined,
  });
}

export function expandTravelers(t: Travelers): { passengerTypeCode: PassengerTypeCode }[] {
  return (['ADT', 'CNN', 'INF'] as const).flatMap((ptc) => Array.from({ length: t[ptc] }, () => ({ passengerTypeCode: ptc })));
}

/** Vuelos de una oferta en el formato de itinerario de Flight Refresh (ItineraryJourney). */
export function toItineraryJourneys(offer: TripOffer) {
  return offer.legs.map((leg) => ({
    flights: leg.segments.map((s) =>
      compact({
        departureAirportCode: s.from,
        departureDate: s.departDate,
        departureTime: s.departTime,
        arrivalAirportCode: s.to,
        arrivalDate: s.arriveDate,
        arrivalTime: s.arriveTime,
        marketingAirlineCode: s.marketingAirline,
        marketingFlightNumber: s.marketingNumber,
        segmentDetails: s.bookingClass ? { bookingClassCode: s.bookingClass } : undefined,
      }),
    ),
  }));
}

/**
 * Clave de agrupación para Flight Refresh: ruta Y fecha de cada tramo.
 * Sabre exige que el `departureDate` de cada journey del request coincida con la fecha del
 * primer vuelo de ese tramo en cada itinerario; si no, responde
 * "Flight and requested journey departure dates must match".
 */
const refreshKey = (legs: Leg[]) => legs.map((l) => `${l.from}-${l.to}-${l.segments[0]?.departDate ?? l.departDate}`).join('|');

export const REFRESH_MISSING_PCC =
  'Flight Refresh exige pseudoCityCode: configurá SABRE_REQUEST_PCC en .env.local o el PCC en el panel de conexión.';

/**
 * Arma los requests de Flight Refresh: uno por ruta + fechas, con hasta 100 itinerarios
 * cada uno, y el `pseudoCityCode` que la API marca como obligatorio.
 * https://developer.sabre.com/rest-api/flightrefresh-api/v1
 */
export function buildRefreshRequests(offers: TripOffer[], travelers: Travelers, market: MarketSettings): { request: FlightRefreshRequest; offerIds: string[] }[] {
  if (!market.pcc) throw new Error(REFRESH_MISSING_PCC);
  const groups = new Map<string, TripOffer[]>();
  for (const o of offers) {
    if (o.priceOnly || !o.legs.length || o.legs.some((l) => !l.segments.length)) continue;
    const key = refreshKey(o.legs);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const requests: { request: FlightRefreshRequest; offerIds: string[] }[] = [];
  for (const list of groups.values()) {
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const first = chunk[0];
      requests.push({
        offerIds: chunk.map((o) => o.id),
        request: {
          journeys: first.legs.map((l) => ({
            departureLocation: { airportCode: l.segments[0].from },
            arrivalLocation: { airportCode: l.segments[l.segments.length - 1].to },
            departureDate: l.segments[0].departDate,
          })),
          travelers: expandTravelers(travelers),
          itineraries: chunk.map((o) => ({ journeys: toItineraryJourneys(o) })),
          processingOptions: { pseudoCityCode: market.pcc },
        } as FlightRefreshRequest,
      });
    }
  }
  return requests;
}

/** Quita claves undefined (el spec no acepta null y los undefined ensucian el Inspector). */
export function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
