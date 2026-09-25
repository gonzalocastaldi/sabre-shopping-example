# Galaxy Travel: demo de shopping inspiracional con Sabre

OTA de ejemplo, solo frontend (React), para presentar las APIs de shopping de **Sabre Mosaic**:

| Pantalla | API de Sabre | Qué muestra |
|---|---|---|
| Explorar (mapa y lista) | **Flight Search** v1, `Per Date Range` | Destino abierto ("a cualquier lugar", país, región ATPCO, temas), origen abierto, presupuesto y tarifa directa |
| Destino: franja de 12 meses | **Flight Search** v1, `Per Month` (solo precio) | El precio más bajo de cada mes |
| Destino: calendario | **Flight Search** v1, `Per Day` (ofertas completas) | Tarifa más baja por día de salida, con heatmap |
| Destino: "Validar disponibilidad" | **Flight Refresh** v1 | Validación en lote de las 10 fechas más baratas contra el inventario |
| Vuelos | **Flight Shop** v1 | Shopping en vivo multi-fuente (ATPCO, NDC, low cost), brands, equipaje, CO₂ |
| Revisión | **Flight Check** v1 | Revalida precio y clase (por payload o por `offerItemIds`), con upsell y reglas |
| Cambiar un viaje | **Flight Reshop** 1.x (beta) | Opciones de cambio para un PNR o ticket existente, ±3 días |
| Autocompletar | **Geo Autocomplete** v2 | Aeropuertos y ciudades mientras escribís |

> **Alcance: PROD, solo shopping.** No se crean reservas ni se emiten tickets. El proxy local bloquea cualquier endpoint que no sea de shopping (ver [`CLAUDE.md`](CLAUDE.md)).

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

Le pega directo a Sabre con tu token y recorre Search (explorar), Search (calendario), Refresh, Shop y Check. Solo imprime estado, latencia y cantidad de resultados.

### Modo mock (sin red ni credenciales)

```bash
npm run dev:mock
```

También se cambia desde el indicador de conexión, en el header. Las respuestas se generan en el browser con MSW, respetan los schemas oficiales y son coherentes entre sí: el precio que muestra Search es el que revalida Check. Sirve como plan B si falla la red en la presentación.

Con `SABRE_RECORD=1` en `.env.local`, el proxy guarda respuestas reales en `src/mocks/recorded/`, y el modo mock las reproduce cuando se repite el mismo request. Reshop nunca se graba.

## API Inspector

El botón **API Inspector** del header muestra cada llamada a Sabre: API, endpoint, estado, latencia, request y respuesta en JSON, con enlace a la documentación en Developer Hub. Los enlaces con el ícono `</>` en cada pantalla abren el Inspector filtrado por la API que respondió ese bloque.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` / `dev:mock` | App en vivo (con `.env.local`) o con datos de ejemplo |
| `npm run build` | Build de producción |
| `npm run typecheck` / `lint` | TypeScript estricto y ESLint |
| `npm test` | Vitest: requests validados contra los specs oficiales con ajv, normalización, mocks y proxy (allowlist) |
| `npm run e2e` | Playwright en modo mock: recorrido completo, teclado, open origin, Reshop y mobile |
| `npm run smoke:live` | Prueba en vivo contra Sabre con tu token |
| `npm run gen:types` | Regenera `src/api/types/` desde `specs/*.yml` |
| `npm run build:airports` | Regenera los aeropuertos desde OurAirports |

## Arquitectura

```
Browser (React)                     Vite dev server                       Sabre
─────────────────                   ───────────────                       ─────
fetch /api/sabre/v1/offers/…  ──►   server/sabreProxy.ts            ──►   api.platform.sabre.com
                                    · allowlist de shopping (403 al resto)
                                    · Bearer SABRE_TOKEN (.env.local)
modo mock: MSW intercepta las mismas URLs en el browser (src/mocks)
```

- `specs/`: specs oficiales (OpenAPI) bajados con el MCP de Sabre Developer Hub.
- `src/api/`: cliente, tipos generados, `normalize.ts` (resuelve el modelo Mosaic `offers → journeys → flights`), `mappers.ts` (arma cada request) y hooks de TanStack Query.
- `src/features/`: pantallas (`inspire`, `calendar`, `shop`, `check`, `reshop`, `map`, `devtools`).
- `src/ui/`: design system (ver [`docs/design-plan.md`](docs/design-plan.md)).
- Mapa: MapLibre GL con geografía de Natural Earth incluida en el repo, sin tiles externos (funciona offline).

## Presentación

Guion paso a paso con enlaces directos: [`docs/demo-script.md`](docs/demo-script.md).

## Datos y licencias

- Aeropuertos: [OurAirports](https://ourairports.com/data/) (dominio público).
- Países: [Natural Earth](https://www.naturalearthdata.com/) (dominio público).
- Tipografías: Barlow y Barlow Condensed (SIL Open Font License), autoalojadas vía Fontsource.
- Skills de Claude Code en `.claude/` (ver [`.claude/skills/README.md`](.claude/skills/README.md)).
