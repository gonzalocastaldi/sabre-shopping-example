# Galaxy Travel — OTA de demo para las APIs de shopping de Sabre

## Propósito
OTA de ejemplo (solo frontend, React) para presentar a clientes las APIs de **shopping inspiracional** de Sabre Mosaic: Flight Search, Flight Refresh, Flight Shop, Flight Check y Flight Reshop. El foco es **Flight Search**: open date, open destination/origin, calendario de tarifas y mapa.

## Entorno: PROD, SOLO SHOPPING
- Se trabaja contra **PROD** (`https://api.platform.sabre.com`) porque la caché de CERT tiene muy pocos city pairs.
- En PROD **no se crean reservas, no se emiten tickets ni se modifican órdenes**. Está prohibido llamar a Booking Management (`/v1/trip/orders/*`), Order Management, ticketing o cualquier endpoint que escriba.
- Endpoints permitidos (el proxy `server/sabreProxy.ts` aplica esta allowlist; todo lo demás responde 403 sin llegar a Sabre):
  - `POST /v1/offers/flightSearch`
  - `POST /v1/offers/flightRefresh`
  - `POST /v1/offers/flightShop`
  - `POST /v1/offers/flightCheck`
  - `POST /v1/offers/flightReshop`
  - `GET /v2/geo/autocomplete`
  - `POST /v2/auth/token` (solo desde el proxy, para generar el token)
- Si una tarea requiere un endpoint fuera de esta lista, frená y consultá antes de agregarlo.

## Fuente de verdad: MCP de Sabre Developer Hub
Antes de implementar, modificar o depurar cualquier integración con Sabre, consultá el MCP de Developer Hub (`https://developer.mcp.sabre.com/mcp`). No te bases en la memoria para endpoints, versiones, schemas, headers ni códigos de error.

Flujo recomendado:
1. `look_for_named_sabre_documentation` → buscar la API por nombre.
2. `look_for_artifact_content` → buscar por concepto, campo o código de error.
3. `get_artifact_details` → listar las páginas de la doc.
4. `get_documentation_page` → leer la página concreta.
5. `get_spec_file` → bajar el spec y actualizar `specs/*.yml`; después correr `npm run gen:types`.
6. `get_latest_updated_documentation` → revisar cambios antes de subir de versión.

Citá la doc usada en PRs y comentarios relevantes (`https://developer.sabre.com/<artifact-uri>`). Si el MCP no está disponible, avisá antes de adivinar el contrato.

## APIs del proyecto

| Paso | API | Artifact URI | Spec local |
|---|---|---|---|
| Token (solo proxy) | OAuth Token Create v2 | `rest-api/oauth-token-create-rest-api/v2` | — |
| Inspiración (mapa, destinos, calendario) | Flight Search v1 | `rest-api/flightsearch-api/v1` | `specs/flightsearch.yml` |
| Validar ofertas cacheadas (batch ≤ 100) | Flight Refresh v1 | `rest-api/flightrefresh-api/v1` | `specs/flightrefresh.yml` |
| Shopping en vivo | Flight Shop v1 (spec 1.5) | `rest-api/flightshop-api/v1` | `specs/flightshop.yml` |
| Revalidar la oferta elegida | Flight Check v1 | `rest-api/flightcheck-api/v1` | `specs/flightcheck.yml` |
| Cambios sobre PNR/ticket existente (solo búsqueda) | Flight Reshop 1.0 (spec 1.1, beta) | `rest-api/flight-reshop-api/1.0` | `specs/flightreshop.yml` |
| Autocompletar aeropuertos | Geo Autocomplete v2 | `rest-api/geo-autocomplete/v2` | `specs/geo-autocomplete.yml` |

Los tipos de `src/api/types/*.ts` se generan con `npm run gen:types`; no se editan a mano (salvo `geo.ts`, que es Swagger 2.0).

## Credenciales y datos sensibles
- El token va en `.env.local` como `SABRE_TOKEN` (sin prefijo `VITE_`, así nunca llega al bundle). Opcional: `SABRE_EPR`, `SABRE_PCC`, `SABRE_DOMAIN`, `SABRE_PASSWORD` para que el proxy genere el token solo.
- Nunca commitear `.env*` (salvo `.env.example`), tokens ni respuestas con datos personales.
- No loguear tokens, bodies de requests, PNR, números de ticket ni datos de pasajeros. El proxy solo loguea método, path, status y latencia.
- Las grabaciones (`SABRE_RECORD=1`) nunca incluyen Reshop.
- Cuidar el volumen de transacciones en PROD: búsquedas solo con acción explícita del usuario (nada de buscar mientras se escribe) y caché de TanStack Query.

## Stack y comandos
- Vite + React 19 + TypeScript, TanStack Router (estado en la URL) y TanStack Query, Tailwind v4, Radix UI, MapLibre GL, MSW (modo mock).
- `npm run dev` (live, usa `.env.local`), `npm run dev:mock`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run e2e`, `npm run smoke:live`.

## UI
- Diseño con la skill `.claude/skills/frontend-design`; auditoría con `/web-interface-guidelines <archivos>`.
- Textos de UI en español rioplatense neutro, sentence case (no Title Case), `Intl` para fechas y monedas.
