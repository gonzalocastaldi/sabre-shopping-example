/**
 * Mocks de Flight Shop v1 y Flight Check v1.
 * Shop genera itinerarios variados (directos y con escala, distintas aerolíneas y horarios),
 * brands (upsell), equipaje, reglas de cambio/reembolso, impuestos y CO₂.
 * Check revalida con el mismo modelo de precio, con pequeñas diferencias verosímiles.
 */
import type { FlightCheckRequest, FlightShopRequest } from '@/api/requests';
import type { Baggage, MosaicFlight, MosaicJourney, MosaicOffer, MosaicResponse, OfferAttributes, RefundChangeCharges, TaxItem } from '@/api/mosaic';
import { buildLeg, carriersFor, farePrice, flightsSignature, fx, hasNonStop, mainAirport, money, pick, recallPrice, rememberPrice, rng, routeDistance, stripFlight, uuid, type BuiltFlight, type Carrier } from './core';

type PTC = 'ADT' | 'CNN' | 'INF';
const PTC_FACTOR: Record<PTC, number> = { ADT: 1, CNN: 0.75, INF: 0.12 };

interface Brand {
  code: string;
  name: string;
  factor: number;
  checkedBags: number;
  refund: 'none' | 'fee' | 'free';
  change: 'fee' | 'free';
}

const BRANDS: Brand[] = [
  { code: 'LIGHT', name: 'Light', factor: 1, checkedBags: 0, refund: 'none', change: 'fee' },
  { code: 'CLASSIC', name: 'Classic', factor: 1.18, checkedBags: 1, refund: 'fee', change: 'fee' },
  { code: 'FLEX', name: 'Flex', factor: 1.46, checkedBags: 2, refund: 'free', change: 'free' },
];

/** Atributos compartidos (ids UUID, como exige el spec). */
function sharedAttributes(currency: string): { attrs: OfferAttributes; ids: Record<string, string> } {
  const ids = {
    bag0: uuid('bag0'),
    bag1: uuid('bag1'),
    bag2: uuid('bag2'),
    carry: uuid('carry'),
    refundNone: uuid('refund-none'),
    refundFee: uuid('refund-fee'),
    refundFree: uuid('refund-free'),
    changeFee: uuid('change-fee'),
    changeFree: uuid('change-free'),
  };
  const bag = (id: string, pieces: number): Baggage => ({
    id,
    allowances: [{ numberOfPieces: pieces, bagDefinition: { weightInKilograms: 23, weightInPounds: 50, description: ['UP TO 50 POUNDS/23 KILOGRAMS'] } }],
    charges: pieces === 0 ? [{ firstPiece: 1, lastPiece: 1, amount: money(fx(60, currency), currency), currencyCode: currency }] : undefined,
  });
  const rule = (id: string, permitted: boolean, charge: number): RefundChangeCharges => ({
    id,
    beforeDeparture: { isPermitted: permitted, ...(permitted ? { maxCharge: money(fx(charge, currency), currency), minCharge: money(fx(charge, currency), currency), currencyCode: currency } : {}) },
    afterDeparture: { isPermitted: permitted && charge === 0, ...(permitted && charge === 0 ? { maxCharge: '0', minCharge: '0', currencyCode: currency } : {}) },
  });
  return {
    ids,
    attrs: {
      checkedBaggageItems: [bag(ids.bag0, 0), bag(ids.bag1, 1), bag(ids.bag2, 2)],
      carryOnBaggageItems: [{ id: ids.carry, allowances: [{ numberOfPieces: 1, bagDefinition: { weightInKilograms: 8, description: ['CARRY ON UP TO 8 KG'] } }] }],
      refundabilityItems: [rule(ids.refundNone, false, 0), rule(ids.refundFee, true, 150), rule(ids.refundFree, true, 0)],
      changeItems: [rule(ids.changeFee, true, 90), rule(ids.changeFree, true, 0)],
    },
  };
}

/** Memoria de ofertas generadas, para que Check por offerItemIds encuentre la oferta de Shop. */
const offerMemory = new Map<string, { flights: MosaicFlight[]; journeys: MosaicJourney[]; offer: MosaicOffer }>();

interface Option {
  carrier: Carrier;
  nonStop: boolean;
  legs: BuiltFlight[][];
  usd: number;
  distributionModel: 'ATPCO' | 'NDC' | 'API';
}

function travelersOf(req: { travelers?: { passengerTypeCode: string }[] }): PTC[] {
  const list = (req.travelers ?? [{ passengerTypeCode: 'ADT' }]).map((t) => (t.passengerTypeCode as PTC) ?? 'ADT');
  return list.length ? list : ['ADT'];
}

