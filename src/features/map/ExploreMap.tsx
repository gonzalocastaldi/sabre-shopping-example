/**
 * Mapa de exploración (MapLibre GL). Estilo propio sin tiles externos: tierra y agua desde
 * Natural Earth (dominio público, public/geo/countries-110m.json), así la demo funciona sin red.
 * Pins con precio para los destinos más baratos, puntos para el resto y un arco magenta
 * (la única animación) hacia el destino que el usuario señala.
 */
import MapGL, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/maplibre';
import { setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
// MapLibre v6 carga su worker por URL relativa; al pre-empaquetar, Vite la rompe. Se la damos explícita.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getPlace, placeLabel } from '@/data/geo';
import { cx, formatMoney } from '@/ui/primitives';

setWorkerUrl(maplibreWorkerUrl);

export interface MapPoint {
  code: string;
  amount: number;
  currency: string;
  nonStop: boolean;
}

interface Props {
  origins: string[];
  points: MapPoint[];
  selected?: string;
  hovered?: string;
  onSelect?: (code: string) => void;
  onHover?: (code: string | undefined) => void;
  /** Open origin: los puntos son orígenes y la ruta va desde ellos al destino fijo. */
  reverse?: boolean;
  labelCount?: number;
  className?: string;
}

function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function useThemeColors() {
  const read = () => ({
    water: cssVar('--water', '#cfdde3'),
    land: cssVar('--land', '#f9faf7'),
    line: cssVar('--line', '#d3dcdc'),
    magenta: cssVar('--magenta', '#b8175a'),
    cyan: cssVar('--cyan', '#0a6f7e'),
    ink: cssVar('--ink', '#1b2433'),
  });
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setColors(read());
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return colors;
}

/** Interpolación de círculo máximo, con longitudes "desenrolladas" para cruzar el antimeridiano. */
export function greatCircle(a: [number, number], b: [number, number], steps = 64): [number, number][] {
  const rad = Math.PI / 180;
  const [lon1, lat1] = [a[0] * rad, a[1] * rad];
  const [lon2, lat2] = [b[0] * rad, b[1] * rad];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2));
  if (d === 0) return [a, b];
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    points.push([Math.atan2(y, x) / rad, Math.atan2(z, Math.sqrt(x * x + y * y)) / rad]);
  }
  for (let i = 1; i < points.length; i++) {
    while (points[i][0] - points[i - 1][0] > 180) points[i][0] -= 360;
    while (points[i][0] - points[i - 1][0] < -180) points[i][0] += 360;
  }
  return points;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ExploreMap({ origins, points, selected, hovered, onSelect, onHover, reverse, labelCount = 28, className }: Props) {
  const mapRef = useRef<MapRef>(null);
  const colors = useThemeColors();
  const [loaded, setLoaded] = useState(false);

  const style = useMemo<StyleSpecification>(
    () => ({
      version: 8,
      sources: {
        countries: { type: 'geojson', data: '/geo/countries-110m.json', attribution: 'Natural Earth y OurAirports' },
      },
      layers: [
        { id: 'water', type: 'background', paint: { 'background-color': colors.water } },
        { id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': colors.land } },
        { id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': colors.line, 'line-width': 0.7 } },
      ],
    }),
    [colors],
  );

  const originKey = origins.join(',');
  const originPlaces = useMemo(
    () => originKey.split(',').filter(Boolean).map(getPlace).filter((p): p is NonNullable<ReturnType<typeof getPlace>> => Boolean(p)),
    [originKey],
  );
  const located = useMemo(
    () =>
      points
        .map((p) => ({ ...p, place: getPlace(p.code) }))
        .filter((p): p is typeof p & { place: NonNullable<typeof p.place> } => Boolean(p.place))
        .sort((a, b) => a.amount - b.amount),
    [points],
  );
  const cheapest = located[0]?.amount ?? 0;
  const priciest = located[located.length - 1]?.amount ?? 1;

  // Encuadre: origen + destinos.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const all = [...originPlaces, ...located.map((l) => l.place)];
    if (!all.length) return;
    const lons = all.map((p) => p.lon);
    const lats = all.map((p) => p.lat);
    if (all.length === 1) {
      map.flyTo({ center: [lons[0], lats[0]], zoom: 3, duration: prefersReducedMotion() ? 0 : 800 });
      return;
    }
    map.fitBounds(
      [
        [Math.min(...lons), Math.max(-60, Math.min(...lats))],
        [Math.max(...lons), Math.min(75, Math.max(...lats))],
      ],
      { padding: { top: 60, bottom: 40, left: 40, right: 40 }, maxZoom: 5, duration: prefersReducedMotion() ? 0 : 900 },
    );
  }, [loaded, located, originPlaces]);

  // Arco hacia el destino activo: se dibuja progresivamente (respeta reduced motion).
  const target = hovered ?? selected;
  const [anim, setAnim] = useState<{ key?: string; progress: number }>({ progress: 1 });
  useEffect(() => {
    if (!target || prefersReducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 550);
      setAnim({ key: target, progress: 1 - (1 - t) ** 3 });
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  const progress = !target || prefersReducedMotion() ? 1 : anim.key === target ? anim.progress : 0;

  const arc = useMemo(() => {
    const dest = target ? getPlace(target) : undefined;
    const origin = originPlaces[0];
    if (!dest || !origin) return undefined;
    const [from, to] = reverse ? [dest, origin] : [origin, dest];
    const line = greatCircle([from.lon, from.lat], [to.lon, to.lat]);
    return line.slice(0, Math.max(2, Math.round(line.length * progress)));
  }, [target, progress, originPlaces, reverse]);

  // Etiquetas sin superposición: de la más barata a la más cara, se descarta la que choca
  // con una ya ubicada (en píxeles de pantalla). Se recalcula al mover o hacer zoom.
  const [labeled, setLabeled] = useState<Set<string>>(new Set());
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const place = () => {
      // Los orígenes ocupan su lugar: ninguna etiqueta de precio los tapa.
      const boxes: { x: number; y: number }[] = originPlaces.map((o) => map.project([o.lon, o.lat]));
      const next = new Set<string>();
      for (const p of located) {
        if (next.size >= labelCount) break;
        const pt = map.project([p.place.lon, p.place.lat]);
        if (boxes.some((b) => Math.abs(b.x - pt.x) < 78 && Math.abs(b.y - pt.y) < 40)) continue;
        boxes.push(pt);
        next.add(p.code);
      }
      setLabeled(next);
    };
    place();
    map.on('moveend', place);
    return () => {
      map.off('moveend', place);
    };
  }, [loaded, located, labelCount, originPlaces]);

  return (
    // Absoluto dentro de un padre `relative` con alto mínimo: así el alto es definido también
    // en layouts de columna (mobile), donde height: 100% resolvería a 0.
    <div role="region" aria-label="Mapa de destinos con precios" className={cx('absolute inset-0 overflow-hidden', className)}>
      <MapGL
        ref={mapRef}
        mapStyle={style}
        initialViewState={{ longitude: -45, latitude: -5, zoom: 1.6 }}
        minZoom={1}
        maxZoom={8}
        renderWorldCopies={false}
        dragRotate={false}
        touchPitch={false}
        onLoad={() => setLoaded(true)}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {arc && (
          <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: arc } }}>
            <Layer id="route-line" type="line" layout={{ 'line-cap': 'round' }} paint={{ 'line-color': colors.magenta, 'line-width': 2.5 }} />
          </Source>
        )}

        {located.map((p) => {
          const active = p.code === selected || p.code === hovered;
          const showLabel = labeled.has(p.code) || active;
          const intensity = priciest > cheapest ? (p.amount - cheapest) / (priciest - cheapest) : 0;
          const priceText = formatMoney(p.amount, p.currency, { compact: true });
          return (
            <Marker key={p.code} longitude={p.place.lon} latitude={p.place.lat} anchor={showLabel ? 'bottom' : 'center'} style={{ zIndex: active ? 3 : showLabel ? 2 : 1 }}>
              <button
                type="button"
                onClick={() => onSelect?.(p.code)}
                onMouseEnter={() => onHover?.(p.code)}
                onMouseLeave={() => onHover?.(undefined)}
                onFocus={() => onHover?.(p.code)}
                onBlur={() => onHover?.(undefined)}
                aria-label={`${placeLabel(p.code)}: desde ${priceText}${p.nonStop ? ', directo' : ''}`}
                aria-pressed={p.code === selected}
                className={cx(
                  'group relative block',
                  showLabel
                    ? cx(
                        'rounded-md border px-1.5 py-0.5 font-display text-[15px] font-semibold leading-tight tabular shadow-sm transition-[background-color,color,border-color] duration-150',
                        active ? 'border-magenta bg-magenta text-white' : 'border-line bg-land text-ink hover:border-ink',
                      )
                    : 'size-2.5 rounded-full border border-land',
                )}
                style={showLabel ? undefined : { background: `color-mix(in srgb, ${colors.cyan} ${Math.round(100 - intensity * 60)}%, ${colors.ink})` }}
              >
                {showLabel && (
                  <>
                    <span className="block whitespace-nowrap">{priceText}</span>
                    <span className={cx('block whitespace-nowrap font-sans text-[11px] font-medium', active ? 'text-white/85' : 'text-ink-soft')}>{placeLabel(p.code)}</span>
                  </>
                )}
              </button>
            </Marker>
          );
        })}

        {originPlaces.map((o) => (
          <Marker key={`o-${o.code}`} longitude={o.lon} latitude={o.lat} anchor="center" style={{ zIndex: 4 }}>
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="size-3.5 rounded-full border-[3px] border-land bg-cyan shadow" />
              <span className="rounded bg-ink px-1.5 py-0.5 font-display text-sm font-semibold text-paper" translate="no">
                {o.code}
              </span>
            </span>
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}
