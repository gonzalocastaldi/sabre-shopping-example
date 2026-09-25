import { describe, expect, it } from 'vitest';
import { buildFareCalendar, normalizeOffers, summarizeByPlace } from '../normalize';
import type { MosaicResponse } from '../mosaic';
import { SEARCH_FULL_OFFER_RESPONSE, SEARCH_PRICE_ONLY_RESPONSE } from './fixtures';
import { validateAgainstSpec } from './specValidator';

describe('normalizeOffers', () => {
  it('las fixtures cumplen el schema de respuesta de Flight Search', () => {
    expect(validateAgainstSpec('flightsearch', 'FlightSearchResponse', SEARCH_FULL_OFFER_RESPONSE)).toEqual([]);
    expect(validateAgainstSpec('flightsearch', 'FlightSearchResponse', SEARCH_PRICE_ONLY_RESPONSE)).toEqual([]);
  });

  it('resuelve journeys, vuelos, RBD y brand', () => {
    const [direct, connection] = normalizeOffers(SEARCH_FULL_OFFER_RESPONSE as MosaicResponse);
    expect(direct.legs).toHaveLength(2);
    expect(direct.isNonStop).toBe(true);
    expect(direct.legs[0].segments[0]).toMatchObject({ from: 'EZE', to: 'MAD', bookingClass: 'Q', brandName: 'LITE' });
    expect(direct.lengthOfStay).toBe(10);
    expect(direct.price).toEqual({ amount: 1122.99, currency: 'USD' });

    expect(connection.legs[0].stops).toBe(1);
    // 165 min + conexión 200 min (12:50 → 16:10) + 620 min
    expect(connection.legs[0].durationMin).toBe(985);
    expect(connection.airlines).toEqual(['LA']);
  });

  it('soporta ofertas solo-precio y agrupa por destino', () => {
    const offers = normalizeOffers(SEARCH_PRICE_ONLY_RESPONSE as MosaicResponse);
    expect(offers.every((o) => o.priceOnly)).toBe(true);
    const places = summarizeByPlace(offers, 'destination');
    expect(places.map((p) => p.code)).toEqual(['MIA', 'CUN']);
    expect(places[0].cheapestNonStop?.id).toBe('c2');
  });

  it('arma el calendario por fecha de salida', () => {
    const offers = normalizeOffers(SEARCH_FULL_OFFER_RESPONSE as MosaicResponse);
    const cal = buildFareCalendar(offers);
    expect(cal.get('2026-11-10')?.cheapest.id).toBe('o1');
    expect(cal.get('2026-11-12')?.cheapest.id).toBe('o2');
  });
});