function taxItemsFor(from: string, to: string, currency: string, perAdultUsd: number): TaxItem[] {
  const origin = mainAirport(from);
  const dest = mainAirport(to);
  return [
    { id: uuid(`tax-a${from}`), taxCode: 'TQ', amount: money(fx(perAdultUsd * 0.09, currency), currency), currencyCode: currency, taxDescription: 'TASA DE SEGURIDAD AEROPORTUARIA', airportCode: origin?.code, taxCountry: origin?.country },
    { id: uuid(`tax-b${to}`), taxCode: 'QO', amount: money(fx(perAdultUsd * 0.07, currency), currency), currencyCode: currency, taxDescription: 'TASA DE USO DE AEROPUERTO', airportCode: dest?.code, taxCountry: dest?.country },
    { id: uuid(`tax-c${from}${to}`), taxCode: 'YQ', amount: money(fx(perAdultUsd * 0.06, currency), currency), currencyCode: currency, taxDescription: 'RECARGO DEL TRANSPORTADOR' },
  ];
}

function buildOffer(
  seed: string,
  option: Option,
  brand: Brand,
  travelers: PTC[],
  currency: string,
  ids: Record<string, string>,
  taxes: TaxItem[],
  journeyIds: string[],
  rbd: string,
): MosaicOffer {
  const offerId = uuid(`${seed}-${brand.code}`);
  const byType = new Map<PTC, number>();
  travelers.forEach((t) => byType.set(t, (byType.get(t) ?? 0) + 1));
  let total = 0;
  let index = 0;
  const fares = Array.from(byType, ([ptc, count]) => {
    const perPax = fx(option.usd * brand.factor * PTC_FACTOR[ptc], currency);
    const tax = ptc === 'INF' ? perPax * 0.1 : perPax * 0.22;
    total += perPax * count;
    const travelerRefs = Array.from({ length: count }, () => ({ passengerTypeCode: ptc, requestedTravelerIndex: index++ }));
    return {
      travelers: travelerRefs,
      fareTotal: { equivalentFare: money(perPax - tax, currency), taxAmount: money(tax, currency), amount: money(perPax, currency), currencyCode: currency },
      validatingAirlineCode: option.carrier.code,
      fareComponents: option.legs.map((flights, legIndex) => ({
        amount: money((perPax - tax) / option.legs.length, currency),
        currencyCode: currency,
        fareBasisCode: `${rbd}${brand.code.slice(0, 2)}${legIndex ? 'RT' : 'OW'}${option.carrier.code}`,
        brand: { code: brand.code, name: brand.name, programId: 370000 + BRANDS.indexOf(brand) },
        segmentDetails: flights.map((f) => ({
          flightRef: f.id,
          bookingClassCode: brand.code === 'LIGHT' ? rbd : brand.code === 'CLASSIC' ? 'M' : 'B',
          cabinName: 'Economy' as const,
          checkedBaggageRef: [ids.bag0, ids.bag1, ids.bag2][brand.checkedBags],
          carryOnBaggageRef: ids.carry,
          carbonEmissionsInGramsPerPassenger: Math.round(f.distanceKm * 88),
        })),
      })),
      taxItemRefs: ptc === 'INF' ? [] : taxes.map((t) => t.id),
      refundabilityRef: brand.refund === 'none' ? ids.refundNone : brand.refund === 'fee' ? ids.refundFee : ids.refundFree,
      changeRef: brand.change === 'fee' ? ids.changeFee : ids.changeFree,
    };
  });

  return {
    type: 'FlightOffer',
    id: offerId,
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
    source: { provider: 'Sabre', distributionModel: option.distributionModel, ...(option.distributionModel === 'NDC' ? { commercialModel: 'Connect' } : {}) },
    totalPrice: { amount: money(total, currency), currencyCode: currency },
    items: [{ type: 'FlightOfferItem', id: `${offerId}-1-1`, isMandatory: true, isPartial: false, fares }],
    paymentTimeLimit: new Date(Date.now() + 24 * 3600_000).toISOString(),
    journeyRefs: journeyIds,
    refundabilityRef: fares[0].refundabilityRef,
    changeRef: fares[0].changeRef,
  };
}

type Loc = { cityCode?: string; airportCode?: string };
const codeOf = (l: Loc) => l.airportCode ?? l.cityCode ?? '';

