/**
 * Proxy de desarrollo hacia Sabre (plugin de Vite).
 *
 * El browser llama a `/api/sabre/<path>` y este middleware reenvía la request a
 * `SABRE_BASE_URL` (PROD por defecto) agregando `Authorization: Bearer <SABRE_TOKEN>`.
 * El token vive en `.env.local` sin prefijo VITE_, así nunca llega al bundle.
 *
 * Reglas del proyecto (ver CLAUDE.md): PROD, solo Flight Search y Flight Refresh (más Geo
 * Autocomplete para la barra). Todo lo que no esté en ALLOWED_ROUTES responde 403 sin llegar a Sabre.
 *
 * Docs:
 * - Token v2: https://developer.sabre.com/rest-api/oauth-token-create-rest-api/v2
 * - Credenciales: https://developer.sabre.com/guide/rest-apis-token-credentials/rest-apis-token-credentials.html
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv, type Plugin } from 'vite';
import { stableHash } from '../src/lib/stableHash.ts';

export interface AllowedRoute {
  method: 'GET' | 'POST';
  path: string;
  api: string;
  /** Si es false, nunca se graba la respuesta (puede traer PII). */
  recordable: boolean;
}

export const ALLOWED_ROUTES: readonly AllowedRoute[] = [
  { method: 'POST', path: '/v1/offers/flightSearch', api: 'flightSearch', recordable: true },
  { method: 'POST', path: '/v1/offers/flightRefresh', api: 'flightRefresh', recordable: true },
  { method: 'GET', path: '/v2/geo/autocomplete', api: 'geoAutocomplete', recordable: true },
];

export function findAllowedRoute(method: string | undefined, pathname: string): AllowedRoute | undefined {
  return ALLOWED_ROUTES.find((r) => r.method === method?.toUpperCase() && r.path === pathname);
}

export interface SabreEnv {
  SABRE_TOKEN?: string;
  SABRE_BASE_URL?: string;
  SABRE_EPR?: string;
  SABRE_PCC?: string;
  SABRE_DOMAIN?: string;
  SABRE_PASSWORD?: string;
  SABRE_REQUEST_PCC?: string;
  SABRE_RECORD?: string;
}

export interface SabreHandlerOptions {
  /** Se llama en cada request, así un token nuevo en .env.local se toma sin reiniciar. */
  getEnv: () => SabreEnv;
  fetchImpl?: typeof fetch;
  log?: (line: string) => void;
  recordDir?: string;
}

const DEFAULT_BASE_URL = 'https://api.platform.sabre.com';

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

