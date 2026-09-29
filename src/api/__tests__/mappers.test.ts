import { describe, expect, it } from 'vitest';
import {
  REFRESH_MISSING_PCC,
  buildCalendarSearchRequest,
  buildExploreSearchRequest,
  buildMonthOverviewRequest,
  buildRefreshRequests,
  type SearchCriteria,
} from '../mappers';
import { normalizeOffers } from '../normalize';
import type { MosaicResponse } from '../mosaic';
import { validateAgainstSpec } from './specValidator';
import { SEARCH_FULL_OFFER_RESPONSE } from './fixtures';

const market = { pointOfSale: 'US', currency: 'USD', pcc: 'AB12' };

const base: SearchCriteria = {
  originMode: 'place',
  origins: ['BUE'],
  destinationMode: 'anywhere',
  destinations: [],
  exclude: [],
  tripType: 'roundtrip',
  dateMode: 'flexible',
  fromDate: '2026-10-01',
  toDate: '2027-03-31',
  lengthsOfStay: [6, 7, 8],
  nonStop: false,
};

const expectValid = (spec: Parameters<typeof validateAgainstSpec>[0], schema: string, value: unknown) =>
  expect(validateAgainstSpec(spec, schema, value)).toEqual([]);

describe('Flight Search requests', () => {
  it.each<[string, Partial<SearchCriteria>]>([
    ['a cualquier lugar', {}],
    ['a un país', { destinationMode: 'country', destinations: ['BR'] }],
    ['a varios países excluyendo uno', { destinationMode: 'country', destinations: ['BR', 'CL'], exclude: ['AR'] }],
    ['por región', { destinationMode: 'region', destinations: ['140-Caribbean area'] }],
    ['por temas', { destinationMode: 'theme', destinations: ['Beach', 'Skiing'] }],
    ['solo ida con presupuesto', { tripType: 'oneway', budget: 600, nonStop: true }],
    ['fechas exactas', { dateMode: 'exact', departDate: '2026-11-10', returnDate: '2026-11-17' }],
    ['open origin por país', { originMode: 'country', origins: ['US'], destinationMode: 'place', destinations: ['CUN'] }],
    ['open origin por lista', { originMode: 'multi', origins: ['EZE', 'MVD', 'SCL'], destinationMode: 'place', destinations: ['MIA'] }],
  ])('%s cumple el spec', (_, patch) => {
    const req = buildExploreSearchRequest({ ...base, ...patch }, market);
    expectValid('flightsearch', 'FlightSearchRequest', req);
  });

  it.each([1, 8, 21])('duración de %i días (un solo valor del selector) cumple el spec', (days) => {
    const req = buildExploreSearchRequest({ ...base, lengthsOfStay: [days] }, market);
    expectValid('flightsearch', 'FlightSearchRequest', req);
    expect(req.lengthsOfStay).toEqual([days]);
  });

  it('el spec rechaza duraciones de más de 21 días (por eso el selector llega a 21)', () => {
    const req = buildExploreSearchRequest({ ...base, lengthsOfStay: [22] }, market);
    expect(validateAgainstSpec('flightsearch', 'FlightSearchRequest', req)).not.toEqual([]);
  });

  it('usa City para códigos de ciudad y Airport para aeropuertos', () => {
    expect(buildExploreSearchRequest(base, market).departureLocation).toEqual({ locationType: 'City', locationCode: 'BUE' });
    expect(buildExploreSearchRequest({ ...base, origins: ['MVD'] }, market).departureLocation).toEqual({ locationType: 'Airport', locationCode: 'MVD' });
  });

  it('la vista anual pide Per Month solo precio', () => {
    const req = buildMonthOverviewRequest({ origin: 'BUE', destination: 'MAD', lengthOfStay: 10 }, market);
    expectValid('flightsearch', 'FlightSearchRequest', req);
    expect(req.processingOptions).toMatchObject({ returnMode: 'Per Month', returnFullOffers: false });
  });

  it('el calendario pide Per Day con ofertas completas', () => {
    const req = buildCalendarSearchRequest({ origin: 'BUE', destination: 'MAD', fromDate: '2026-10-01', toDate: '2027-08-27', lengthOfStay: 10 }, market);
    expectValid('flightsearch', 'FlightSearchRequest', req);
    expect(req.processingOptions).toMatchObject({ returnMode: 'Per Day', returnFullOffers: true });
  });
});

describe('Flight Refresh', () => {
  const offers = normalizeOffers(SEARCH_FULL_OFFER_RESPONSE as MosaicResponse);
  const travelers = { ADT: 2, CNN: 1, INF: 0 };

  it('cumple el spec', () => {
    for (const g of buildRefreshRequests(offers, travelers, market)) expectValid('flightrefresh', 'FlightRefreshRequest', g.request);
  });

  // Regresión: Sabre responde "Flight and requested journey departure dates must match" si en
  // un mismo request hay itinerarios de fechas distintas a las de `journeys`.
  it('arma un request por ruta + fechas y las fechas de journeys coinciden con cada itinerario', () => {
    const groups = buildRefreshRequests(offers, travelers, market);
    // Las dos ofertas de la fixture van a Madrid en fechas distintas: dos requests.
    expect(groups).toHaveLength(2);
    for (const { request } of groups) {
      request.journeys.forEach((journey, j) => {
        for (const itinerary of request.itineraries) {
          expect(itinerary.journeys[j].flights[0].departureDate).toBe(journey.departureDate);
          expect(itinerary.journeys[j].flights[0].departureAirportCode).toBe((journey.departureLocation as { airportCode: string }).airportCode);
        }
      });
    }
  });

  it('agrupa en un solo request los itinerarios de la misma ruta y fechas', () => {
    const clone = { ...offers[0], id: 'otro' };
    const groups = buildRefreshRequests([offers[0], clone], travelers, market);
    expect(groups).toHaveLength(1);
    expect(groups[0].offerIds).toEqual([offers[0].id, 'otro']);
    expect(groups[0].request.itineraries).toHaveLength(2);
  });

  it('manda siempre el pseudoCityCode y falla claro si no hay PCC', () => {
    expect(buildRefreshRequests(offers, travelers, market)[0].request.processingOptions).toEqual({ pseudoCityCode: 'AB12' });
    expect(() => buildRefreshRequests(offers, travelers, { ...market, pcc: undefined })).toThrow(REFRESH_MISSING_PCC);
  });

  it('ignora ofertas solo precio (sin vuelos para validar)', () => {
    expect(buildRefreshRequests([{ ...offers[0], priceOnly: true }], travelers, market)).toEqual([]);
  });
});
