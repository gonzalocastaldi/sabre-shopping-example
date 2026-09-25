// Tipos de Geo Autocomplete v2 (Swagger 2.0, escrito a mano desde specs/geo-autocomplete.yml).
// https://developer.sabre.com/rest-api/geo-autocomplete/v2

export interface GeoAutocompleteDoc {
  name?: string;
  city?: string;
  country?: string;
  countryName?: string;
  stateName?: string;
  state?: string;
  category?: string;
  id?: string;
  dataset?: string;
  datasource?: string;
  confidenceFactor?: string;
  latitude?: string;
  longitude?: string;
  iataCityCode?: string;
  ranking?: number;
}

export interface GeoAutocompleteCategory {
  matches?: number;
  doclist?: { numFound?: number; start?: number; docs?: GeoAutocompleteDoc[] };
}

export interface GeoAutocompleteResponse {
  responseHeader?: { status?: number; QTime?: number };
  grouped?: Partial<Record<'category:AIR' | 'category:CITY' | 'category:RAIL' | 'category:POI' | 'categpry:LOCATION', GeoAutocompleteCategory>>;
}