/** Codificación v2 (doble Base64) según la guía "REST API Token Credentials". */
export function encodeV2Credentials(epr: string, pcc: string, domain: string, password: string): string {
  return b64(`${b64(`V1:${epr}:${pcc}:${domain}`)}:${b64(password)}`);
}

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function proxyError(res: ServerResponse, status: number, type: string, description: string) {
  sendJson(res, status, {
    timestamp: new Date().toISOString(),
    errors: [{ category: status === 403 ? 'FORBIDDEN' : 'PROXY', type, description }],
  });
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export function createSabreHandler(options: SabreHandlerOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const log = options.log ?? ((line: string) => console.log(line));
  let generated: { token: string; expiresAt: number } | undefined;

  const hasEpr = (env: SabreEnv) => Boolean(env.SABRE_EPR && env.SABRE_PCC && env.SABRE_PASSWORD);

  async function generateToken(env: SabreEnv): Promise<string> {
    const baseUrl = env.SABRE_BASE_URL || DEFAULT_BASE_URL;
    const res = await fetchImpl(`${baseUrl}/v2/auth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodeV2Credentials(env.SABRE_EPR!, env.SABRE_PCC!, env.SABRE_DOMAIN || 'AA', env.SABRE_PASSWORD!)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    log(`[sabre] POST /v2/auth/token → ${res.status}`);
    if (!res.ok) throw new Error(`No se pudo generar el token (HTTP ${res.status}). Revisá SABRE_EPR/PCC/DOMAIN/PASSWORD.`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    generated = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 600) * 1000 };
    return generated.token;
  }

  async function getToken(env: SabreEnv, forceNew = false): Promise<string | undefined> {
    if (!forceNew && env.SABRE_TOKEN) return env.SABRE_TOKEN.replace(/^Bearer\s+/i, '').trim();
    if (!hasEpr(env)) return undefined;
    if (!forceNew && generated && generated.expiresAt > Date.now()) return generated.token;
    return generateToken(env);
  }

  async function record(route: AllowedRoute, requestBody: unknown, query: string, responseBody: string, env: SabreEnv) {
    if (env.SABRE_RECORD !== '1' || !route.recordable || !options.recordDir) return;
    const key = stableHash(route.method === 'GET' ? query : requestBody);
    const file = path.join(options.recordDir, `${route.api}-${key}.json`);
    await mkdir(options.recordDir, { recursive: true });
    await writeFile(
      file,
      JSON.stringify({ api: route.api, key, recordedAt: new Date().toISOString(), request: requestBody ?? query, response: JSON.parse(responseBody) }),
    );
    log(`[sabre] grabado ${path.relative(process.cwd(), file)}`);
  }

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    const env = options.getEnv();
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/_meta') {
      const tokenSource = env.SABRE_TOKEN ? 'env' : hasEpr(env) ? 'epr' : 'none';
      sendJson(res, 200, {
        baseUrl: env.SABRE_BASE_URL || DEFAULT_BASE_URL,
        tokenSource,
        pcc: env.SABRE_REQUEST_PCC || env.SABRE_PCC || null,
        recording: env.SABRE_RECORD === '1',
        allowedRoutes: ALLOWED_ROUTES.map(({ method, path: p, api }) => ({ method, path: p, api })),
      });
      return;
    }

    const route = findAllowedRoute(req.method, url.pathname);
    if (!route) {
      log(`[sabre] BLOQUEADO ${req.method} ${url.pathname} (fuera de la allowlist)`);
      proxyError(
        res,
        403,
        'ENDPOINT_NOT_ALLOWED',
        `${req.method} ${url.pathname} no está permitido: esta demo solo usa Flight Search y Flight Refresh (ver CLAUDE.md).`,
      );
      return;
    }

    const rawBody = req.method === 'POST' ? await readBody(req) : '';
    let parsedBody: unknown;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
    } catch {
      proxyError(res, 400, 'INVALID_JSON', 'El body del request no es JSON válido.');
      return;
    }

    const baseUrl = env.SABRE_BASE_URL || DEFAULT_BASE_URL;
    const target = `${baseUrl}${url.pathname}${url.search}`;

    const send = async (token: string) =>
      fetchImpl(target, {
        method: route.method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(route.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: route.method === 'POST' ? rawBody : undefined,
      });

    const started = Date.now();
    try {
      let token = await getToken(env);
      if (!token) {
        proxyError(res, 401, 'MISSING_TOKEN', 'Falta SABRE_TOKEN en .env.local. Copiá .env.example, pegá tu token y recargá.');
        return;
      }
      let upstream = await send(token);
      if (upstream.status === 401 && hasEpr(env)) {
        token = await getToken(env, true);
        if (token) upstream = await send(token);
      }
      const text = await upstream.text();
      const latency = Date.now() - started;
      log(`[sabre] ${route.method} ${url.pathname} → ${upstream.status} (${latency} ms)`);

      if (upstream.status === 401) {
        proxyError(
          res,
          401,
          'TOKEN_EXPIRED_OR_INVALID',
          'Sabre rechazó el token (vencido o inválido). Actualizá SABRE_TOKEN en .env.local; no hace falta reiniciar.',
        );
        return;
      }

      if (upstream.ok) await record(route, parsedBody, url.search, text, env).catch(() => undefined);

      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
      res.setHeader('x-sabre-latency-ms', String(latency));
      res.end(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`[sabre] ${route.method} ${url.pathname} → error de red: ${message}`);
      proxyError(res, 502, 'UPSTREAM_UNREACHABLE', `No se pudo contactar a Sabre (${baseUrl}): ${message}`);
    }
  };
}

/** Plugin de Vite: monta el proxy en `/api/sabre` para `vite` y `vite preview`. */
export function sabreProxyPlugin(): Plugin {
  let root = process.cwd();
  let mode = 'development';
  const make = () =>
    createSabreHandler({
      getEnv: () => ({ ...loadEnv(mode, root, 'SABRE_'), ...pickSabreEnv(process.env) }),
      recordDir: path.join(root, 'src/mocks/recorded'),
    });

  return {
    name: 'sabre-proxy',
    configResolved(config) {
      root = config.root;
      mode = config.mode;
    },
    configureServer(server) {
      const handler = make();
      server.middlewares.use('/api/sabre', (req, res) => void handler(req, res));
    },
    configurePreviewServer(server) {
      const handler = make();
      server.middlewares.use('/api/sabre', (req, res) => void handler(req, res));
    },
  };
}

function pickSabreEnv(source: NodeJS.ProcessEnv): SabreEnv {
  return Object.fromEntries(Object.entries(source).filter(([k, v]) => k.startsWith('SABRE_') && v)) as SabreEnv;
}
