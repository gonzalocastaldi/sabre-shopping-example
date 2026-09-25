/**
 * Arma los requests de cada API a partir del estado de la UI y de las ofertas normalizadas.
 * Cada builder está cubierto por tests que validan el resultado contra el spec oficial.
 */
import { addDays, format } from 'date-fns';
import { getCity } from '@/data/geo';
import type { Leg, TripOffer } from './normalize';
import type {
  FlightCheckOfferRequest,
  FlightCheckPayloadRequest,
  FlightRefreshRequest,
  FlightReshopRequest,
  FlightSearchRequest,
  FlightShopRequest,
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
    const los = c.tripType === 'roundtrip' && c.returnDate ? [Math.max(0, Math.round((Date.parse(c.returnDate) - Date.parse(c.departDate)) / 86400000))] : undefined;
    return { range: { fromDate: c.departDate, toDate: c.departDate }, los };
  }
  return {
    range: { fromDate: c.fromDate, toDate: c.toDate },
    los: c.tripType === 'roundtrip' ? c.lengthsOfStay.slice(0, 21) : undefined,
  };
}

/**
 * Explorar (mapa/lista): el más barato por destino en todo el rango ("Per Date Range",
 * un solo precio por destino). Mismo patrón que el ejemplo oficial OpenDestinationWithMapModeRequest.
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
      returnFullOffers: false,
      returnLowestNonStopFare: c.nonStop || undefined,
      budget: c.budget ? { maximumTotalFareAmount: c.budget, currencyCode: market.currency } : undefined,
    },
    configuration: market.pcc ? { customerCode: market.pcc } : undefined,
  });
}

/**
 * Calendario de tarifas para un par origen-destino: el más barato por día ("Per Day")
 * con ofertas completas, para poder validar con Refresh y revalidar con Check.
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

export interface ShopSelection {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  travelers: Travelers;
  cabin: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  nonStop?: boolean;
}

const shopLocation = (code: string) => (getCity(code) ? { cityCode: code } : { airportCode: code });

export function buildShopRequest(s: ShopSelection, market: MarketSettings): FlightShopRequest {
  const journeys: FlightShopRequest['journeys'] = [
    { departureLocation: shopLocation(s.origin), arrivalLocation: shopLocation(s.destination), departureDate: s.departDate },
  ];
  if (s.returnDate) {
    journeys.push({ departureLocation: shopLocation(s.destination), arrivalLocation: shopLocation(s.origin), departureDate: s.returnDate });
  }
  return compact({
    journeys,
    travelers: expandTravelers(s.travelers),
    route: s.nonStop ? { maximumNumberOfStops: 0 } : undefined,
    fare: {
      currencyCode: market.currency,
      cabin: { logic: 'Jump Cabin', name: s.cabin },
      returnTaxBreakdown: true,
    },
    retailing: {
      returnOfferAttributes: ['Baggage', 'Flexibility', 'Carbon Emissions'],
      returnAdditionalOffers: { numberOfAdditionalOffers: 3 },
    },
    processingOptions: compact({ pseudoCityCode: market.pcc, limitNumberOfOffers: 60 }),
  }) as FlightShopRequest;
}

/** Vuelos de una oferta en el formato de itinerario de Refresh/Check (ItineraryJourney). */
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

const routeKey = (legs: Leg[]) => legs.map((l) => `${l.from}-${l.to}`).join('|');

/**
 * Flight Refresh exige que todos los aeropuertos de cada itinerario pertenezcan a las
 * ciudades del journey de nivel superior, así que agrupamos por ruta (máx. 100 por request).
 * https://developer.sabre.com/rest-api/flightrefresh-api/v1 (User Guide: "Specifying the journey is mandatory")
 */
