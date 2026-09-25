/**
 * Modelo de respuesta Mosaic compartido por Flight Search, Shop, Check y Reshop.
 *
 * Es un superset "relajado" de los schemas de specs/*.yml: todos los campos opcionales
 * salvo los ids, para que la normalización tolere las variantes entre APIs (por ejemplo,
 * Search en modo "solo precio" devuelve journeys sin flightRefs).
 * El contrato exacto de cada request se valida en los tests contra los specs oficiales.
 */

export type CabinName =
  | 'Premium First'
  | 'First'
  | 'Premium Business'
  | 'Business'
  | 'Premium Economy'
  | 'Economy'
  | 'Unknown';

export interface MosaicError {
  category?: string;
  type?: string;
  description?: string;
  fieldName?: string;
  fieldPath?: string;
  fieldValue?: string;
}

export interface HiddenStop {
  airportCode: string;
  arrivalDate?: string;
  arrivalTime?: string;
  departureDate?: string;
  departureTime?: string;
  durationInMinutes?: number;
}

export interface MosaicFlight {
  id: string;
  departureAirportCode: string;
  departureDate: string;
  departureTime: string;
  arrivalAirportCode: string;
  arrivalDate: string;
  arrivalTime: string;
  operatingAirlineCode?: string;
  operatingFlightNumber?: number;
  marketingAirlineCode: string;
  marketingFlightNumber: number;
  disclosureAirlineCode?: string;
  aircraftTypeCode?: string;
  durationInMinutes?: number;
  hiddenStops?: HiddenStop[];
  isMarriedWithPreviousFlight?: boolean;
}

export interface MosaicJourney {
  id: string;
  requestedJourneyIndex?: number;
  flightRefs?: string[];
  /** Search (solo precio) */
  originAirportCode?: string;
  destinationAirportCode?: string;
  departureDate?: string;
  /** Reshop */
  departureAirportCode?: string;
  arrivalAirportCode?: string;
  durationInMinutes?: number;
}

export interface Amounts {
  equivalentFare?: string;
  taxAmount?: string;
  amount?: string;
  currencyCode?: string;
}

export interface SegmentDetail {
  flightRef: string;
  bookingClassCode?: string;
  cabinName?: CabinName;
  checkedBaggageRef?: string;
  carryOnBaggageRef?: string;
  carbonEmissionsInGramsPerPassenger?: number;
  availabilityBreak?: boolean;
  isAvailabilityBreak?: boolean;
}

export interface FareBrand {
  code?: string;
  name?: string;
  programId?: number | string;
}

export interface FareComponent {
  amount?: string;
  currencyCode?: string;
  publishedAmount?: string;
  publishedCurrencyCode?: string;
  fareBasisCode?: string;
  accountCode?: string;
  segmentDetails?: SegmentDetail[];
  brand?: FareBrand;
  refundabilityRef?: string;
  changeRef?: string;
}

export interface ReturnedTraveler {
  id?: string;
  passengerTypeCode: string;
  requestedTravelerIndex?: number;
  ticketNumber?: string;
  givenName?: string;
  surname?: string;
}

/** Diferencia de precio de Reshop (ExchangeCharge). */
export interface ExchangeCharge {
  type?: string;
  baseFare?: string;
  totalTax?: string;
  subtotalBeforeFee?: string;
  grandTotal?: string;
  currencyCode?: string;
  totalTaxOnFee?: string;
  taxes?: { taxCode?: string; amount?: string; currencyCode?: string }[];
  totalFee?: { fees?: { amount: string; currencyCode: string }[] };
}

export interface FareDetail {
  travelers: ReturnedTraveler[];
  fareTotal?: Amounts;
  priceDifference?: ExchangeCharge;
  privateFare?: string;
  validatingAirlineCode?: string;
  fareComponents?: FareComponent[];
  taxItemRefs?: string[];
  refundabilityRef?: string;
  changeRef?: string;
}

export interface OfferItem {
  type?: string;
  id: string;
  isMandatory?: boolean;
  isPartial?: boolean;
  fares?: FareDetail[];
  offerRefs?: string[];
}

export interface OfferSource {
  provider?: string;
  supplier?: string;
  distributionModel?: string;
  commercialModel?: string;
}

export interface MosaicOffer {
  type?: string;
  id: string;
  createdAt?: string;
  validUntil?: string;
  source?: OfferSource;
  totalPrice?: { amount: string; currencyCode: string };
  /** Reshop */
  totalPriceDifference?: ExchangeCharge;
  isSellable?: boolean;
  items?: OfferItem[];
  paymentTimeLimit?: string;
  applicableToPseudoCityCodes?: string[];
  journeyRefs?: string[];
  isNonStop?: boolean;
  refundabilityRef?: string;
  changeRef?: string;
  additionalOffersRefs?: string[];
}

export interface FlexibilityRule {
  isPermitted: boolean;
  maxCharge?: string;
  minCharge?: string;
  currencyCode?: string;
}

export interface RefundChangeCharges {
  id: string;
  beforeDeparture?: FlexibilityRule;
  afterDeparture?: FlexibilityRule;
}

export interface BagDefinition {
  weightInKilograms?: number;
  weightInPounds?: number;
  description?: string[];
}

export interface Baggage {
  id: string;
  allowances?: {
    numberOfPieces?: number;
    bagDefinition?: BagDefinition;
    maximumWeightInKilograms?: number;
    airlineCode?: string;
  }[];
  charges?: {
    firstPiece?: number;
    lastPiece?: number;
    amount?: string;
    currencyCode?: string;
    airlineCode?: string;
  }[];
}

export interface OfferAttributes {
  checkedBaggageItems?: Baggage[];
  carryOnBaggageItems?: Baggage[];
  refundabilityItems?: RefundChangeCharges[];
  changeItems?: RefundChangeCharges[];
}

export interface TaxItem {
  id: string;
  taxCode: string;
  amount: string;
  currencyCode: string;
  taxDescription?: string;
  airportCode?: string;
  taxCountry?: string;
}

export type BookingClassCodeValidation = 'Matched' | 'Same cabin' | 'Any other' | 'None' | 'Unknown';

/** Respuesta genérica Mosaic (Search, Shop, Check, Reshop). */
export interface MosaicResponse {
  timestamp?: string;
  flights?: MosaicFlight[];
  journeys?: MosaicJourney[];
  offers?: MosaicOffer[];
  taxItems?: TaxItem[];
  offerAttributes?: OfferAttributes;
  offerValidationResults?: { bookingClassCodeValidation?: BookingClassCodeValidation; offerRef?: string }[];
  numberOfOffers?: number;
  errors?: MosaicError[];
  warnings?: MosaicError[];
}

/** Flight Refresh v1 */
export interface FlightRefreshResponse {
  timestamp: string;
  errors?: MosaicError[];
  itineraries?: {
    requestedItineraryIndex: number;
    isItineraryValid: boolean;
    bookingClassCodeValidation?: BookingClassCodeValidation;
    cabinAvailability?: {
      journeys: { flights: { cabinName: CabinName; bookingClassCodes: { bookingClassCode: string; seatsAvailable: number }[] }[] }[];
    };
  }[];
}
