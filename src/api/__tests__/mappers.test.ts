import { describe, expect, it } from 'vitest';
import {
  buildCalendarSearchRequest,
  buildCheckOfferRequest,
  buildCheckPayloadRequest,
  buildExploreSearchRequest,
  buildMonthOverviewRequest,
  buildRefreshRequests,
  buildReshopRequest,
  buildShopRequest,
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

describe('Shop, Refresh, Check y Reshop', () => {
  const offers = normalizeOffers(SEARCH_FULL_OFFER_RESPONSE as MosaicResponse);
  const travelers = { ADT: 2, CNN: 1, INF: 0 };

  it('Flight Shop ida y vuelta', () => {
    const req = buildShopRequest({ origin: 'BUE', destination: 'MAD', departDate: '2026-11-10', returnDate: '2026-11-20', travelers, cabin: 'Economy' }, market);
    expectValid('flightshop', 'FlightShopRequest', req);
    expect(req.travelers).toHaveLength(3);
  });

  it('Flight Refresh agrupa por ruta', () => {
    const groups = buildRefreshRequests(offers, travelers, market);
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) expectValid('flightrefresh', 'FlightRefreshRequest', g.request);
  });

  it('Flight Check por payload y por offerItemIds', () => {
    expectValid('flightcheck', 'FlightCheckRequest', buildCheckPayloadRequest(offers[0], travelers, market));
    expectValid('flightcheck', 'FlightCheckRequest', buildCheckOfferRequest(offers[0], travelers, market));
  });

  it('Flight Reshop por PNR y por tickets', () => {
    const common = { origin: 'DFW', destination: 'LAX', departDate: '2026-11-26', flexibleDates: true };
    expectValid('flightreshop', 'FlightReshopRequest', buildReshopRequest({ ...common, reference: 'glebny', referenceType: 'booking' }, market));
    expectValid('flightreshop', 'FlightReshopRequest', buildReshopRequest({ ...common, reference: '0012972101507', referenceType: 'ticket', returnDate: '2026-11-30' }, market));
  });
});
