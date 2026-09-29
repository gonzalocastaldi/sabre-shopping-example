/**
 * Normaliza el modelo de referencias de Mosaic (offers → journeyRefs → journeys →
 * flightRefs → flights; fareComponents.segmentDetails.flightRef → RBD/cabina/brand)
 * a view models planos para la UI (mapa, calendario y tarjeta del destino).
 */
import type {
  BookingClassCodeValidation,
  CabinName,
  ExchangeCharge,
  MosaicFlight,
  MosaicOffer,
  MosaicResponse,
  SegmentDetail,
} from './mosaic';

export interface Segment {
  flightId: string;
  from: string;
  to: string;
  departDate: string;
  departTime: string;
  arriveDate: string;
  arriveTime: string;
  marketingAirline: string;
  marketingNumber: number;
  operatingAirline?: string;
  aircraft?: string;
  durationMin?: number;
  hiddenStops: string[];
  bookingClass?: string;
  cabin?: CabinName;
  brandName?: string;
  brandCode?: string;
  fareBasis?: string;
  co2Grams?: number;
  checkedBaggageRef?: string;
  carryOnBaggageRef?: string;
  isMarriedWithPrevious?: boolean;
}

export interface Leg {
  journeyId: string;
  index: number;
  from: string;
  to: string;
  departDate: string;
  departTime?: string;
  arriveDate?: string;
  arriveTime?: string;
  segments: Segment[];
  stops: number;
  durationMin?: number;
}

export interface TravelerPrice {
  ptc: string;
  count: number;
  total?: number;
  base?: number;
  taxes?: number;
  currency?: string;
}

export interface TripOffer {
  id: string;
  offerItemIds: string[];
  provider?: string;
  distributionModel?: string;
  price?: { amount: number; currency: string };
  priceDifference?: ExchangeCharge;
  travelers: TravelerPrice[];
  legs: Leg[];
  isNonStop: boolean;
  /** Search sin returnFullOffers: no hay vuelos, solo precio y ruta. */
  priceOnly: boolean;
  validatingAirline?: string;
  airlines: string[];
  brandNames: string[];
  validUntil?: string;
  paymentTimeLimit?: string;
  lengthOfStay?: number;
  refundabilityRef?: string;
  changeRef?: string;
  additionalOfferIds: string[];
  validation?: BookingClassCodeValidation;
  co2Grams?: number;
  taxItemRefs: string[];
}

const toNumber = (v?: string | number) => (v === undefined || v === null || v === '' ? undefined : Number(v));

const minutesOf = (date: string, time: string) => {
  const [h, m] = time.split(':').map(Number);
  return Date.parse(`${date}T00:00:00Z`) / 60000 + h * 60 + m;
};

export function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000);
}

function legDuration(segments: Segment[]): number | undefined {
  if (!segments.length || segments.some((s) => s.durationMin === undefined)) return undefined;
  let total = 0;
  segments.forEach((s, i) => {
    total += s.durationMin ?? 0;
    const next = segments[i + 1];
    // Las conexiones son en el mismo aeropuerto (misma zona horaria): la resta de horas locales es válida.
    if (next) total += Math.max(0, minutesOf(next.departDate, next.departTime) - minutesOf(s.arriveDate, s.arriveTime));
  });
  return total;
}

export function normalizeOffers(res: MosaicResponse): TripOffer[] {
  const flights = new Map((res.flights ?? []).map((f) => [f.id, f]));
  const journeys = new Map((res.journeys ?? []).map((j) => [j.id, j]));
  const validations = new Map((res.offerValidationResults ?? []).map((v) => [v.offerRef, v.bookingClassCodeValidation]));

  return (res.offers ?? []).map((offer) => normalizeOffer(offer, flights, journeys, validations));
}

