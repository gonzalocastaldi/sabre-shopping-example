/**
 * Mock de Flight Search v1: respeta open origin/destination, filtros (Limit To / Exclude),
 * rango de fechas, estadías, returnMode, returnFullOffers, budget y non-stop.
 */
import { MOCK_ANYWHERE, REGION_BY_CODE, THEME_BY_CODE } from '@/data/catalog';
import { airportsInCountry, getCity } from '@/data/geo';
import type { FlightSearchRequest, SearchLocation } from '@/api/requests';
import type { MosaicFlight, MosaicJourney, MosaicOffer, MosaicResponse } from '@/api/mosaic';
import { buildLeg, carriersFor, farePrice, flightsSignature, fx, hasNonStop, mainAirport, money, pick, rememberPrice, rng, stripFlight, uuid } from './core';

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const todayIso = () => new Date().toISOString().slice(0, 10);

function airportsOf(location: SearchLocation, perCountry = 6): string[] {
  const code = 'locationCode' in location ? location.locationCode : undefined;
  const codes = 'locationCodes' in location ? location.locationCodes : code ? [code] : [];
  switch (location.locationType) {
    case 'Airport':
    case 'AirportList':
      return codes;
    case 'City':
    case 'CityList':
      return codes.map((c) => getCity(c)?.airports?.[0] ?? c);
    case 'Country':
    case 'CountryList':
      return codes.flatMap((c) =>
        airportsInCountry(c)
          .sort((a, b) => b.weight - a.weight)
          .slice(0, perCountry)
          .map((a) => a.code),
      );
    case 'Region':
      return (REGION_BY_CODE[location.locationCode]?.mockCountries ?? []).flatMap((c) =>
        airportsInCountry(c)
          .filter((a) => a.weight > 1)
          .slice(0, 2)
          .map((a) => a.code),
      );
    case 'Theme':
      return THEME_BY_CODE[location.locationCode]?.mockAirports ?? [];
  }
}

function destinationsFor(req: FlightSearchRequest, origins: string[]): string[] {
  const filters = req.arrivalLocations ?? [];
  const limits = filters.filter((f) => f.locationFilter === 'Limit To');
  const excludes = filters.filter((f) => f.locationFilter === 'Exclude');
  // Varios "Limit To" del mismo tipo se suman; de distinto tipo (p. ej. País + Tema, como en el
  // ejemplo oficial) se intersectan, y si la intersección queda vacía se suman.
  let candidates = limits.length ? airportsOf(limits[0].location) : [...MOCK_ANYWHERE];
  for (const extra of limits.slice(1)) {
    const next = airportsOf(extra.location, 30);
    if (extra.location.locationType === limits[0].location.locationType) candidates = [...candidates, ...next];
    else {
      const both = candidates.filter((c) => next.includes(c));
      candidates = both.length ? both : [...candidates, ...next];
    }
  }
  const excluded = new Set(excludes.flatMap((f) => airportsOf(f.location, 50)));
  const excludedCountries = new Set(
    excludes.flatMap((f) => (f.location.locationType === 'Country' ? [f.location.locationCode] : f.location.locationType === 'CountryList' ? f.location.locationCodes : [])),
  );
  const originCities = new Set(origins.map((o) => mainAirport(o)?.city));
  return Array.from(new Set(candidates)).filter((d) => {
    const place = mainAirport(d);
    return place && !excluded.has(d) && !excludedCountries.has(place.country) && !originCities.has(place.city);
  });
}

export function mockFlightSearch(req: FlightSearchRequest): MosaicResponse {
  const origins = airportsOf(req.departureLocation, 5);
  const destinations = destinationsFor(req, origins);
  const openOrigin = !['Airport', 'City'].includes(req.departureLocation.locationType);

  const opts = req.processingOptions ?? {};
  const mode = opts.returnMode ?? 'Per Day';
  const full = opts.returnFullOffers ?? false;
  const perLos = opts.returnOffersPerLengthOfStay ?? true;
  const currency = opts.budget?.currencyCode ?? (opts.publicContentPointOfSaleCountry === 'MX' ? 'MXN' : 'USD');

  const start = Math.max(Date.parse(`${req.departureDateRange?.fromDate ?? todayIso()}T00:00:00Z`), Date.parse(`${todayIso()}T00:00:00Z`));
  const maxEnd = Date.parse(`${todayIso()}T00:00:00Z`) + 330 * DAY;
  const end = Math.min(Date.parse(`${req.departureDateRange?.toDate ?? iso(maxEnd)}T00:00:00Z`), maxEnd);
  const losList: (number | undefined)[] = req.lengthsOfStay?.length ? req.lengthsOfStay : [undefined];

  const pairs = openOrigin ? origins.flatMap((o) => destinations.slice(0, 3).map((d) => [o, d] as const)) : origins.slice(0, 1).flatMap((o) => destinations.map((d) => [o, d] as const));
  // Per Day con muchos destinos devolvería miles de ofertas: el mock recorta el rango.
  const dayCap = mode === 'Per Day' && pairs.length > 4 ? 45 : 330;

  const flights: MosaicFlight[] = [];
  const journeys: MosaicJourney[] = [];
  const offers: MosaicOffer[] = [];

  type Candidate = { from: string; to: string; date: string; los?: number; usd: number; nonStop: boolean };

  const bucketKey = (c: Candidate) => {
    const base = `${c.from}${c.to}${perLos ? (c.los ?? '') : ''}`;
    if (mode === 'Per Day') return `${base}${c.date}`;
    if (mode === 'Per Month') return `${base}${c.date.slice(0, 7)}`;
    return base;
  };

  for (const [from, to] of pairs) {
    const nonStopAvailable = hasNonStop(from, to);
    const best = new Map<string, Candidate>();
    const bestNonStop = new Map<string, Candidate>();
    for (let t = start, n = 0; t <= end && n < dayCap; t += DAY, n++) {
      const date = iso(t);
      for (const los of losList) {
        const usd = farePrice(from, to, date, los);
        const cand: Candidate = { from, to, date, los, usd, nonStop: nonStopAvailable && rng(`${from}${to}${date}`)() < 0.35 };
        const key = bucketKey(cand);
        if (!best.has(key) || usd < best.get(key)!.usd) best.set(key, cand);
        if (opts.returnLowestNonStopFare && nonStopAvailable) {
          const ns = { ...cand, usd: farePrice(from, to, date, los, true), nonStop: true };
          if (!bestNonStop.has(key) || ns.usd < bestNonStop.get(key)!.usd) bestNonStop.set(key, ns);
        }
      }
    }
    const results = [...best.values(), ...[...bestNonStop.entries()].filter(([k, ns]) => best.get(k)!.usd !== ns.usd && !best.get(k)!.nonStop).map(([, ns]) => ns)];
    for (const c of results) {
      const amount = fx(c.usd, currency);
      if (opts.budget && amount > opts.budget.maximumTotalFareAmount) continue;
      offers.push(buildSearchOffer(c, currency, amount, full, flights, journeys));
    }
  }

  offers.sort((a, b) => Number(a.totalPrice!.amount) - Number(b.totalPrice!.amount));
  return compactResponse({ timestamp: new Date().toISOString(), flights: full ? flights : undefined, journeys, offers });
}