export function mockFlightShop(req: FlightShopRequest): MosaicResponse {
  const journeysReq = req.journeys.map((j) => ({ from: codeOf(j.departureLocation as Loc), to: codeOf(j.arrivalLocation as Loc), date: j.departureDate }));
  const [out, back] = journeysReq;
  const lengthOfStay = back ? Math.round((Date.parse(back.date) - Date.parse(out.date)) / 86400000) : undefined;
  const currency = req.fare?.currencyCode ?? 'USD';
  const travelers = travelersOf(req);
  const maxStops = req.route?.maximumNumberOfStops;
  const additional = req.retailing?.returnAdditionalOffers?.numberOfAdditionalOffers ?? 0;
  const { attrs, ids } = sharedAttributes(currency);

  const baseUsd = farePrice(out.from, out.to, out.date, lengthOfStay);
  const nonStopRoute = hasNonStop(out.from, out.to);
  const carriers = carriersFor(out.from, out.to);
  const seedBase = `${out.from}${out.to}${out.date}${back?.date ?? ''}`;
  const r = rng(seedBase);

  const options: Option[] = [];
  const departures = [375, 480, 610, 745, 890, 1030, 1215, 1320];
  for (let i = 0; i < 18; i++) {
    const carrier = carriers[i % carriers.length];
    const nonStop = nonStopRoute && (i % 3 === 0 || maxStops === 0);
    if (maxStops === 0 && !nonStop) continue;
    const legs = journeysReq.map((j, legIndex) =>
      buildLeg(`${seedBase}-${i}-${legIndex}`, j.from, j.to, j.date, { carrier, nonStop, departMinutes: departures[(i + legIndex * 3) % departures.length] + Math.floor(r() * 25) }),
    );
    const usd = baseUsd * (0.96 + r() * 0.42) * (nonStop ? 1.12 : 1);
    const distributionModel = carrier.lcc ? 'API' : carrier.ndc && r() < 0.45 ? 'NDC' : 'ATPCO';
    rememberPrice(flightsSignature(legs.flat()), usd);
    options.push({ carrier, nonStop, legs, usd, distributionModel });
  }

  const flights: MosaicFlight[] = [];
  const journeys: MosaicJourney[] = [];
  const offers: MosaicOffer[] = [];
  const taxes = taxItemsFor(out.from, out.to, currency, baseUsd);

  options.forEach((option, i) => {
    const journeyIds = option.legs.map((legFlights, legIndex) => {
      const id = uuid(`${seedBase}-${i}-j${legIndex}`);
      flights.push(...legFlights.map(stripFlight));
      journeys.push({ id, flightRefs: legFlights.map((f) => f.id), requestedJourneyIndex: legIndex });
      return id;
    });
    const rbd = pick(r, ['Q', 'V', 'S', 'O', 'L', 'K']);
    const seed = `${seedBase}-${i}`;
    const main = buildOffer(seed, option, BRANDS[0], travelers, currency, ids, taxes, journeyIds, rbd);
    const upsells = option.carrier.lcc ? [] : BRANDS.slice(1, 1 + additional).map((b) => buildOffer(seed, option, b, travelers, currency, ids, taxes, journeyIds, rbd));
    main.additionalOffersRefs = upsells.length ? upsells.map((u) => u.id) : undefined;
    offers.push(main, ...upsells);
  });

  const response: MosaicResponse = {
    timestamp: new Date().toISOString(),
    flights,
    journeys,
    taxItems: taxes,
    offers,
    offerAttributes: attrs,
  };
  for (const offer of offers) {
    const js = journeys.filter((j) => offer.journeyRefs?.includes(j.id));
    const fl = flights.filter((f) => js.some((j) => j.flightRefs?.includes(f.id)));
    for (const item of offer.items ?? []) offerMemory.set(item.id, { flights: fl, journeys: js, offer });
  }
  return JSON.parse(JSON.stringify(response));
}

