# Galaxy Travel — plan de diseño

Hecho con la skill `.claude/skills/frontend-design`: primero el plan, después la revisión contra el brief y recién ahí el código.

## Brief
- **Qué es:** OTA de demostración para presentar a clientes las APIs de shopping inspiracional de Sabre.
- **Audiencia en la sala:** equipos comerciales y de producto de agencias o aerolíneas. Van a ver la pantalla proyectada.
- **Persona de la demo:** viajero con fechas flexibles que todavía no sabe a dónde ir.
- **Trabajo principal de la interfaz:** llevar de "no sé a dónde" a "esta tarifa de caché sigue disponible" (Flight Search → Flight Refresh) y dejar a la vista, en cada paso, qué API de Sabre lo hizo posible.

## Materia prima del tema
- Cartas de navegación aérea: rutas en magenta, aeropuertos en cian, papel cartográfico frío y retícula.
- Navegación celeste: el nombre "Galaxy" invita a leer los destinos como estrellas y las rutas como constelaciones.
- Señalética de aeropuerto: tipografía condensada tipo DIN, números grandes y tabulares, jerarquía clara a distancia.
- Tarjeta de embarque: campos separados por una línea de corte. La separación marca campos distintos (origen, destino, fechas), no es decoración.

## Paleta (4–6 valores con nombre)
| Nombre | Hex | Uso |
|---|---|---|
| Papel carta | `#EEF2F1` | Fondo de la app. Gris verdoso frío, no crema. |
| Tinta de ruta | `#1B2433` | Texto y trazos principales. Azul tinta, no negro teñido. |
| Magenta aeronáutico | `#B8175A` | **El único acento audaz:** rutas en el mapa y acción primaria. |
| Cian aeropuerto | `#0A6F7E` | Estados confirmados (Refresh OK) y escala de precios baratos. |
| Tierra | `#F9FAF7` | Superficies y tierra firme del mapa. |
| Agua | `#CFDDE3` | Océanos del mapa y líneas divisorias suaves. |

Hay un modo oscuro derivado: el mapa pasa a "cielo nocturno" (agua `#101A2B`, tierra `#1B2740`) y el magenta se ajusta a `#C93370` para que el texto blanco sobre magenta mantenga contraste AA.

## Tipografía
- **Barlow Condensed**, pesos 500 y 600, para titulares, precios, códigos IATA y la marca. Es condensada, de la familia DIN, y hace pensar en carteles de aeropuerto. Cabe mucho precio en poco ancho y se lee de lejos.
- **Barlow**, pesos 400 y 500, para el cuerpo de texto y los controles. Es de la misma superfamilia, y el contraste entre ambas viene del ancho (normal vs condensada), no de mezclar estilos.
- Escala 1.25: 13 / 15 / 18 / 22 / 28 / 36 / 56 px. Los números usan `tabular-nums` y las líneas de texto no superan los 72 caracteres.
- Sin mayúsculas sostenidas en etiquetas, sin eyebrows ni palabras resaltadas dentro de un titular.

## Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ Galaxy Travel                                    [En vivo] [API] │
├──────────────────────────────────────────────────────────────────┤
│ Desde BUE ┆ A cualquier lugar ┆ Nov–Dic, 7 días ┆ Opciones ┆ Buscar │ ← tarjeta de embarque
├──────────────────────────────────────────────────────────────────┤
│ (23 destinos · vía Flight Search)                                │
│ ┌────────────────────┐                                           │
│ │ BUE ⇄ Río          │       MAPA a todo el ancho, con pines     │
│ │ US$ 412 en caché   │       de precio y arco magenta hacia      │
│ │ vuelos y clase     │       el destino elegido                  │
│ │ [Validar con       │                                           │
│ │  Flight Refresh]   │                                           │
│ └────────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
```
- **Explorar:** solo la barra de búsqueda y el mapa, sin panel lateral. El estado de la búsqueda (cargando, cantidad de destinos, errores, avisos de Sabre) flota como chips arriba a la izquierda del mapa.
- **Tarjeta del destino:** aparece al tocar un pin (queda en la URL como `?sel=`).
  - En desktop flota abajo a la izquierda, con 400 px de ancho. En pantallas anchas el mapa encuadra los pines a su derecha, así abrirla no tapa ningún destino.
  - En mobile es una hoja inferior (hasta 60 % del mapa). Si tapa el pin elegido, el mapa se corre para dejarlo a la vista.
- **Destino:** encabezado con la ruta, calendario de tarifas de 2 meses con navegación, histograma de 12 meses arriba y selector de días de viaje.
- **Barra de búsqueda:** arranca sin origen (el campo "Desde" dice "Elegí el origen" y se marca en rojo solo si se intenta buscar sin él). La duración del viaje es un selector de un solo punto, de 1 a 21 días, en la barra y en el calendario.
- Todo el texto va alineado a la izquierda; solo los precios van a la derecha, en columna.

## Principios
1. **El precio es protagonista.** Barlow Condensed, tabular, grande y alineado a la derecha.
2. **El mapa es el héroe y el magenta es el único gesto audaz.** Lo único animado es el arco que se traza desde el origen hacia el destino que el usuario señala, y responde a su acción. Con `prefers-reduced-motion` aparece sin animación.
3. **Siempre se ve la procedencia.** Cada bloque dice qué API lo respondió ("De Flight Search" en el precio en caché, "Flight Refresh" en la validación) y enlaza al API Inspector.
4. **Estructura sin cajas.** Hay filas con divisores finos donde corresponde agrupar. Nada de tarjetas idénticas con sombra.
5. **Honestidad del estado.** Los errores dicen qué pasó y qué hacer. Cuando no hay resultados, se invita a ampliar la búsqueda.

## Revisión contra el brief (qué cambié y por qué)
- *Primer borrador:* fondo oscuro "galaxia" con acento neón. **Lo descarté** porque es el default "near-black + acento brillante" que marca la skill, y se proyecta mal en salas iluminadas. Lo reemplacé por papel cartográfico frío, que viene del mundo aeronáutico y no del nombre.
- *Primer borrador:* tarjetas redondeadas con sombra para cada destino. **Las cambié por filas** con precio alineado, como un tablero de salidas. Es más denso y comparable.
- *Primer borrador:* Inter + monoespaciada para los códigos. **La cambié por Barlow/Barlow Condensed**, que tiene raíz en la señalética y le da carácter al número, que es lo que importa. La monoespaciada queda solo para el JSON del Inspector, donde el contenido es código.
- Revisé que el copy no use "Submit/Continuar" genéricos. Los botones dicen qué hacen: "Buscar destinos", "Validar con Flight Refresh", "Ver el calendario de tarifas".
- *Segunda iteración:* el panel lateral con la lista de destinos, las ideas y el recorrido **se sacaron** para que la demo se concentre en el mapa. Quedan la barra y el mapa, y la validación con Refresh vive en una tarjeta sobre el pin.

## Piso de calidad
Responsive hasta 360 px, foco visible (anillo cian de 2 px), `prefers-reduced-motion` respetado, contraste AA, `Intl` para fechas y monedas, estado en la URL, y soporte de teclado en el calendario (flechas) y en el combobox.
