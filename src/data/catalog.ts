/**
 * Catálogos de Flight Search (enums del spec) con etiquetas en español.
 * Las listas de aeropuertos/países por tema y región SOLO se usan en el modo mock;
 * en vivo, Sabre resuelve cada tema/región con sus propias tablas.
 * Spec: https://developer.sabre.com/rest-api/flightsearch-api/v1 (ThemeEnum, RegionEnum)
 */
import type { RegionCode, ThemeCode } from '@/api/requests';

export interface ThemeInfo {
  code: ThemeCode;
  label: string;
  hint: string;
  mockAirports: string[];
}

export const THEMES: ThemeInfo[] = [
  { code: 'Beach', label: 'Playa', hint: 'Mar caliente y arena', mockAirports: ['CUN', 'PUJ', 'MIA', 'HNL', 'FLN', 'SSA', 'NAT', 'MCZ', 'IBZ', 'PMI', 'MLE', 'DPS', 'HKT', 'CTG', 'SJU', 'MBJ', 'AUA', 'CUR', 'GIG', 'PDP', 'OGG', 'SMR', 'PVR'] },
  { code: 'Caribbean', label: 'Caribe', hint: 'Islas y aguas turquesa', mockAirports: ['PUJ', 'SDQ', 'SJU', 'MBJ', 'NAS', 'AUA', 'CUR', 'BGI', 'UVF', 'ANU', 'SXM', 'HAV', 'POS', 'GCM', 'PLS', 'CUN', 'ADZ'] },
  { code: 'Disney', label: 'Disney', hint: 'Parques de Disney en el mundo', mockAirports: ['MCO', 'SNA', 'CDG', 'NRT', 'HND', 'HKG', 'PVG'] },
  { code: 'Gambling', label: 'Casinos', hint: 'Noches largas y luces', mockAirports: ['LAS', 'MFM', 'RNO', 'ACY', 'PDP', 'SXM'] },
  { code: 'Historic', label: 'Historia', hint: 'Ciudades con siglos encima', mockAirports: ['FCO', 'ATH', 'IST', 'CAI', 'CUZ', 'TLV', 'PRG', 'BUD', 'VIE', 'KRK', 'LIS', 'MEX', 'AMM', 'SVQ', 'EDI'] },
  { code: 'Mountains', label: 'Montaña', hint: 'Cumbres, lagos y aire frío', mockAirports: ['BRC', 'MDZ', 'DEN', 'ZRH', 'GVA', 'INN', 'KTM', 'SLC', 'YYC', 'USH', 'CPO', 'JUJ'] },
  { code: 'National Parks', label: 'Parques nacionales', hint: 'Naturaleza protegida', mockAirports: ['JAC', 'BZN', 'FAT', 'FCA', 'IGR', 'FTE', 'GPS', 'MQP', 'ANC', 'SJO', 'LIR'] },
  { code: 'Outdoors', label: 'Aire libre', hint: 'Trekking, kayak y rutas', mockAirports: ['BRC', 'FTE', 'USH', 'ANC', 'BZN', 'DEN', 'ZQN', 'KEF', 'CUZ', 'SJO', 'LIR', 'PMC'] },
  { code: 'Romantic', label: 'Escapada romántica', hint: 'Viajes de a dos', mockAirports: ['CDG', 'VCE', 'FCO', 'JTR', 'PPT', 'MLE', 'DPS', 'CUN', 'BRC', 'PUJ', 'PRG', 'NCE'] },
  { code: 'Shopping', label: 'Compras', hint: 'Outlets y grandes tiendas', mockAirports: ['MIA', 'JFK', 'DXB', 'LHR', 'CDG', 'HKG', 'SIN', 'BKK', 'IST', 'MXP', 'NRT', 'LAS', 'MCO'] },
  { code: 'Skiing', label: 'Esquí', hint: 'Nieve y pistas', mockAirports: ['BRC', 'ASE', 'DEN', 'EGE', 'SLC', 'ZRH', 'GVA', 'INN', 'SCL', 'USH', 'YVR', 'CPO', 'MDZ'] },
  { code: 'Theme Park', label: 'Parques temáticos', hint: 'Montañas rusas y familia', mockAirports: ['MCO', 'LAX', 'TPA', 'CDG', 'NRT', 'HKG', 'SIN', 'PVG', 'BCN'] },
];

export interface RegionInfo {
  code: RegionCode;
  label: string;
  mockCountries: string[];
}

