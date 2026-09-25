# Guion de la presentación (12–15 minutos)

Objetivo: mostrar cómo una OTA puede **inspirar** con la caché de Sabre (Flight Search), **confirmar** en vivo (Refresh, Shop y Check) y **servir** después de la venta (Reshop). En cada paso, abrí el **API Inspector** para mostrar el request y la respuesta reales.

## Antes de presentar
1. Verificá que el token esté vigente (dura 7 días): `npm run smoke:live`.
2. Arrancá la app con `npm run dev` y mirá que el indicador del header diga **"En vivo en PROD"**.
3. Plan B sin red: `npm run dev:mock`, o elegí "Mock" en el indicador de conexión. Si antes corriste la demo con `SABRE_RECORD=1`, el mock reproduce esas respuestas reales.
4. Vaciá el Inspector (botón "Vaciar") para que muestre solo las llamadas de la demo.

## 1. El problema: "no sé a dónde ir"
- Abrí la página de inicio. Contá que el buscador no pide un destino: pide desde dónde, cuándo más o menos y cuánto querés gastar.
- Tocá **"A cualquier lugar desde Buenos Aires"**.
  - **Mostrar:** el mapa con precios y la lista ordenada. Es un solo request a **Flight Search** con `returnMode: "Per Date Range"`, sin `arrivalLocations` ("a cualquier lugar").
  - **Inspector:** el request es chico y la respuesta llega en menos de un segundo porque sale de la caché.

## 2. Inspiración con criterios del viajero
- En "A dónde", elegí **Inspirate → Playa** y **Esquí**, excluí un país y buscá.
  - **Mostrar:** `arrivalLocations` con `Theme` y `Exclude`.
- En "Opciones", poné un **presupuesto máximo** y activá **la tarifa directa más baja**.
  - **Mostrar:** `processingOptions.budget` y `returnLowestNonStopFare`. La lista muestra el precio "Directo desde…".
- Enlace directo: [/?o=BUE&dm=theme&dv=Beach,Skiing&los=7](http://localhost:5173/?o=BUE&dm=theme&dv=Beach,Skiing&los=7)

## 3. Open origin: "¿desde dónde me conviene salir?"
- Enlace: [/?om=multi&o=EZE,MVD,SCL,LIM,BOG,GRU&dm=place&dv=CUN](http://localhost:5173/?om=multi&o=EZE,MVD,SCL,LIM,BOG,GRU&dm=place&dv=CUN)
- **Mostrar:** `departureLocation` como `AirportList`. Sirve para campañas de aerolíneas o para viajeros que pueden salir de varias ciudades.

## 4. Fechas flexibles: calendario de tarifas
- Desde la lista, entrá a un destino.
- **Franja de 12 meses:** Flight Search con `Per Month`, solo precio. El mes más barato aparece en magenta.
- **Calendario:** Flight Search con `Per Day` y `returnFullOffers: true`, un precio por día con heatmap.
  - Cambiá las **noches de estadía**: el `lengthsOfStay` cambia y el calendario se vuelve a pedir.
  - El calendario se recorre con las flechas del teclado.

## 5. ¿Sigue vigente la tarifa de caché? Flight Refresh
- Tocá **"Validar disponibilidad"**: un solo request a **Flight Refresh** valida las 10 fechas más baratas contra el inventario.
- **Mostrar:** los íconos sobre cada día y el resumen "N de 10 confirmadas". Explicá los estados:
  - `Matched`: hay lugar en la clase cotizada.
  - `Same cabin`: hay lugar, pero en otra clase de la misma cabina.
  - `None`: no hay lugar.

## 6. Precio en vivo: Flight Shop
- Elegí un día y tocá **"Ver vuelos en vivo"**.
- **Mostrar:**
  - Multi-fuente: el filtro "Fuente del contenido" separa ATPCO, NDC y low cost.
  - Filtros de escalas, horario y aerolínea (quedan en la URL, se pueden compartir).
  - **Brands:** "Ver 3 tarifas" abre Light, Classic y Flex (`returnAdditionalOffers`) con equipaje y reglas de cambio y reembolso (`returnOfferAttributes`).

## 7. Antes de pagar: Flight Check
- Tocá **"Revisar oferta"** en una tarifa.
- **Mostrar:**
  - La comparación entre el precio de Shop o de la caché y el **precio revalidado**, con la diferencia.
  - El estado de la clase tarifaria, el upsell para el mismo vuelo, el desglose por pasajero y los impuestos.
  - Que Check revalida **por payload** (ATPCO) o **por `offerItemIds`** (NDC), según la oferta. El Inspector muestra cuál se usó.
- Atajo: desde el calendario, **"Revisar esta tarifa"** va directo de la caché (Search) a Check, sin pasar por Shop.
- Cierre del flujo: "Reservar" queda deshabilitado a propósito, porque estamos en PROD y el alcance es solo shopping.

## 8. Posventa: Flight Reshop
- Andá a **"Cambiar un viaje"**. En vivo necesita un PNR o ticket real de tu PCC; si no tenés, usá el mock.
- **Mostrar:** las opciones de cambio con ±3 días (`plusMinusDays`) y, para cada una, si pagás la diferencia o te queda saldo a favor, con el cargo por cambio aparte.

## Cierre
- Recorrido de APIs: Search (inspirar), Refresh (validar), Shop (cotizar), Check (confirmar) y Reshop (cambiar).
- Todo está construido sobre el mismo modelo de oferta Mosaic, y lo que se ve en pantalla es lo que devuelven las APIs.
- Próximos pasos posibles para el cliente:
  - Orden y reserva con Booking u Order Management, fuera de esta demo.
  - Caché propia del cliente con Flight Search (contenido privado).
  - Flight Shop Lite para volumen.
