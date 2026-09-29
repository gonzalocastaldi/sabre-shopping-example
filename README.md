# Galaxy Travel: demo de shopping inspiracional con Sabre

OTA de ejemplo, solo frontend (React), para presentar las APIs de shopping inspiracional de **Sabre Mosaic**. Esta versión prueba **Flight Search** y **Flight Refresh**: la pantalla principal es la barra de búsqueda y el mapa, nada más.

| Dónde | API de Sabre | Qué muestra |
|---|---|---|
| Mapa (pines con precio) | **Flight Search** v1, `Per Date Range` con ofertas completas | Destino abierto ("a cualquier lugar", país, región ATPCO, temas), origen abierto, presupuesto y tarifa directa |
| Tarjeta del destino (al tocar un pin) | **Flight Search** + **Flight Refresh** v1 | Vuelos y clase tarifaria en caché. "Validar con Flight Refresh" confirma horario (OAG) y asientos por clase, sin reservar |
| Destino: franja de 12 meses | **Flight Search** v1, `Per Month` (solo precio) | El precio más bajo de cada mes |
| Destino: calendario | **Flight Search** v1, `Per Day` (ofertas completas) | Tarifa más baja por día de salida, con heatmap |
| Autocompletar | **Geo Autocomplete** v2 | Aeropuertos y ciudades mientras escribís |

> **Alcance: PROD, solo Flight Search y Flight Refresh.** No se crean reservas ni se emiten tickets. El proxy local responde 403 a cualquier otro endpoint, incluidos Shop, Check y Reshop (ver [`CLAUDE.md`](CLAUDE.md)).

**Flight Refresh necesita un PCC.** Cargalo en `SABRE_REQUEST_PCC` (`.env.local`) o en el panel de conexión. La app arma un request por ruta y fechas, porque Sabre exige que la fecha de cada journey coincida con la del primer vuelo de cada itinerario.

## Cómo correrlo

Requisitos: Node 22 o superior.

```bash
npm install
cp .env.example .env.local      # pegá tu token en SABRE_TOKEN=
npm run dev                     # http://localhost:5173
```

Cada búsqueda va del browser a `localhost:5173/api/sabre/...`. El proxy de Vite le agrega `Authorization: Bearer <SABRE_TOKEN>` y la reenvía a **`https://api.platform.sabre.com`**, así que la respuesta es la real de Sabre. El proxy existe por dos motivos:
- El token no queda en el JavaScript del browser.
- Las APIs de Sabre no están pensadas para llamarse desde el browser, así que CORS probablemente bloquearía la request.

El token dura 7 días. Si vence, la app lo avisa: actualizá `.env.local`, no hace falta reiniciar. Si completás `SABRE_EPR`, `SABRE_PCC` y `SABRE_PASSWORD`, el proxy genera un token nuevo solo (OAuth v2).

### Probar el token sin abrir la app

```bash
npm run smoke:live                 # opcional: SMOKE_ORIGIN=MVD npm run smoke:live
```

Le pega directo a Sabre con tu token y recorre:
1. Search (explorar, con ofertas completas).
2. Refresh del destino más barato, como el botón de la tarjeta.
3. Search (calendario).
4. Refresh en lote de varias fechas, un request por fecha.

Solo imprime estado, latencia y cantidad de resultados.

### Modo mock (sin red ni credenciales)

```bash
npm run dev:mock
```

También se cambia desde el indicador de conexión, en el header. Las respuestas se generan en el browser con MSW y respetan los schemas oficiales. El mock de Refresh aplica las mismas validaciones que Sabre (PCC obligatorio, fechas coincidentes), así un request mal armado falla también sin red. Sirve como plan B si falla la red en la presentación.

Con `SABRE_RECORD=1` en `.env.local`, el proxy guarda respuestas reales en `src/mocks/recorded/`, y el modo mock las reproduce cuando se repite el mismo request.

## API Inspector

El botón **API Inspector** del header muestra cada llamada a Sabre: API, endpoint, estado, latencia, request y respuesta en JSON, con enlace a la documentación en Developer Hub. Los enlaces con el ícono `</>` en cada pantalla abren el Inspector filtrado por la API que respondió ese bloque.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` / `dev:mock` | App en vivo (con `.env.local`) o con datos de ejemplo |
| `npm run build` | Build de producción |
| `npm run typecheck` / `lint` | TypeScript estricto y ESLint |
| `npm test` | Vitest: requests validados contra los specs oficiales con ajv, normalización, mocks y proxy (allowlist) |
| `npm run e2e` | Playwright en modo mock: buscar, tocar un pin, validar con Refresh, teclado, open origin, calendario y mobile |
| `npm run smoke:live` | Prueba en vivo contra Sabre con tu token |
| `npm run gen:types` | Regenera `src/api/types/` desde `specs/*.yml` |
| `npm run build:airports` | Regenera los aeropuertos desde OurAirports |

## Arquitectura

```
Browser (React)                     Vite dev server                       Sabre
─────────────────                   ───────────────                       ─────
fetch /api/sabre/v1/offers/…  ──►   server/sabreProxy.ts            ──►   api.platform.sabre.com
                                    · allowlist: flightSearch, flightRefresh, geo (403 al resto)
                                    · Bearer SABRE_TOKEN (.env.local)
modo mock: MSW intercepta las mismas URLs en el browser (src/mocks)
```

- `specs/`: specs oficiales (OpenAPI) bajados con el MCP de Sabre Developer Hub.
- `src/api/`: cliente, tipos generados, `normalize.ts` (resuelve el modelo Mosaic `offers → journeys → flights`), `mappers.ts` (arma cada request) y hooks de TanStack Query.
- `src/features/`: pantallas (`inspire`: barra y mapa; `map`: mapa y tarjeta del destino con Refresh; `calendar`; `devtools`: API Inspector y conexión).
- `src/ui/`: design system (ver [`docs/design-plan.md`](docs/design-plan.md)).
- Mapa: MapLibre GL con geografía de Natural Earth incluida en el repo, sin tiles externos (funciona offline).

## Presentación

Guion paso a paso con enlaces directos: [`docs/demo-script.md`](docs/demo-script.md).

## Datos y licencias

- Aeropuertos: [OurAirports](https://ourairports.com/data/) (dominio público).
- Países: [Natural Earth](https://www.naturalearthdata.com/) (dominio público).
- Tipografías: Barlow y Barlow Condensed (SIL Open Font License), autoalojadas vía Fontsource.
- Skills de Claude Code en `.claude/` (ver [`.claude/skills/README.md`](.claude/skills/README.md)).