/** Zonas ATPCO (APPENDIX C). */
export const REGIONS: RegionInfo[] = [
  { code: '170-South America', label: 'Sudamérica', mockCountries: ['AR', 'BR', 'CL', 'UY', 'PY', 'BO', 'PE', 'EC', 'CO', 'VE'] },
  { code: '140-Caribbean area', label: 'Caribe', mockCountries: ['DO', 'CU', 'JM', 'PR', 'BS', 'AW', 'CW', 'BB', 'TT', 'LC', 'AG', 'KY', 'TC', 'SX'] },
  { code: '160-Central America', label: 'Centroamérica', mockCountries: ['CR', 'PA', 'GT', 'SV', 'HN', 'NI', 'BZ'] },
  { code: '9-Mexico', label: 'México', mockCountries: ['MX'] },
  { code: '0-North America', label: 'Norteamérica', mockCountries: ['US', 'CA', 'MX'] },
  { code: '2-Canada', label: 'Canadá', mockCountries: ['CA'] },
  { code: '210-Europe', label: 'Europa', mockCountries: ['ES', 'PT', 'FR', 'IT', 'DE', 'GB', 'NL', 'BE', 'CH', 'AT', 'GR', 'IE', 'CZ', 'PL', 'HU', 'HR', 'SE', 'NO', 'DK', 'FI'] },
  { code: '211-Iberian Peninsula', label: 'Península Ibérica', mockCountries: ['ES', 'PT'] },
  { code: '212-Scandinavia', label: 'Escandinavia', mockCountries: ['SE', 'NO', 'DK', 'FI', 'IS'] },
  { code: '220-Middle East', label: 'Medio Oriente', mockCountries: ['AE', 'QA', 'SA', 'OM', 'BH', 'KW', 'JO', 'IL', 'EG'] },
  { code: '230-Africa', label: 'África', mockCountries: ['ZA', 'KE', 'TZ', 'MA', 'EG', 'NG', 'GH', 'ET', 'SN', 'MU'] },
  { code: '232-Southern Africa', label: 'África austral', mockCountries: ['ZA', 'NA', 'BW', 'ZW', 'MZ', 'ZM'] },
  { code: '310-Japan and Koreas', label: 'Japón y Corea', mockCountries: ['JP', 'KR'] },
  { code: '320-Southeast Asia', label: 'Sudeste asiático', mockCountries: ['TH', 'VN', 'MY', 'SG', 'ID', 'PH', 'KH', 'CN', 'HK', 'TW'] },
  { code: '330-Southeast Asian subcontinent', label: 'India y alrededores', mockCountries: ['IN', 'LK', 'NP', 'MV', 'BD'] },
  { code: '340-Southwest Pacific', label: 'Oceanía', mockCountries: ['AU', 'NZ', 'FJ', 'PF', 'NC'] },
];

export const THEME_BY_CODE = Object.fromEntries(THEMES.map((t) => [t.code, t])) as Record<ThemeCode, ThemeInfo>;
export const REGION_BY_CODE = Object.fromEntries(REGIONS.map((r) => [r.code, r])) as Partial<Record<RegionCode, RegionInfo>>;

/** Destinos "a cualquier lugar" del modo mock: unión de temas + hubs. */
export const MOCK_ANYWHERE = Array.from(
  new Set([
    ...THEMES.flatMap((t) => t.mockAirports),
    'EZE', 'AEP', 'MVD', 'SCL', 'LIM', 'BOG', 'MDE', 'GRU', 'GIG', 'ASU', 'VVI', 'UIO', 'PTY', 'MEX', 'GDL', 'MTY',
    'ATL', 'ORD', 'DFW', 'LAX', 'SFO', 'SEA', 'BOS', 'IAD', 'YYZ', 'YUL', 'MAD', 'BCN', 'LIS', 'OPO', 'AMS', 'FRA',
    'MUC', 'BER', 'CPH', 'DUB', 'MAN', 'NAP', 'SYD', 'MEL', 'AKL', 'JNB', 'CPT', 'NBO', 'DOH', 'AUH', 'DEL', 'BOM',
    'ICN', 'KUL', 'MNL', 'TPE',
  ]),
);

export const PASSENGER_TYPES = [
  { code: 'ADT', label: 'Adultos', hint: '12 años o más' },
  { code: 'CNN', label: 'Niños', hint: 'De 2 a 11 años' },
  { code: 'INF', label: 'Bebés', hint: 'Menos de 2 años, en brazos' },
] as const;

export const CABINS = [
  { code: 'Economy', label: 'Económica' },
  { code: 'Premium Economy', label: 'Premium economy' },
  { code: 'Business', label: 'Business' },
  { code: 'First', label: 'Primera' },
] as const;
