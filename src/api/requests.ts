/**
 * Tipos de request. Search se tipa a mano (el discriminator de Location del spec genera
 * tipos poco útiles); el resto reutiliza los tipos generados desde specs/*.yml.
 * Los tests validan cada request armado contra el schema oficial con ajv.
 */
import type { components as SearchSpec } from './types/flightsearch';
import type { components as ShopSpec } from './types/flightshop';
import type { components as CheckSpec } from './types/flightcheck';
import type { components as RefreshSpec } from './types/flightrefresh';
import type { components as ReshopSpec } from './types/flightreshop';

export type ThemeCode = SearchSpec['schemas']['ThemeEnum'];
export type RegionCode = SearchSpec['schemas']['RegionEnum'];
export type ReturnMode = SearchSpec['schemas']['ReturnModeEnum'];

export type SearchLocation =
  | { locationType: 'Airport' | 'City' | 'Country'; locationCode: string }
  | { locationType: 'Region'; locationCode: RegionCode }
  | { locationType: 'Theme'; locationCode: ThemeCode }
  | { locationType: 'AirportList' | 'CityList' | 'CountryList'; locationCodes: string[] };

export interface SearchLocationFilter {
  locationFilter: 'Limit To' | 'Exclude';
  location: SearchLocation;
}

export interface FlightSearchRequest {
  departureLocation: SearchLocation;
  arrivalLocations?: SearchLocationFilter[];
  departureDateRange?: { fromDate: string; toDate?: string };
  lengthsOfStay?: number[];
  processingOptions?: {
    publicContentPointOfSaleCountry?: string;
    returnLowestNonStopFare?: boolean;
    returnMode?: ReturnMode;
    returnFullOffers?: boolean;
    returnOffersPerLengthOfStay?: boolean;
    returnVirtualInterlines?: boolean;
    budget?: { maximumTotalFareAmount: number; currencyCode: string };
  };
  sources?: SearchSpec['schemas']['SourcesFilter'];
  configuration?: { customerCode?: string };
}

export type FlightShopRequest = ShopSpec['schemas']['FlightShopRequest'];
export type FlightCheckPayloadRequest = CheckSpec['schemas']['FlightCheckPayloadRequest'];
export type FlightCheckOfferRequest = CheckSpec['schemas']['FlightCheckOfferRequest'];
export type FlightCheckRequest = FlightCheckPayloadRequest | FlightCheckOfferRequest;
export type FlightRefreshRequest = RefreshSpec['schemas']['FlightRefreshRequest'];
export type FlightReshopRequest = ReshopSpec['schemas']['FlightReshopRequest'];

export type PassengerTypeCode = 'ADT' | 'CNN' | 'INF';
