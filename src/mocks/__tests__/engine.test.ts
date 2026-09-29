import { describe, expect, it } from 'vitest';
import { buildCalendarSearchRequest, buildExploreSearchRequest, buildRefreshRequests, plusDays, today, toItineraryJourneys } from '@/api/mappers';
import { normalizeOffers } from '@/api/normalize';
import type { FlightRefreshRequest } from '@/api/requests';
import { validateAgainstSpec } from '@/api/__tests__/specValidator';
import { mockFlightSearch } from '../engine/search';
import { mockFlightRefresh, mockGeoAutocomplete } from '../engine/other';

const market = { pointOfSale: 'US', currency: 'USD', pcc: 'MOCK' };
const from = plusDays(today(), 20);
const to = plusDays(today(), 140);
const travelers = { ADT: 2, CNN: 1, INF: 1 };

const exploreBeach = () =>
  normalizeOffers(
    mockFlightSearch(
      buildExploreSearchRequest(
        { originMode: 'place', origins: ['BUE'], destinationMode: 'theme', destinations: ['Beach'], exclude: [], tripType: 'roundtrip', dateMode: 'flexible', fromDate: from, toDate: to, lengthsOfStay: [7], nonStop: false },
        market,
      ),
    ),
  );

describe('motor de mocks (respuestas válidas según los specs)', () => {
  it('Flight Search explorar: una oferta completa por destino', () => {
    const req = buildExploreSearchRequest(
      { originMode: 'place', origins: ['BUE'], destinationMode: 'theme', destinations: ['Beach'], exclude: [], tripType: 'roundtrip', dateMode: 'flexible', fromDate: from, toDate: to, lengthsOfStay: [7], nonStop: false },
      market,
    );
    const res = mockFlightSearch(req);
    expect(validateAgainstSpec('flightsearch', 'FlightSearchResponse', res)).toEqual([]);
    const offers = normalizeOffers(res);
    expect(offers.length).toBeGreaterThan(5);
    expect(new Set(offers.map((o) => o.legs[0].to)).size).toBe(offers.length);
    // Con ofertas completas cada pin tiene vuelos y clase tarifaria para Flight Refresh.
    expect(offers.every((o) => !o.priceOnly && o.legs.every((l) => l.segments.every((s) => s.bookingClass)))).toBe(true);
  });

  it('Flight Search calendario: una oferta completa por día', () => {
    const res = mockFlightSearch(buildCalendarSearchRequest({ origin: 'BUE', destination: 'MAD', fromDate: from, toDate: plusDays(from, 59), lengthOfStay: 10 }, market));
    expect(validateAgainstSpec('flightsearch', 'FlightSearchResponse', res)).toEqual([]);
    const offers = normalizeOffers(res);
    expect(offers).toHaveLength(60);
    expect(offers.every((o) => !o.priceOnly && o.lengthOfStay === 10)).toBe(true);
  });

  it('Flight Refresh valida la oferta de un pin del mapa', () => {
    const [offer] = exploreBeach();
    const [group] = buildRefreshRequests([offer], travelers, market);
    const res = mockFlightRefresh(group.request);
    expect(validateAgainstSpec('flightrefresh', 'FlightRefreshResponse', res)).toEqual([]);
    expect(res.errors).toBeUndefined();
    expect(res.itineraries).toHaveLength(1);
    expect(res.itineraries![0].isItineraryValid).toBe(true);
  });

  it('Flight Refresh valida en lote varias fechas (un request por fecha, sin errores)', () => {
    const offers = normalizeOffers(mockFlightSearch(buildCalendarSearchRequest({ origin: 'BUE', destination: 'MIA', fromDate: from, toDate: plusDays(from, 9), lengthOfStay: 7 }, market)));
    const groups = buildRefreshRequests(offers, travelers, market);
    expect(groups).toHaveLength(offers.length);
    for (const g of groups) expect(mockFlightRefresh(g.request).errors).toBeUndefined();
  });

  it('el mock rechaza fechas que no coinciden, igual que Sabre', () => {
    const offers = normalizeOffers(mockFlightSearch(buildCalendarSearchRequest({ origin: 'BUE', destination: 'MIA', fromDate: from, toDate: plusDays(from, 4), lengthOfStay: 7 }, market)));
    // El request que armaba la versión anterior: itinerarios de varias fechas con las fechas del primero.
    const [first] = offers;
    const legacy: FlightRefreshRequest = {
      journeys: first.legs.map((l) => ({ departureLocation: { airportCode: l.from }, arrivalLocation: { airportCode: l.to }, departureDate: l.departDate })),
      travelers: [{ passengerTypeCode: 'ADT' }],
      itineraries: offers.map((o) => ({ journeys: toItineraryJourneys(o) })),
      processingOptions: { pseudoCityCode: 'MOCK' },
    };
    const res = mockFlightRefresh(legacy);
    expect(res.itineraries).toBeUndefined();
    expect(res.errors?.[0]).toMatchObject({ description: 'Flight and requested journey departure dates must match.', fieldPath: 'journeys[0], itineraries[1].journeys[0].flights[0]' });
  });

  it('sin pseudoCityCode, el mock responde vacío (solo timestamp), como Sabre', () => {
    const [offer] = exploreBeach();
    const [group] = buildRefreshRequests([offer], travelers, market);
    const { processingOptions: _omit, ...withoutPcc } = group.request;
    const res = mockFlightRefresh(withoutPcc as FlightRefreshRequest);
    expect(res.itineraries).toBeUndefined();
    expect(res.errors).toBeUndefined();
  });

  it('Geo Autocomplete encuentra ciudades y aeropuertos', () => {
    const res = mockGeoAutocomplete('buenos');
    expect(res.grouped?.['category:CITY']?.doclist?.docs?.[0]?.id).toBe('BUE');
  });
});