function normalizeOffer(
  offer: MosaicOffer,
  flights: Map<string, MosaicFlight>,
  journeys: Map<string, NonNullable<MosaicResponse['journeys']>[number]>,
  validations: Map<string | undefined, BookingClassCodeValidation | undefined>,
): TripOffer {
  const items = offer.items ?? [];
  const fares = items.flatMap((i) => i.fares ?? []);

  // Detalle por segmento desde los fare components (tomamos el primer tipo de pasajero).
  const segmentInfo = new Map<string, SegmentDetail & { brandName?: string; brandCode?: string; fareBasis?: string }>();
  for (const fc of fares[0]?.fareComponents ?? []) {
    for (const sd of fc.segmentDetails ?? []) {
      segmentInfo.set(sd.flightRef, { ...sd, brandName: fc.brand?.name, brandCode: fc.brand?.code, fareBasis: fc.fareBasisCode });
    }
  }

  const legs: Leg[] = (offer.journeyRefs ?? []).map((ref, index) => {
    const j = journeys.get(ref);
    const segments: Segment[] = (j?.flightRefs ?? [])
      .map((id) => flights.get(id))
      .filter((f): f is MosaicFlight => Boolean(f))
      .map((f) => {
        const info = segmentInfo.get(f.id);
        return {
          flightId: f.id,
          from: f.departureAirportCode,
          to: f.arrivalAirportCode,
          departDate: f.departureDate,
          departTime: f.departureTime,
          arriveDate: f.arrivalDate,
          arriveTime: f.arrivalTime,
          marketingAirline: f.marketingAirlineCode,
          marketingNumber: f.marketingFlightNumber,
          operatingAirline: f.operatingAirlineCode,
          aircraft: f.aircraftTypeCode,
          durationMin: f.durationInMinutes,
          hiddenStops: (f.hiddenStops ?? []).map((h) => h.airportCode),
          bookingClass: info?.bookingClassCode,
          cabin: info?.cabinName,
          brandName: info?.brandName,
          brandCode: info?.brandCode,
          fareBasis: info?.fareBasis,
          co2Grams: info?.carbonEmissionsInGramsPerPassenger,
          checkedBaggageRef: info?.checkedBaggageRef,
          carryOnBaggageRef: info?.carryOnBaggageRef,
          isMarriedWithPrevious: f.isMarriedWithPreviousFlight,
        };
      });

    const first = segments[0];
    const last = segments[segments.length - 1];
    const hidden = segments.reduce((n, s) => n + s.hiddenStops.length, 0);
    return {
      journeyId: ref,
      index: j?.requestedJourneyIndex ?? index,
      from: first?.from ?? j?.originAirportCode ?? j?.departureAirportCode ?? '',
      to: last?.to ?? j?.destinationAirportCode ?? j?.arrivalAirportCode ?? '',
      departDate: first?.departDate ?? j?.departureDate ?? '',
      departTime: first?.departTime,
      arriveDate: last?.arriveDate,
      arriveTime: last?.arriveTime,
      segments,
      stops: segments.length ? segments.length - 1 + hidden : 0,
      durationMin: legDuration(segments) ?? j?.durationInMinutes,
    };
  });

  const priceOnly = legs.every((l) => l.segments.length === 0);
  const airlines = Array.from(new Set(legs.flatMap((l) => l.segments.map((s) => s.marketingAirline))));
  const brandNames = Array.from(new Set(legs.flatMap((l) => l.segments.map((s) => s.brandName).filter((b): b is string => Boolean(b)))));
  const co2 = legs.flatMap((l) => l.segments.map((s) => s.co2Grams));

  const travelers: TravelerPrice[] = fares.map((f) => ({
    ptc: f.travelers[0]?.passengerTypeCode ?? 'ADT',
    count: f.travelers.length,
    total: toNumber(f.fareTotal?.amount),
    base: toNumber(f.fareTotal?.equivalentFare),
    taxes: toNumber(f.fareTotal?.taxAmount),
    currency: f.fareTotal?.currencyCode,
  }));

  const outbound = legs[0];
  const inbound = legs[legs.length - 1];

  return {
    id: offer.id,
    offerItemIds: items.map((i) => i.id),
    provider: offer.source?.provider,
    distributionModel: offer.source?.distributionModel,
    price: offer.totalPrice ? { amount: Number(offer.totalPrice.amount), currency: offer.totalPrice.currencyCode } : undefined,
    priceDifference: offer.totalPriceDifference,
    travelers,
    legs,
    isNonStop: offer.isNonStop ?? (!priceOnly && legs.every((l) => l.stops === 0)),
    priceOnly,
    validatingAirline: fares[0]?.validatingAirlineCode,
    airlines,
    brandNames,
    validUntil: offer.validUntil,
    paymentTimeLimit: offer.paymentTimeLimit,
    lengthOfStay: legs.length > 1 && outbound?.departDate && inbound?.departDate ? daysBetween(outbound.departDate, inbound.departDate) : undefined,
    refundabilityRef: offer.refundabilityRef ?? fares[0]?.refundabilityRef,
    changeRef: offer.changeRef ?? fares[0]?.changeRef,
    additionalOfferIds: offer.additionalOffersRefs ?? [],
    validation: validations.get(offer.id),
    co2Grams: co2.length && co2.every((c) => c !== undefined) ? co2.reduce((a, b) => a! + b!, 0) : undefined,
    taxItemRefs: Array.from(new Set(fares.flatMap((f) => f.taxItemRefs ?? []))),
  };
}

// ---------- Agregaciones para Flight Search ----------

export interface DestinationSummary {
  code: string;
  origin: string;
  cheapest: TripOffer;
  cheapestNonStop?: TripOffer;
  offers: TripOffer[];
}

/** Agrupa por destino (open destination) u origen (open origin) y queda con el más barato. */
export function summarizeByPlace(offers: TripOffer[], by: 'destination' | 'origin'): DestinationSummary[] {
  const groups = new Map<string, TripOffer[]>();
  for (const o of offers) {
    const leg = o.legs[0];
    if (!leg || !o.price) continue;
    const key = by === 'destination' ? leg.to : leg.from;
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  return Array.from(groups, ([code, list]) => {
    const sorted = [...list].sort((a, b) => a.price!.amount - b.price!.amount);
    return {
      code,
      origin: by === 'destination' ? sorted[0].legs[0].from : sorted[0].legs[0].to,
      cheapest: sorted[0],
      cheapestNonStop: sorted.find((o) => o.isNonStop),
      offers: sorted,
    };
  }).sort((a, b) => a.cheapest.price!.amount - b.cheapest.price!.amount);
}

export interface CalendarDay {
  date: string;
  cheapest: TripOffer;
  cheapestNonStop?: TripOffer;
}

/** Precio más bajo por fecha de salida (para una duración de estadía dada, si se indica). */
export function buildFareCalendar(offers: TripOffer[], lengthOfStay?: number): Map<string, CalendarDay> {
  const days = new Map<string, CalendarDay>();
  for (const o of offers) {
    if (!o.price) continue;
    if (lengthOfStay !== undefined && o.lengthOfStay !== undefined && o.lengthOfStay !== lengthOfStay) continue;
    const date = o.legs[0]?.departDate;
    if (!date) continue;
    const current = days.get(date);
    const cheapest = !current || o.price.amount < current.cheapest.price!.amount ? o : current.cheapest;
    const nonStopCandidate = o.isNonStop ? o : undefined;
    const cheapestNonStop =
      nonStopCandidate && (!current?.cheapestNonStop || nonStopCandidate.price!.amount < current.cheapestNonStop.price!.amount)
        ? nonStopCandidate
        : current?.cheapestNonStop;
    days.set(date, { date, cheapest, cheapestNonStop });
  }
  return days;
}