export function mockFlightCheck(req: FlightCheckRequest): MosaicResponse {
  const currency = req.fare?.currencyCode ?? 'USD';
  const travelers = travelersOf(req as { travelers?: { passengerTypeCode: string }[] });
  const { attrs, ids } = sharedAttributes(currency);

  // Por offerItemIds (NDC): recuperamos la oferta de Shop y aplicamos una leve variación.
  if ('offerItemIds' in req && req.offerItemIds?.length) {
    const found = offerMemory.get(req.offerItemIds[0]);
    if (!found) {
      return { timestamp: new Date().toISOString(), errors: [{ category: 'NOT_FOUND', type: 'OFFER_ITEM_NOT_FOUND', description: 'La oferta expiró o no existe. Volvé a buscar.' }] };
    }
    const offer = structuredClone(found.offer);
    offer.id = uuid(`check-${offer.id}`);
    offer.validUntil = new Date(Date.now() + 20 * 60_000).toISOString();
    return {
      timestamp: new Date().toISOString(),
      warnings: [{ category: 'NDC_WARNING', type: 'EXTERNAL_PROVIDER_WARNING', description: 'El precio puede variar según el medio de pago.' }],
      flights: found.flights,
      journeys: found.journeys,
      taxItems: taxItemsFor(found.flights[0].departureAirportCode, found.flights.at(-1)!.arrivalAirportCode, currency, Number(offer.totalPrice!.amount)),
      offers: [offer],
      offerAttributes: attrs,
      offerValidationResults: [{ bookingClassCodeValidation: 'Matched', offerRef: offer.id }],
    };
  }

  // Por payload (ATPCO): reconstruimos los vuelos del request.
  const payload = req as Extract<FlightCheckRequest, { journeys: unknown }>;
  const seed = JSON.stringify(payload.journeys);
  const r = rng(seed);
  const flights: BuiltFlight[] = [];
  const journeys: MosaicJourney[] = [];
  payload.journeys.forEach((j, legIndex) => {
    const legFlights = j.flights.map((f, i) => ({
      id: uuid(`${seed}-${legIndex}-${i}`),
      departureAirportCode: f.departureAirportCode,
      departureDate: f.departureDate,
      departureTime: f.departureTime,
      arrivalAirportCode: f.arrivalAirportCode,
      arrivalDate: f.arrivalDate,
      arrivalTime: f.arrivalTime,
      operatingAirlineCode: f.marketingAirlineCode,
      operatingFlightNumber: f.marketingFlightNumber,
      marketingAirlineCode: f.marketingAirlineCode,
      marketingFlightNumber: f.marketingFlightNumber,
      durationInMinutes: Math.round(35 + routeDistance(f.departureAirportCode, f.arrivalAirportCode) / 13.5),
      distanceKm: routeDistance(f.departureAirportCode, f.arrivalAirportCode),
    })) as BuiltFlight[];
    flights.push(...legFlights);
    journeys.push({ id: uuid(`${seed}-j${legIndex}`), flightRefs: legFlights.map((f) => f.id), requestedJourneyIndex: legIndex });
  });

  const first = payload.journeys[0].flights[0];
  const lastOut = payload.journeys[0].flights.at(-1)!;
  const back = payload.journeys[1]?.flights[0];
  const los = back ? Math.round((Date.parse(back.departureDate) - Date.parse(first.departureDate)) / 86400000) : undefined;
  // Precio base: el que se mostró en Search/Shop para estos mismos vuelos (si está en memoria).
  const allFlights = payload.journeys.flatMap((j) => j.flights);
  const lightUsd = recallPrice(flightsSignature(allFlights)) ?? farePrice(first.departureAirportCode, lastOut.arrivalAirportCode, first.departureDate, los);
  const rbd = first.segmentDetails?.bookingClassCode ?? 'Q';
  const requested = rbd === 'B' ? BRANDS[2] : rbd === 'M' ? BRANDS[1] : BRANDS[0];
  const roll = r();
  const validation = roll < 0.8 ? 'Matched' : roll < 0.96 ? 'Same cabin' : 'Any other';
  // Revalidar casi nunca da exacto: ±1,5% si hay lugar; +5 a +10% si cambió la clase.
  const drift = validation === 'Matched' ? 1 + (r() - 0.5) * 0.03 : 1.05 + r() * 0.05;
  const carrier = { code: first.marketingAirlineCode, hub: '' };
  const option: Option = { carrier, nonStop: payload.journeys.every((j) => j.flights.length === 1), legs: [], usd: lightUsd * drift, distributionModel: 'ATPCO' };
  let fi = 0;
  option.legs = payload.journeys.map((j) => j.flights.map(() => flights[fi++]));
  const taxes = taxItemsFor(first.departureAirportCode, lastOut.arrivalAirportCode, currency, lightUsd);
  const journeyIds = journeys.map((j) => j.id);
  const lightRbd = requested === BRANDS[0] ? rbd : 'Q';
  const main = buildOffer(`check${seed}`, option, requested, travelers, currency, ids, taxes, journeyIds, validation === 'Matched' ? lightRbd : 'K');
  const upsells = BRANDS.filter((b) => b !== requested).map((b) => buildOffer(`check${seed}`, option, b, travelers, currency, ids, taxes, journeyIds, lightRbd));
  main.additionalOffersRefs = upsells.map((u) => u.id);
  const ordered = [main, ...upsells];

  return JSON.parse(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      flights: flights.map(stripFlight),
      journeys,
      taxItems: taxes,
      offers: ordered,
      offerAttributes: attrs,
      offerValidationResults: [{ bookingClassCodeValidation: validation, offerRef: main.id }, ...upsells.map((u) => ({ bookingClassCodeValidation: 'Matched', offerRef: u.id }))],
    }),
  );
}
