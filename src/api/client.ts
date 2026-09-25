/**
 * Cliente HTTP hacia el proxy local `/api/sabre/*`.
 * En modo live el proxy de Vite reenvía a Sabre PROD con el token de .env.local;
 * en modo mock MSW intercepta las mismas URLs. El código de la app no cambia.
 */
import { recordCall, updateCall } from './inspector';
import type { MosaicError } from './mosaic';

export type ApiName = 'flightSearch' | 'flightRefresh' | 'flightShop' | 'flightCheck' | 'flightReshop' | 'geoAutocomplete';

export interface ApiMeta {
  label: string;
  method: 'GET' | 'POST';
  path: string;
  docUrl: string;
  /** Para qué se usa en la demo; se muestra en el API Inspector. */
  role: string;
}

export const API_META: Record<ApiName, ApiMeta> = {
  flightSearch: {
    label: 'Flight Search',
    method: 'POST',
    path: '/v1/offers/flightSearch',
    docUrl: 'https://developer.sabre.com/rest-api/flightsearch-api/v1',
    role: 'Inspiración desde la caché: destinos abiertos, fechas flexibles y calendario.',
  },
  flightRefresh: {
    label: 'Flight Refresh',
    method: 'POST',
    path: '/v1/offers/flightRefresh',
    docUrl: 'https://developer.sabre.com/rest-api/flightrefresh-api/v1',
    role: 'Valida en lote ofertas cacheadas contra el inventario (horario y clase).',
  },
  flightShop: {
    label: 'Flight Shop',
    method: 'POST',
    path: '/v1/offers/flightShop',
    docUrl: 'https://developer.sabre.com/rest-api/flightshop-api/v1',
    role: 'Shopping en vivo multi-fuente (ATPCO, NDC, LCC) para fechas concretas.',
  },
  flightCheck: {
    label: 'Flight Check',
    method: 'POST',
    path: '/v1/offers/flightCheck',
    docUrl: 'https://developer.sabre.com/rest-api/flightcheck-api/v1',
    role: 'Revalida precio y disponibilidad de la oferta elegida, con reglas y upsell.',
  },
  flightReshop: {
    label: 'Flight Reshop',
    method: 'POST',
    path: '/v1/offers/flightReshop',
    docUrl: 'https://developer.sabre.com/rest-api/flight-reshop-api/1.0',
    role: 'Busca opciones de cambio para un ticket o reserva existente (sin ejecutarlas).',
  },
  geoAutocomplete: {
    label: 'Geo Autocomplete',
    method: 'GET',
    path: '/v2/geo/autocomplete',
    docUrl: 'https://developer.sabre.com/rest-api/geo-autocomplete/v2',
    role: 'Autocompleta aeropuertos y ciudades mientras escribís.',
  },
};

export const PROXY_PREFIX = '/api/sabre';

export class SabreApiError extends Error {
  readonly status: number;
  readonly errors: MosaicError[];
  readonly api: ApiName;

  constructor(api: ApiName, status: number, errors: MosaicError[]) {
    super(errors[0]?.description || errors[0]?.type || `Error ${status} en ${API_META[api].label}`);
    this.name = 'SabreApiError';
    this.api = api;
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  query?: Record<string, string | number | undefined>;
  /** Nunca mostrar el body completo en el Inspector (por ejemplo, Reshop con datos de ticket). */
  sensitive?: boolean;
}

export async function sabreRequest<TResponse>(api: ApiName, body?: unknown, options: RequestOptions = {}): Promise<TResponse> {
  const meta = API_META[api];
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(options.query ?? {})) if (v !== undefined && v !== '') search.set(k, String(v));
  const url = `${PROXY_PREFIX}${meta.path}${search.size ? `?${search}` : ''}`;

  const callId = recordCall({ api, method: meta.method, url: `${meta.path}${search.size ? `?${search}` : ''}`, request: body, sensitive: options.sensitive });
  const started = performance.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: meta.method,
      headers: meta.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: meta.method === 'POST' ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    updateCall(callId, { status: aborted ? 'cancelled' : 'network-error', durationMs: performance.now() - started });
    throw error;
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { errors: [{ category: 'INVALID_RESPONSE', type: 'NOT_JSON', description: text.slice(0, 200) }] };
  }

  const durationMs = performance.now() - started;
  const upstreamLatency = Number(res.headers.get('x-sabre-latency-ms')) || undefined;
  updateCall(callId, { status: res.status, durationMs, upstreamLatencyMs: upstreamLatency, response: data });

  const errors = (data as { errors?: MosaicError[] }).errors ?? [];
  if (!res.ok) throw new SabreApiError(api, res.status, errors.length ? errors : [{ description: `HTTP ${res.status}` }]);
  if (errors.length && !hasPayload(data)) throw new SabreApiError(api, res.status, errors);
  return data as TResponse;
}

function hasPayload(data: unknown): boolean {
  const d = data as Record<string, unknown[] | undefined>;
  return Boolean(d.offers?.length || d.itineraries?.length || d.flights?.length);
}

/** Mensaje de error en lenguaje de usuario, con qué hacer. */
export function describeError(error: unknown): { title: string; detail: string } {
  if (error instanceof SabreApiError) {
    const first = error.errors[0];
    if (error.status === 401) return { title: 'El token de Sabre no es válido', detail: first?.description ?? 'Actualizá SABRE_TOKEN en .env.local.' };
    if (error.status === 403) return { title: 'Endpoint bloqueado por el proxy', detail: first?.description ?? 'Solo se permiten APIs de shopping.' };
    if (error.status === 502) return { title: 'No se pudo contactar a Sabre', detail: first?.description ?? 'Revisá tu conexión o pasá a modo mock.' };
    return {
      title: `${API_META[error.api].label} devolvió un error`,
      detail:
        [first?.description ?? first?.type, first?.fieldPath && `Campo: ${first.fieldPath}.`].filter(Boolean).join(' ') ||
        'Probá cambiar los filtros.',
    };
  }
  if (error instanceof Error) return { title: 'Algo falló en la búsqueda', detail: error.message };
  return { title: 'Algo falló en la búsqueda', detail: String(error) };
}