function buildSearchOffer(
  c: { from: string; to: string; date: string; los?: number; nonStop: boolean; usd: number },
  currency: string,
  amount: number,
  full: boolean,
  flights: MosaicFlight[],
  journeys: MosaicJourney[],
): MosaicOffer {
  const seed = `${c.from}${c.to}${c.date}${c.los ?? 'ow'}${c.nonStop}`;
  const r = rng(seed);
  const carrier = pick(r, carriersFor(c.from, c.to));
  const origin = mainAirport(c.from)?.code ?? c.from;
  const destination = mainAirport(c.to)?.code ?? c.to;
  const legs: { from: string; to: string; date: string }[] = [{ from: origin, to: destination, date: c.date }];
  if (c.los !== undefined) legs.push({ from: destination, to: origin, date: iso(Date.parse(`${c.date}T00:00:00Z`) + c.los * DAY) });

  const journeyRefs: string[] = [];
  const segmentDetails: { flightRef: string; bookingClassCode: string; cabinName: 'Economy' }[][] = [];
  legs.forEach((leg, index) => {
    const id = uuid(`${seed}-j${index}`);
    journeyRefs.push(id);
    if (full) {
      const built = buildLeg(`${seed}-leg${index}`, leg.from, leg.to, leg.date, { carrier, nonStop: c.nonStop, departMinutes: 360 + Math.floor(r() * 900) });
      flights.push(...built.map(stripFlight));
      journeys.push({ id, flightRefs: built.map((f) => f.id), requestedJourneyIndex: index });
      segmentDetails.push(built.map((f) => ({ flightRef: f.id, bookingClassCode: pick(r, ['Q', 'V', 'S', 'O', 'L']), cabinName: 'Economy' })));
    } else {
      journeys.push({ id, originAirportCode: leg.from, destinationAirportCode: leg.to, departureDate: leg.date, requestedJourneyIndex: index });
    }
  });

  if (full) {
    const offerFlights = journeys.filter((j) => journeyRefs.includes(j.id)).flatMap((j) => j.flightRefs ?? []).map((id) => flights.find((f) => f.id === id)!);
    rememberPrice(flightsSignature(offerFlights), c.usd);
  }
  const total = money(amount, currency);
  const taxes = money(amount * 0.22, currency);
  const base = money(amount - Number(taxes), currency);
  const offerId = uuid(`${seed}-offer`);
  return {
    type: 'FlightOffer',
    id: offerId,
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 3600_000).toISOString(),
    source: { provider: 'Sabre', distributionModel: 'ATPCO' },
    totalPrice: { amount: total, currencyCode: currency },
    items: full
      ? [
          {
            type: 'FlightOfferItem',
            id: `${offerId}-1-1`,
            isMandatory: true,
            isPartial: false,
            fares: [
              {
                travelers: [{ passengerTypeCode: 'ADT', requestedTravelerIndex: 0 }],
                fareTotal: { equivalentFare: base, taxAmount: taxes, amount: total, currencyCode: currency },
                validatingAirlineCode: carrier.code,
                fareComponents: segmentDetails.map((segs, i) => ({
                  amount: money(Number(base) / segmentDetails.length, currency),
                  currencyCode: currency,
                  fareBasisCode: `${segs[0].bookingClassCode}${['LOW', 'SAV', 'BAS'][i % 3]}${c.los !== undefined ? 'RT' : 'OW'}`,
                  segmentDetails: segs,
                })),
              },
            ],
          },
        ]
      : undefined,
    journeyRefs,
    isNonStop: full ? undefined : c.nonStop,
  };
}

function compactResponse<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
