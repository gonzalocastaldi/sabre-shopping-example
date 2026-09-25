# Sabre Shopping Example — OTA de ejemplo

## Propósito
Este repo es una OTA (Online Travel Agency) de ejemplo para **probar y demostrar las APIs de Sabre**: búsqueda, revalidación, reserva y gestión de reservas. Es código de demo/testing contra el entorno **CERT** de Sabre, no de producción.

## Fuente de verdad: MCP de Sabre Developer Hub
Este proyecto usa el MCP server de Sabre Developer Hub (`https://developer.mcp.sabre.com/mcp`).

**Regla:** antes de implementar, modificar o depurar cualquier integración con una API de Sabre, consultá el MCP. No te bases en la memoria para endpoints, versiones, esquemas de request/response, headers, códigos de error ni límites, porque la documentación de Sabre cambia seguido.

Flujo recomendado:
1. `look_for_named_sabre_documentation`: buscar la API por nombre (ej. "Bargain Finder Max", "Booking Management").
2. `look_for_artifact_content`: buscar por concepto, campo o código de error.
3. `get_artifact_details` con el artifact URI: listar las páginas de la doc.
4. `get_documentation_page`: leer la página concreta (overview, guías, examples, error list).
5. `get_spec_file`: bajar el spec (OpenAPI/WSDL/XSD) y generar tipos/modelos desde ahí en vez de escribirlos a mano.
6. `get_latest_updated_documentation`: revisar cambios recientes antes de cambiar de versión una API.

En PRs y en comentarios de código relevantes, citá la doc usada (`https://developer.sabre.com/<artifact-uri>`).
Si el MCP no está disponible en la sesión, avisá antes de seguir en vez de adivinar el contrato de la API.

## APIs de referencia
- Preferir **REST** sobre SOAP cuando exista la misma funcionalidad.
- Usar la **última versión estable** (no Beta) salvo pedido explícito. Verificar la versión vigente en el MCP.

| Paso de la OTA | API | Artifact URI |
|---|---|---|
| Autenticación | OAuth Token Create | `rest-api/oauth-token-create-rest-api/v3` (o `v2` con client credentials) |
| Búsqueda de vuelos | Bargain Finder Max | `rest-api/bargain-finder-max/v5` |
| Revalidar precio/disponibilidad | Revalidate Itinerary | `rest-api/revalidate-itinerary/v5` |
| Crear / consultar / modificar / cancelar reserva, emitir tickets | Booking Management API | `rest-api/booking-management-api/v1` |

## Entornos y credenciales
- Durante el desarrollo usar siempre **CERT** (`https://api.cert.platform.sabre.com`). Nunca apuntar a PROD (`https://api.platform.sabre.com`) sin pedido explícito.
- Credenciales solo por variables de entorno (`SABRE_CLIENT_ID`, `SABRE_CLIENT_SECRET`, `SABRE_BASE_URL`, etc.). Nunca commitear credenciales, tokens ni `.env`. Mantener un `.env.example` sin valores reales.
- El token ATK dura 7 días (`expires_in: 604800`): cachearlo y renovarlo, no pedir uno por request.
- No loguear tokens, datos de pasajeros ni datos de pago completos.
