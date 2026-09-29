/**
 * Explorar (Flight Search + Flight Refresh): solo la barra de búsqueda y el mapa.
 * Cada pin es la oferta más barata en caché hacia ese destino (o desde ese origen, en open
 * origin). Al tocarlo se abre una tarjeta sobre el mapa con los vuelos y la validación con
 * Flight Refresh. El destino elegido queda en la URL (?sel=CODE).
 */
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { describeError } from '@/api/client';
import { useExploreSearch } from '@/api/hooks';
import { isOpenOrigin, type SearchCriteria } from '@/api/mappers';
import type { DestinationSummary } from '@/api/normalize';
import { exploreRoute } from '@/app/router';
import { switchApiMode, useSettings } from '@/app/settings';
import { criteriaFromSearch, criteriaToSearch } from '@/app/urlState';
import { placeLabel } from '@/data/geo';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { DestinationCard } from '@/features/map/DestinationCard';
import { LazyExploreMap as ExploreMap } from '@/features/map/LazyExploreMap';
import { Button, Notice, Spinner } from '@/ui/primitives';
import { useMediaQuery } from '@/ui/useMediaQuery';
import { SearchForm, emptyCriteria } from './SearchForm';

/** Parámetros del calendario de tarifas (/destino/$code) para un destino del mapa. */
function calendarLinkFor(criteria: SearchCriteria, summary: DestinationSummary) {
  const openOrigin = isOpenOrigin(criteria);
  const offer = summary.cheapest;
  const los = offer.lengthOfStay ?? (criteria.tripType === 'roundtrip' ? criteria.lengthsOfStay[0] : undefined);
  return {
    code: openOrigin ? criteria.destinations[0] : summary.code,
    search: {
      o: openOrigin ? summary.code : criteria.origins[0],
      los: los !== undefined ? String(los) : 'ow',
      from: criteria.dateMode === 'flexible' ? criteria.fromDate : undefined,
      to: criteria.dateMode === 'flexible' ? criteria.toDate : undefined,
      sel: offer.legs[0]?.departDate,
      ns: criteria.nonStop ? '1' : undefined,
    },
  };
}

function MapStatus({ criteria, query, onMock }: { criteria?: SearchCriteria; query: ReturnType<typeof useExploreSearch>; onMock?: () => void }) {
  if (!criteria) {
    return <p className="rounded-full bg-land/95 px-3 py-1.5 text-sm shadow-sm">Elegí desde dónde salís y tocá “Buscar destinos”.</p>;
  }
  if (query.isFetching) {
    return (
      <p role="status" className="inline-flex items-center gap-2 rounded-full bg-land/95 px-3 py-1.5 text-sm shadow-sm">
        <Spinner /> Consultando Flight Search…
      </p>
    );
  }
  if (query.error) {
    const error = describeError(query.error);
    return (
      <div className="max-w-md">
        <Notice
          tone="error"
          title={error.title}
          action={
            onMock ? (
              <Button size="sm" variant="secondary" onClick={onMock}>
                Pasar a datos de ejemplo
              </Button>
            ) : undefined
          }
        >
          {error.detail}
        </Notice>
      </div>
    );
  }
  const places = query.data?.places ?? [];
  if (query.isSuccess && !places.length) {
    return (
      <div className="max-w-md">
        <Notice tone="info" title="No hay tarifas en caché para esta búsqueda">
          Probá ampliar el rango de fechas, sumar duraciones de estadía o quitar el presupuesto máximo.
        </Notice>
      </div>
    );
  }
  if (!places.length) return null;
  const open = isOpenOrigin(criteria);
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="inline-flex flex-wrap items-center gap-x-2 rounded-2xl bg-land/95 py-1 pl-3 pr-1 text-sm shadow-sm">
        <span className="font-medium">
          {open ? `${places.length} orígenes hacia ${placeLabel(criteria.destinations[0] ?? '')}` : `${places.length} destinos en caché`}
        </span>
        <ApiSourceTag api="flightSearch">vía</ApiSourceTag>
      </p>
      {query.data?.warnings.map((w, i) => (
        <div key={i} className="max-w-md">
          <Notice tone="warn" title="Aviso de Sabre">
            {w.description ?? w.type}
          </Notice>
        </div>
      ))}
    </div>
  );
}

