import { describe, expect, it } from 'vitest';
import { buildCalendarSearchRequest, buildCheckRequest, buildExploreSearchRequest, buildRefreshRequests, buildReshopRequest, buildShopRequest, plusDays, today } from '@/api/mappers';
import { normalizeOffers } from '@/api/normalize';
import { validateAgainstSpec } from '@/api/__tests__/specValidator';
import { mockFlightSearch } from '../engine/search';
import { mockFlightCheck, mockFlightShop } from '../engine/shop';
import { mockFlightRefresh, mockFlightReshop, mockGeoAutocomplete } from '../engine/other';

const market = { pointOfSale: 'US', currency: 'USD' };
const from = plusDays(today(), 20);
const to = plusDays(today(), 140);
const travelers = { ADT: 2, CNN: 1, INF: 1 };

describe('motor de mocks (respuestas válidas según los specs)', () => {
  it('Flight Search explorar: un precio por destino', () => {
    const req = buildExploreSearchRequest(
      { originMode: 'place', origins: ['BUE'], destinationMode: 'theme', destinations: ['Beach'], exclude: [], tripType: 'roundtrip', dateMode: 'flexible', fromDate: from, toDate: to, lengthsOfStay: [7], nonStop: false },
      market,
    );
    const res = mockFlightSearch(req);
    expect(validateAgainstSpec('flightsearch', 'FlightSearchResponse', res)).toEqual([]);
    const offers = normalizeOffers(res);
    expect(offers.length).toBeGreaterThan(5);
    expect(new Set(offers.map((o) => o.legs[0].to)).size).toBe(offers.length);
    expect(offers.every((o) => o.priceOnly)).toBe(true);
  });

  it('Flight Search calendario: una oferta completa por día', () => {
    const res = mockFlightSearch(buildCalendarSearchRequest({ origin: 'BUE', destination: 'MAD', fromDate: from, toDate: plusDays(from, 59), lengthOfStay: 10 }, market));
    expect(validateAgainstSpec('flightsearch', 'FlightSearchResponse', res)).toEqual([]);
    const offers = normalizeOffers(res);
    expect(offers).toHaveLength(60);
    expect(offers.every((o) => !o.priceOnly && o.lengthOfStay === 10)).toBe(true);
  });

  it('Flight Refresh valida las ofertas del calendario', () => {
    const offers = normalizeOffers(mockFlightSearch(buildCalendarSearchRequest({ origin: 'BUE', destination: 'MIA', fromDate: from, toDate: plusDays(from, 9), lengthOfStay: 7 }, market)));
    const [group] = buildRefreshRequests(offers, travelers, market);
    const res = mockFlightRefresh(group.request);
    expect(validateAgainstSpec('flightrefresh', 'FlightRefreshResponse', res)).toEqual([]);
    expect(res.itineraries).toHaveLength(offers.length);
  });

  it('Flight Shop y Flight Check (payload y offerItemIds)', () => {
    const shop = mockFlightShop(buildShopRequest({ origin: 'BUE', destination: 'MAD', departDate: from, returnDate: plusDays(from, 12), travelers, cabin: 'Economy' }, market));
    expect(validateAgainstSpec('flightshop', 'FlightShopResponse', shop)).toEqual([]);
    const offers = normalizeOffers(shop);
    expect(offers.length).toBeGreaterThan(10);
    expect(offers[0].travelers.map((t) => t.ptc)).toEqual(['ADT', 'CNN', 'INF']);

    for (const offer of [offers.find((o) => o.distributionModel === 'NDC') ?? offers[0], offers.find((o) => o.distributionModel === 'ATPCO')!]) {
      const check = mockFlightCheck(buildCheckRequest(offer, travelers, market));
      expect(validateAgainstSpec('flightcheck', 'FlightCheckResponse', check)).toEqual([]);
      expect(normalizeOffers(check)[0].price?.amount).toBeGreaterThan(0);
    }
  });

  it('Check revalida cerca del precio que mostró Shop, respetando la tarifa elegida', () => {
    const t = { ADT: 1, CNN: 0, INF: 0 };
    const shop = normalizeOffers(mockFlightShop(buildShopRequest({ origin: 'BUE', destination: 'RIO', departDate: from, returnDate: plusDays(from, 7), travelers: t, cabin: 'Economy' }, market)));
    const classic = shop.find((o) => o.brandNames[0] === 'Classic' && o.distributionModel === 'ATPCO')!;
    const checked = normalizeOffers(mockFlightCheck(buildCheckRequest(classic, t, market)))[0];
    expect(checked.brandNames[0]).toBe('Classic');
    const ratio = checked.price!.amount / classic.price!.amount;
    expect(ratio).toBeGreaterThan(0.97);
    expect(ratio).toBeLessThan(1.12);
  });

  it('no arma escalas con desvíos absurdos (EZE-GIG no conecta en Bogotá)', () => {
    const shop = normalizeOffers(mockFlightShop(buildShopRequest({ origin: 'EZE', destination: 'GIG', departDate: from, travelers: { ADT: 1, CNN: 0, INF: 0 }, cabin: 'Economy' }, market)));
    const vias = shop.flatMap((o) => o.legs.flatMap((l) => l.segments.slice(0, -1).map((s) => s.to)));
    expect(vias).not.toContain('BOG');
    expect(vias).not.toContain('PTY');
  });

  it('Flight Reshop con flexibilidad de fechas', () => {
    const res = mockFlightReshop(buildReshopRequest({ reference: 'ABCDEF', referenceType: 'booking', origin: 'DFW', destination: 'LAX', departDate: from, flexibleDates: true }, market));
    expect(validateAgainstSpec('flightreshop', 'FlightReshopResponse', res)).toEqual([]);
    expect(res.offers!.length).toBeGreaterThanOrEqual(7);
  });

  it('Geo Autocomplete encuentra ciudades y aeropuertos', () => {
    const res = mockGeoAutocomplete('buenos');
    expect(res.grouped?.['category:CITY']?.doclist?.docs?.[0]?.id).toBe('BUE');
  });
});
