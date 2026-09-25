/**
 * Mocks de Flight Refresh v1, Flight Reshop 1.x y Geo Autocomplete v2.
 */
import type { FlightRefreshRequest, FlightReshopRequest } from '@/api/requests';
import type { FlightRefreshResponse, MosaicFlight, MosaicJourney, MosaicOffer, MosaicResponse } from '@/api/mosaic';
import type { GeoAutocompleteResponse } from '@/api/types/geo';
import { searchPlaces } from '@/data/geo';
import { RBDS_BY_CABIN, buildLeg, carriersFor, farePrice, fx, hasNonStop, mainAirport, money, pick, rng, stripFlight, uuid } from './core';

export function mockFlightRefresh(req: FlightRefreshRequest): FlightRefreshResponse {
  const today = new Date().toISOString().slice(0, 10);
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
      return {
        requestedItineraryIndex: index,
        isItineraryValid: true,
        ...(withRbd ? { bookingClassCodeValidation: validation } : {}),
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

type Loc = { cityCode?: string; airportCode?: string };
const codeOf = (l: Loc) => l.airportCode ?? l.cityCode ?? '';

/**
 * Reshop: ofertas de cambio para las nuevas fechas (± días si hay flexibilidad), con la
 * diferencia de precio frente al ticket original. Los datos del pasajero son ficticios.
 */
export function mockFlightReshop(req: FlightReshopRequest): MosaicResponse {
  const journeysReq = req.journeys.map((j) => ({ from: codeOf(j.departureLocation as Loc), to: codeOf(j.arrivalLocation as Loc), date: j.departureDate }));
  const [out, back] = journeysReq;
  const flex = req.departureDateFlexibility as { plusMinusDays?: number } | undefined;
  const window = flex?.plusMinusDays ?? 0;
  const currency = 'USD';
  const los = back ? Math.round((Date.parse(back.date) - Date.parse(out.date)) / 86400000) : undefined;
  const originalUsd = farePrice(out.from, out.to, out.date, los) * 1.05;
  const tickets = (req.tickets ?? []) as { number: string }[];
  const reference = req.bookingId ?? tickets[0]?.number ?? 'DEMO';

  const flights: MosaicFlight[] = [];
  const journeys: MosaicJourney[] = [];
  const offers: MosaicOffer[] = [];
  const carriers = carriersFor(out.from, out.to);

  for (let shift = -window; shift <= window; shift++) {
    const date = new Date(Date.parse(`${out.date}T12:00:00Z`) + shift * 86400000).toISOString().slice(0, 10);
    if (date < new Date().toISOString().slice(0, 10)) continue;
    const perDate = shift === 0 ? 4 : 1;
    for (let i = 0; i < perDate; i++) {
      const seed = `reshop${reference}${date}${i}`;
      const r = rng(seed);
      const carrier = pick(r, carriers);
      const nonStop = hasNonStop(out.from, out.to) && i % 2 === 0;
      const legDates = back ? [date, new Date(Date.parse(`${date}T12:00:00Z`) + (los ?? 0) * 86400000).toISOString().slice(0, 10)] : [date];
      const legs = legDates.map((d, legIndex) =>
        buildLeg(`${seed}-${legIndex}`, legIndex ? out.to : out.from, legIndex ? out.from : out.to, d, { carrier, nonStop, departMinutes: 420 + Math.floor(r() * 780) }),
      );
      const journeyRefs = legs.map((legFlights, legIndex) => {
        const id = uuid(`${seed}-j${legIndex}`);
        flights.push(...legFlights.map((f) => ({ ...stripFlight(f), isMarriedWithPreviousFlight: false })));
        journeys.push({
          id,
          flightRefs: legFlights.map((f) => f.id),
          departureAirportCode: legFlights[0].departureAirportCode,
          arrivalAirportCode: legFlights.at(-1)!.arrivalAirportCode,
          durationInMinutes: legFlights.reduce((n, f) => n + (f.durationInMinutes ?? 0), 0),
        });
        return id;
      });
      const newUsd = farePrice(out.from, out.to, date, los, nonStop) * (0.92 + r() * 0.25);
      const diff = fx(newUsd - originalUsd, currency);
      const fee = diff < 0 ? 0 : 75;
      const type = Math.abs(diff) < 5 ? 'Even' : diff > 0 ? 'Add collect' : 'Refund';
      const baseDiff = diff * 0.85;
      const taxDiff = diff - baseDiff;
      const charge = {
        type,
        baseFare: money(baseDiff, currency),
        totalTax: money(taxDiff, currency),
        subtotalBeforeFee: money(diff, currency),
        grandTotal: money(diff + fee, currency),
        currencyCode: currency,
        totalTaxOnFee: '0.00',
      };
      const rbd = pick(r, ['M', 'H', 'K', 'Q']);
      offers.push({
        id: uuid(`${seed}-offer`),
        source: { distributionModel: 'ATPCO' },
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 20 * 60_000).toISOString(),
        journeyRefs,
        totalPriceDifference: charge,
        isSellable: true,
        items: [
          {
            id: uuid(`${seed}-item`),
            fares: [
              {
                travelers: [{ passengerTypeCode: 'ADT', ticketNumber: tickets[0]?.number ?? '0019999999999', givenName: 'VIAJERO', surname: 'DEMO' }],
                priceDifference: { ...charge, totalFee: fee ? { fees: [{ amount: money(fee, currency), currencyCode: currency }] } : undefined },
                fareComponents: legs.map((legFlights) => ({
                  fareBasisCode: `${rbd}X${carrier.code}`,
                  brand: { code: 'MAIN', name: 'MAIN CABIN' },
                  segmentDetails: legFlights.map((f) => ({ flightRef: f.id, bookingClassCode: rbd, cabinName: 'Economy' as const })),
                })),
              },
            ],
          },
        ],
      });
    }
  }
  offers.sort((a, b) => Number(a.totalPriceDifference!.grandTotal) - Number(b.totalPriceDifference!.grandTotal));
  return JSON.parse(JSON.stringify({ timestamp: new Date().toISOString(), flights, journeys, numberOfOffers: offers.length, offers }));
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
