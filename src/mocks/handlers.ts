/**
 * Handlers de MSW para el modo mock. Interceptan las mismas URLs que el proxy real
 * (`/api/sabre/...`), así la app no distingue entre live y mock.
 * Si existe una grabación real (SABRE_RECORD=1) para el mismo request, se reproduce esa.
 */
import { delay, http, HttpResponse, type JsonBodyType } from 'msw';
import { stableHash } from '@/lib/stableHash';
import type { FlightRefreshRequest, FlightSearchRequest } from '@/api/requests';
import { mockFlightSearch } from './engine/search';
import { mockFlightRefresh, mockGeoAutocomplete } from './engine/other';

const recordings = import.meta.glob<{ response: unknown }>('./recorded/*.json', { import: 'default' });

async function recorded(api: string, key: unknown): Promise<unknown | undefined> {
  const loader = recordings[`./recorded/${api}-${stableHash(key)}.json`];
  return loader ? (await loader()).response : undefined;
}

const latency = (min: number, max: number) => delay(min + Math.random() * (max - min));
const json = (body: unknown, latencyMs: number) => HttpResponse.json(body as JsonBodyType, { headers: { 'x-sabre-latency-ms': String(Math.round(latencyMs)) } });

function handler<TReq>(api: string, path: string, generate: (req: TReq) => unknown, range: [number, number]) {
  return http.post(`/api/sabre${path}`, async ({ request }) => {
    const started = performance.now();
    const body = (await request.json()) as TReq;
    const replay = await recorded(api, body);
    await latency(...range);
    return json(replay ?? generate(body), performance.now() - started);
  });
}

export const handlers = [
  http.get('/api/sabre/_meta', () =>
    // El PCC del mock habilita Flight Refresh, que exige pseudoCityCode.
    HttpResponse.json({ baseUrl: 'mock', tokenSource: 'mock', pcc: 'MOCK', recording: false, allowedRoutes: [] }),
  ),
  handler<FlightSearchRequest>('flightSearch', '/v1/offers/flightSearch', mockFlightSearch, [250, 650]),
  handler<FlightRefreshRequest>('flightRefresh', '/v1/offers/flightRefresh', mockFlightRefresh, [300, 700]),
  http.get('/api/sabre/v2/geo/autocomplete', async ({ request }) => {
    const url = new URL(request.url);
    const replay = await recorded('geoAutocomplete', url.search);
    await latency(80, 200);
    return json(replay ?? mockGeoAutocomplete(url.searchParams.get('query') ?? '', url.searchParams.get('category') ?? undefined, Number(url.searchParams.get('limit') ?? 8)), 120);
  }),
  // Cualquier otra ruta de Sabre: mismo comportamiento que el proxy real (allowlist).
  http.all('/api/sabre/*', ({ request }) =>
    HttpResponse.json(
      { errors: [{ category: 'FORBIDDEN', type: 'ENDPOINT_NOT_ALLOWED', description: `${request.method} ${new URL(request.url).pathname.replace('/api/sabre', '')} no está permitido: esta demo solo usa Flight Search y Flight Refresh.` }] },
      { status: 403 },
    ),
  ),
];
