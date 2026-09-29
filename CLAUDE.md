# Galaxy Travel — OTA de demo para las APIs de shopping de Sabre

## Propósito
OTA de ejemplo (solo frontend, React) para presentar a clientes las APIs de **shopping inspiracional** de Sabre Mosaic. **Alcance actual: solo Flight Search y Flight Refresh.**
- **Flight Search**: open date, open destination/origin, calendario de tarifas y mapa.
- **Flight Refresh**: se prueba desde el mapa. Al tocar un pin se abre una tarjeta con la oferta en caché y el botón "Validar con Flight Refresh".
- La pantalla principal es solo la barra de búsqueda y el mapa, sin paneles laterales.
- Flight Shop, Flight Check y Flight Reshop se sacaron de la demo; el código quedó en el historial de git (commit `9e548b2`). Volver a sumarlos requiere consultarlo antes.

## Entorno: PROD, SOLO SHOPPING
- Se trabaja contra **PROD** (`https://api.platform.sabre.com`) porque la caché de CERT tiene muy pocos city pairs.
- En PROD **no se crean reservas, no se emiten tickets ni se modifican órdenes**. Está prohibido llamar a Booking Management (`/v1/trip/orders/*`), Order Management, ticketing o cualquier endpoint que escriba.
- Endpoints permitidos (el proxy `server/sabreProxy.ts` aplica esta allowlist; todo lo demás responde 403 sin llegar a Sabre):
  - `POST /v1/offers/flightSearch`
  - `POST /v1/offers/flightRefresh`
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
| Autocompletar aeropuertos | Geo Autocomplete v2 | `rest-api/geo-autocomplete/v2` | `specs/geo-autocomplete.yml` |

Los tipos de `src/api/types/*.ts` se generan con `npm run gen:types`; no se editan a mano (salvo `geo.ts`, que es Swagger 2.0).

### Reglas de Flight Refresh (fuente: https://developer.sabre.com/rest-api/flightrefresh-api/v1)
- **`pseudoCityCode` es obligatorio** ("required data elements (`passengerTypeCode` and `pseudoCityCode`)"). `buildRefreshRequests` falla antes de llamar si no hay PCC (`SABRE_REQUEST_PCC` o Ajustes). Flight Check sin PCC respondía HTTP 200 con solo `timestamp`, así que `useFlightRefresh` trata como error una respuesta sin itinerarios ni errores.
- **Las fechas tienen que coincidir.** La `departureDate` de cada `journeys[i]` del request tiene que ser la del primer vuelo de `itineraries[*].journeys[i]`. Si no, Sabre responde `Flight and requested journey departure dates must match.` Por eso los itinerarios se agrupan por ruta y fechas: un request por grupo, con hasta 100 itinerarios.
- Sin `bookingClassCode` por vuelo, solo se puede obtener `Any other` o `None`. Explorar pide `returnFullOffers: true` para que cada pin traiga vuelos y clase tarifaria.
- El mock (`src/mocks/engine/other.ts`) replica estas dos validaciones: si una falla en vivo, tiene que fallar también en los tests.

## Credenciales y datos sensibles
- El token va en `.env.local` como `SABRE_TOKEN` (sin prefijo `VITE_`, así nunca llega al bundle). Opcional: `SABRE_EPR`, `SABRE_PCC`, `SABRE_DOMAIN`, `SABRE_PASSWORD` para que el proxy genere el token solo.
- Nunca commitear `.env*` (salvo `.env.example`), tokens ni respuestas con datos personales.
- No loguear tokens, bodies de requests, PNR, números de ticket ni datos de pasajeros. El proxy solo loguea método, path, status y latencia.
- Las grabaciones (`SABRE_RECORD=1`) solo guardan Flight Search, Flight Refresh y Geo Autocomplete, y nunca incluirían Reshop si volviera.
- Cuidar el volumen de transacciones en PROD: búsquedas solo con acción explícita del usuario (nada de buscar mientras se escribe) y caché de TanStack Query.

## Stack y comandos
- Vite + React 19 + TypeScript, TanStack Router (estado en la URL) y TanStack Query, Tailwind v4, Radix UI, MapLibre GL, MSW (modo mock).
- `npm run dev` (live, usa `.env.local`), `npm run dev:mock`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run e2e`, `npm run smoke:live`.

## UI
- Diseño con la skill `.claude/skills/frontend-design`; auditoría con `/web-interface-guidelines <archivos>`.
- Textos de UI en español rioplatense neutro, sentence case (no Title Case), `Intl` para fechas y monedas.
