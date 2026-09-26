/** El mapa (MapLibre, ~800 kB) se carga aparte para que la app arranque más rápido. */
import { lazy, Suspense, type ComponentProps } from 'react';
import type { ExploreMap as ExploreMapType } from './ExploreMap';

const ExploreMap = lazy(() => import('./ExploreMap').then((m) => ({ default: m.ExploreMap })));

export function LazyExploreMap(props: ComponentProps<typeof ExploreMapType>) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-water" role="status" aria-label="Cargando el mapa…" />}>
      <ExploreMap {...props} />
    </Suspense>
  );
}
