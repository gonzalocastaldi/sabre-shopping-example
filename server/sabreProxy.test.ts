import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { createSabreHandler, encodeV2Credentials, findAllowedRoute, type SabreEnv } from './sabreProxy';

function fakeReq(method: string, url: string, body?: unknown): IncomingMessage {
  const stream = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []) as unknown as IncomingMessage;
  stream.method = method;
  stream.url = url;
  return stream;
}

function fakeRes() {
  const headers: Record<string, string> = {};
  let body = '';
  const res = {
    statusCode: 200,
    setHeader: (k: string, v: string) => (headers[k.toLowerCase()] = v),
    end: (chunk?: string) => (body += chunk ?? ''),
  } as unknown as ServerResponse;
  return { res, headers, json: () => JSON.parse(body) };
}

const okFetch = () =>
  vi.fn(async () => new Response(JSON.stringify({ timestamp: 'x', offers: [] }), { status: 200, headers: { 'content-type': 'application/json' } }));

describe('allowlist', () => {
  it('permite solo endpoints de shopping', () => {
    expect(findAllowedRoute('POST', '/v1/offers/flightSearch')?.api).toBe('flightSearch');
    expect(findAllowedRoute('GET', '/v2/geo/autocomplete')?.api).toBe('geoAutocomplete');
    expect(findAllowedRoute('POST', '/v1/trip/orders/createBooking')).toBeUndefined();
    expect(findAllowedRoute('GET', '/v1/offers/flightSearch')).toBeUndefined();
  });

  it('bloquea createBooking con 403 sin llamar a Sabre', async () => {
    const fetchImpl = okFetch();
    const handler = createSabreHandler({ getEnv: () => ({ SABRE_TOKEN: 't' }), fetchImpl, log: () => {} });
    const { res, json } = fakeRes();
    await handler(fakeReq('POST', '/v1/trip/orders/createBooking', { any: 1 }), res);
    expect(res.statusCode).toBe(403);
    expect(json().errors[0].type).toBe('ENDPOINT_NOT_ALLOWED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('token', () => {
  it('codifica credenciales v2 como en la guía de Sabre', () => {
    // Ejemplo oficial: V1:username:group:domain / password
    expect(encodeV2Credentials('username', 'group', 'domain', 'password')).toBe('VmpFNmRYTmxjbTVoYldVNlozSnZkWEE2Wkc5dFlXbHU6Y0dGemMzZHZjbVE9');
  });

  it('usa SABRE_TOKEN como Bearer y reenvía a PROD', async () => {
    const fetchImpl = okFetch();
    const handler = createSabreHandler({ getEnv: () => ({ SABRE_TOKEN: 'Bearer T1RLAQ' }), fetchImpl, log: () => {} });
    const { res } = fakeRes();
    await handler(fakeReq('POST', '/v1/offers/flightSearch', { departureLocation: { locationType: 'Airport', locationCode: 'EZE' } }), res);
    expect(res.statusCode).toBe(200);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.platform.sabre.com/v1/offers/flightSearch');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer T1RLAQ');
  });

  it('sin token responde 401 con instrucciones', async () => {
    const fetchImpl = okFetch();
    const handler = createSabreHandler({ getEnv: () => ({}), fetchImpl, log: () => {} });
    const { res, json } = fakeRes();
    await handler(fakeReq('POST', '/v1/offers/flightShop', {}), res);
    expect(res.statusCode).toBe(401);
    expect(json().errors[0].description).toMatch(/SABRE_TOKEN/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('si Sabre responde 401 y hay EPR, genera un token nuevo y reintenta', async () => {
    const env: SabreEnv = { SABRE_TOKEN: 'viejo', SABRE_EPR: 'u', SABRE_PCC: 'ABCD', SABRE_PASSWORD: 'p' };
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith('/v2/auth/token')) return new Response(JSON.stringify({ access_token: 'nuevo', expires_in: 604800 }), { status: 200 });
      return new Response('{}', { status: fetchImpl.mock.calls.length === 1 ? 401 : 200 });
    });
    const handler = createSabreHandler({ getEnv: () => env, fetchImpl: fetchImpl as unknown as typeof fetch, log: () => {} });
    const { res } = fakeRes();
    await handler(fakeReq('POST', '/v1/offers/flightCheck', {}), res);
    expect(res.statusCode).toBe(200);
    const last = fetchImpl.mock.calls.at(-1) as unknown as [string, RequestInit];
    expect((last[1].headers as Record<string, string>).Authorization).toBe('Bearer nuevo');
  });
});
