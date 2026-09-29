/**
 * Tipos de request. Search se tipa a mano (el discriminator de Location del spec genera
 * tipos poco útiles); Refresh reutiliza el tipo generado desde specs/flightrefresh.yml.
 * Los tests validan cada request armado contra el schema oficial con ajv.
 */
import type { components as SearchSpec } from './types/flightsearch';
import type { components as RefreshSpec } from './types/flightrefresh';

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

export type FlightRefreshRequest = RefreshSpec['schemas']['FlightRefreshRequest'];

export type PassengerTypeCode = 'ADT' | 'CNN' | 'INF';
