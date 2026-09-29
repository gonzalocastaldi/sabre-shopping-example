# Guion de la presentación (10–12 minutos)

Objetivo: mostrar cómo una OTA puede **inspirar** con la caché de Sabre (Flight Search) y **validar** esas tarifas contra el inventario sin reservar (Flight Refresh). La pantalla es solo la barra de búsqueda y el mapa. En cada paso, abrí el **API Inspector** para mostrar el request y la respuesta reales.

## Antes de presentar
1. Verificá que el token esté vigente (dura 7 días) con `npm run smoke:live`. Refresh tiene que salir en ✓.
2. Arrancá la app con `npm run dev` y mirá que el indicador del header diga **"En vivo en PROD"**.
3. En el indicador, revisá que el **PCC** esté cargado (`SABRE_REQUEST_PCC` o Ajustes). Flight Refresh no funciona sin PCC.
4. Plan B sin red: `npm run dev:mock`, o elegí "Mock" en el indicador de conexión. Si antes corriste la demo con `SABRE_RECORD=1`, el mock reproduce esas respuestas reales.
5. Vaciá el Inspector (botón "Vaciar") para que muestre solo las llamadas de la demo.

## 1. El problema: "no sé a dónde ir"
- En la barra, completá **Desde: Buenos Aires** y dejá **A dónde: a cualquier lugar**. Tocá **"Buscar destinos"**.
  - **Mostrar:** el mapa se llena de pines con precio. Es un solo request a **Flight Search** con `returnMode: "Per Date Range"` y sin `arrivalLocations` ("a cualquier lugar").
  - **Inspector:** la respuesta llega rápido porque sale de la caché. Pedimos `returnFullOffers: true` para que cada pin traiga vuelos y clase tarifaria.
- Enlace directo: [/?o=BUE](http://localhost:5173/?o=BUE)

## 2. Inspiración con criterios del viajero
- En "A dónde", elegí **Inspirate → Playa** y **Esquí**, excluí un país y buscá.
  - **Mostrar:** `arrivalLocations` con `Theme` y `Exclude`.
- En "Opciones", poné un **presupuesto máximo** y activá **la tarifa directa más baja**.
  - **Mostrar:** `processingOptions.budget` y `returnLowestNonStopFare`. En la tarjeta del destino aparece el selector "Más barata / Directa más barata".
- Enlace directo: [/?o=BUE&dm=theme&dv=Beach,Skiing&los=7](http://localhost:5173/?o=BUE&dm=theme&dv=Beach,Skiing&los=7)

## 3. ¿Sigue vigente la tarifa de caché? Flight Refresh desde el mapa
- Tocá un pin. Se abre la **tarjeta del destino** con la ruta, las fechas, el precio en caché y cada vuelo con su clase tarifaria (por ejemplo, "AR 1302 clase Q").
- Elegí la cantidad de pasajeros y tocá **"Validar con Flight Refresh"**.
- **Mostrar:**
  - `isItineraryValid`: el horario existe en OAG ("Horario publicado").
  - `bookingClassCodeValidation`, que puede ser:
    - `Matched`: hay lugar en la clase cotizada.
    - `Same cabin`: hay lugar, pero en otra clase de la misma cabina.
    - `Any other`: hay lugar solo en otra cabina.
    - `None`: no hay lugar.
  - La tabla de **asientos por clase** (`cabinAvailability`), con la clase cotizada resaltada.
- **Inspector:** la `departureDate` de cada `journeys[i]` coincide con la del primer vuelo del itinerario, y `processingOptions.pseudoCityCode` lleva tu PCC. Son las dos reglas que Sabre valida.
- Tocá otro pin: la tarjeta cambia de destino sin cerrar. Con Escape o la X se cierra y el foco vuelve al pin.

## 4. Open origin: "¿desde dónde me conviene salir?"
- Enlace: [/?om=multi&o=EZE,MVD,SCL,LIM,BOG,GRU&dm=place&dv=CUN](http://localhost:5173/?om=multi&o=EZE,MVD,SCL,LIM,BOG,GRU&dm=place&dv=CUN)
- **Mostrar:** `departureLocation` como `AirportList`. Los pines ahora son orígenes. Sirve para campañas de aerolíneas o para viajeros que pueden salir de varias ciudades.
- Tocá un origen y validalo con Refresh, igual que en el paso 3.

## 5. Fechas flexibles: calendario de tarifas
- En la tarjeta, tocá **"Ver el calendario de tarifas"**.
- **Franja de 12 meses:** Flight Search con `Per Month`, solo precio. El mes más barato aparece en magenta.
- **Calendario:** Flight Search con `Per Day` y `returnFullOffers: true`, un precio por día con heatmap.
  - Mové el selector de **duración del viaje** (1 a 21 días, lo que acepta `lengthsOfStay`): al soltarlo cambia el `lengthsOfStay` y el calendario se vuelve a pedir.
  - El calendario se recorre con las flechas del teclado.

## Cierre
- Recorrido: Search para inspirar (mapa, temas, open origin, calendario) y Refresh para validar la tarifa de caché contra el inventario, **sin reservar**.
- Refresh valida hasta 100 itinerarios por request, pensado para refrescar en lote la caché propia del cliente.
- Todo usa el modelo de oferta Mosaic, y lo que se ve en pantalla es lo que devuelven las APIs.
- Próximos pasos posibles para el cliente, fuera de esta demo:
  - Shopping en vivo con Flight Shop y revalidación con Flight Check antes de pagar.
  - Caché propia del cliente con Flight Search (contenido privado).
