/**
 * Mocks de Flight Refresh v1 y Geo Autocomplete v2.
 */
import type { FlightRefreshRequest } from '@/api/requests';
import type { FlightRefreshResponse, MosaicError } from '@/api/mosaic';
import type { GeoAutocompleteResponse } from '@/api/types/geo';
import { searchPlaces } from '@/data/geo';
import { RBDS_BY_CABIN, mainAirport, rng } from './core';

/**
 * Reglas que Sabre aplica y que el mock replica, para que un request inválido falle igual
 * que en vivo (así se detectó el bug de fechas):
 * - pseudoCityCode es obligatorio; sin él Sabre responde solo `timestamp`.
 * - La fecha del primer vuelo de cada tramo debe coincidir con `journeys[i].departureDate`.
 */
function refreshRequestErrors(req: FlightRefreshRequest): MosaicError[] {
  const errors: MosaicError[] = [];
  req.itineraries.forEach((itinerary, i) => {
    itinerary.journeys.forEach((journey, j) => {
      const expected = req.journeys[j]?.departureDate;
      if (expected && journey.flights[0]?.departureDate !== expected) {
        errors.push({
          category: 'BAD_REQUEST',
          type: 'INVALID_VALUE',
          description: 'Flight and requested journey departure dates must match.',
          fieldPath: `journeys[${j}], itineraries[${i}].journeys[${j}].flights[0]`,
        });
      }
    });
  });
  return errors;
}

export function mockFlightRefresh(req: FlightRefreshRequest): FlightRefreshResponse {
  const today = new Date().toISOString().slice(0, 10);
  if (!req.processingOptions?.pseudoCityCode) return { timestamp: new Date().toISOString() };
  const errors = refreshRequestErrors(req);
  if (errors.length) return { timestamp: new Date().toISOString(), errors: errors.slice(0, 1) };
  return {
    timestamp: new Date().toISOString(),
    itineraries: req.itineraries.map((itinerary, index) => {
      const flights = itinerary.journeys.flatMap((j) => j.flights);
      const inPast = flights.some((f) => f.departureDate < today);
      if (inPast) return { requestedItineraryIndex: index, isItineraryValid: false, bookingClassCodeValidation: 'Unknown' as const };
      const roll = rng(JSON.stringify(flights))();
      const validation = roll < 0.72 ? 'Matched' : roll < 0.88 ? 'Same cabin' : roll < 0.95 ? 'Any other' : 'None';
      const requested = flights.map((f) => f.segmentDetails?.bookingClassCode);
      const withRbd = requested.every(Boolean);
      // Sin clase tarifaria en algún vuelo, Sabre solo puede responder "Any other" o "None".
      return {
        requestedItineraryIndex: index,
        isItineraryValid: true,
        bookingClassCodeValidation: withRbd ? validation : roll < 0.9 ? 'Any other' : 'None',
        ...(withRbd && validation !== 'None' && validation !== 'Any other'
          ? {
              cabinAvailability: {
                journeys: itinerary.journeys.map((j) => ({
                  flights: j.flights.map((f) => {
                    const r = rng(`${f.marketingAirlineCode}${f.marketingFlightNumber}${f.departureDate}`);
                    const rbds = RBDS_BY_CABIN.Economy;
                    const from = Math.max(0, rbds.indexOf(f.segmentDetails?.bookingClassCode ?? 'Y') - 2);
                    return {
                      cabinName: 'Economy' as const,
                      bookingClassCodes: rbds.slice(from, from + 5).map((code) => ({
                        bookingClassCode: code,
                        seatsAvailable: code === f.segmentDetails?.bookingClassCode && validation === 'Same cabin' ? 0 : Math.floor(r() * 9) + 1,
                      })),
                    };
                  }),
                })),
              },
            }
          : {}),
      };
    }),
  };
}

export function mockGeoAutocomplete(query: string, category?: string, limit = 8): GeoAutocompleteResponse {
  const places = searchPlaces(query, limit).filter((p) => !category || (category === 'CITY' ? p.kind === 'city' : category === 'AIR' ? p.kind === 'airport' : true));
  const doc = (p: (typeof places)[number]) => {
    const main = mainAirport(p.code);
    return {
      name: p.name,
      city: p.city,
      country: p.country,
      category: p.kind === 'city' ? 'CITY' : 'AIR',
      id: p.code,
      dataset: p.kind === 'city' ? 'CITY' : 'AIR',
      datasource: 'MOCK',
      latitude: String(main?.lat ?? p.lat),
      longitude: String(main?.lon ?? p.lon),
      iataCityCode: p.kind === 'city' ? p.code : undefined,
      ranking: p.weight * 300,
    };
  };
  const air = places.filter((p) => p.kind === 'airport');
  const city = places.filter((p) => p.kind === 'city');
  return {
    responseHeader: { status: 0, QTime: 1 },
    grouped: {
      'category:AIR': { matches: air.length, doclist: { numFound: air.length, start: 0, docs: air.map(doc) } },
      'category:CITY': { matches: city.length, doclist: { numFound: city.length, start: 0, docs: city.map(doc) } },
    },
  };
}