export function buildRefreshRequests(offers: TripOffer[], travelers: Travelers, market: MarketSettings): { request: FlightRefreshRequest; offerIds: string[] }[] {
  const groups = new Map<string, TripOffer[]>();
  for (const o of offers) {
    if (o.priceOnly || !o.legs.length) continue;
    const key = routeKey(o.legs);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const requests: { request: FlightRefreshRequest; offerIds: string[] }[] = [];
  for (const list of groups.values()) {
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const first = chunk[0];
      requests.push({
        offerIds: chunk.map((o) => o.id),
        request: compact({
          journeys: first.legs.map((l) => ({ departureLocation: { airportCode: l.from }, arrivalLocation: { airportCode: l.to }, departureDate: l.departDate })),
          travelers: expandTravelers(travelers),
          itineraries: chunk.map((o) => ({ journeys: toItineraryJourneys(o) })),
          processingOptions: market.pcc ? { pseudoCityCode: market.pcc } : undefined,
        }) as FlightRefreshRequest,
      });
    }
  }
  return requests;
}

/** Flight Check por payload (contenido ATPCO, p. ej. ofertas que vienen de la caché de Search). */
export function buildCheckPayloadRequest(offer: TripOffer, travelers: Travelers, market: MarketSettings): FlightCheckPayloadRequest {
  return compact({
    journeys: toItineraryJourneys(offer),
    travelers: expandTravelers(travelers),
    fare: compact({
      currencyCode: market.currency,
      validatingAirlineCodes: offer.validatingAirline ? [offer.validatingAirline] : undefined,
      returnTaxBreakdown: true,
    }),
    retailing: {
      returnOfferAttributes: ['Baggage', 'Flexibility', 'Carbon Emissions'],
      returnAdditionalOffers: { numberOfAdditionalOffers: 3 },
    },
    processingOptions: market.pcc ? { pseudoCityCode: market.pcc } : undefined,
  }) as FlightCheckPayloadRequest;
}

/** Flight Check por offerItemIds (ofertas NDC que vienen de Flight Shop). */
export function buildCheckOfferRequest(offer: TripOffer, travelers: Travelers, market: MarketSettings): FlightCheckOfferRequest {
  return compact({
    offerItemIds: offer.offerItemIds,
    travelers: expandTravelers(travelers),
    retailing: { returnOfferAttributes: ['Baggage', 'Flexibility', 'Carbon Emissions'] },
    processingOptions: market.pcc ? { pseudoCityCode: market.pcc } : undefined,
  }) as FlightCheckOfferRequest;
}

/** NDC se revalida por offerItemId; el resto (ATPCO/LCC de caché) por payload. */
export function buildCheckRequest(offer: TripOffer, travelers: Travelers, market: MarketSettings) {
  return offer.distributionModel === 'NDC' ? buildCheckOfferRequest(offer, travelers, market) : buildCheckPayloadRequest(offer, travelers, market);
}

export interface ReshopForm {
  reference: string;
  referenceType: 'booking' | 'ticket';
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  flexibleDates: boolean;
}

export function buildReshopRequest(f: ReshopForm, market: MarketSettings): FlightReshopRequest {
  const loc = (code: string) => (getCity(code) ? { cityCode: code } : { airportCode: code });
  const journeys: FlightReshopRequest['journeys'] = [{ departureLocation: loc(f.origin), arrivalLocation: loc(f.destination), departureDate: f.departDate }];
  if (f.returnDate) journeys.push({ departureLocation: loc(f.destination), arrivalLocation: loc(f.origin), departureDate: f.returnDate });
  const refs =
    f.referenceType === 'booking'
      ? { bookingId: f.reference.trim().toUpperCase() }
      : { tickets: f.reference.split(/[\s,]+/).filter(Boolean).map((number) => ({ number })) };
  return compact({
    ...refs,
    journeys,
    // ±3 días alrededor de la fecha pedida (máximo permitido: ventana de 6 días).
    // https://developer.sabre.com/rest-api/flight-reshop-api/1.0 (Date Flexibility)
    departureDateFlexibility: f.flexibleDates ? { plusMinusDays: 3 } : undefined,
    retailing: { returnOfferAttributes: ['Baggage', 'Flexibility'] },
    targetPcc: market.pcc,
  }) as FlightReshopRequest;
}

/** Quita claves undefined (el spec no acepta null y los undefined ensucian el Inspector). */
export function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