export function ExplorePage() {
  const search = exploreRoute.useSearch();
  const navigate = useNavigate({ from: exploreRoute.fullPath });
  const settings = useSettings();
  const criteria = criteriaFromSearch(search);
  const query = useExploreSearch(criteria);
  const [hovered, setHovered] = useState<string>();
  const cardRef = useRef<HTMLElement>(null);
  // En pantallas anchas los pines se encuadran a la derecha del lugar de la tarjeta (400 px):
  // abrirla no tapa ningún destino ni mueve el mapa.
  const reserveCardSpace = useMediaQuery('(min-width: 1024px)');

  const openOrigin = criteria ? isOpenOrigin(criteria) : false;
  const places = useMemo(() => query.data?.places ?? [], [query.data]);
  // Memoizado: un array nuevo en cada render (por ejemplo, al pasar el mouse por un pin) haría
  // que el mapa se vuelva a encuadrar y pierda el zoom o el paneo del usuario.
  const points = useMemo(
    () => places.map((p) => ({ code: p.code, amount: p.cheapest.price!.amount, currency: p.cheapest.price!.currency, nonStop: p.cheapest.isNonStop })),
    [places],
  );
  const selected = places.find((p) => p.code === search.sel);

  const select = (code: string) => navigate({ search: (prev) => ({ ...prev, sel: code }) });
  const close = useCallback(() => {
    const code = search.sel;
    void navigate({ search: (prev) => ({ ...prev, sel: undefined }) });
    // Devolver el foco al pin que abrió la tarjeta.
    if (code) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-map-code="${code}"]`)?.focus());
  }, [navigate, search.sel]);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-3 px-4 py-4 sm:px-6">
      <h1 className="sr-only">
        {!criteria
          ? 'Explorar destinos con Flight Search'
          : openOrigin
            ? `Orígenes más baratos hacia ${placeLabel(criteria.destinations[0] ?? '')}`
            : `Destinos desde ${criteria.origins.map(placeLabel).join(', ')}`}
      </h1>
      <SearchForm
        key={JSON.stringify(criteria ?? {})}
        initial={criteria ?? emptyCriteria()}
        busy={query.isFetching}
        onSubmit={(c) => navigate({ search: criteriaToSearch(c) })}
      />
      <div className="relative min-h-[420px] flex-1 overflow-clip rounded-2xl border border-line sm:h-[calc(100dvh-12.5rem)] sm:flex-none">
        <ExploreMap
          padLeft={reserveCardSpace ? 400 : 0}
          overlayRef={cardRef}
          origins={criteria ? (openOrigin ? [criteria.destinations[0]] : criteria.origins) : ['BUE']}
          reverse={openOrigin}
          points={points}
          selected={selected?.code}
          hovered={hovered}
          onHover={setHovered}
          onSelect={select}
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col items-start gap-2 [&>*]:pointer-events-auto">
          <MapStatus criteria={criteria} query={query} onMock={settings.apiMode === 'live' ? () => switchApiMode('mock') : undefined} />
          {criteria && places.length > 0 && !selected && (
            <p className="rounded-full bg-land/95 px-3 py-1.5 text-2xs text-ink-soft shadow-sm">Tocá un destino para ver el vuelo y validarlo con Flight Refresh.</p>
          )}
        </div>
        {criteria && selected && <DestinationCard key={selected.code} ref={cardRef} summary={selected} openOrigin={openOrigin} calendarLink={calendarLinkFor(criteria, selected)} onClose={close} />}
      </div>
    </div>
  );
}
