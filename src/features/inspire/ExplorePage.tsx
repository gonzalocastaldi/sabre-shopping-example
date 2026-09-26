/**
 * Explorar (Flight Search): buscador + mapa + lista de destinos por precio.
 * Sin criterios en la URL muestra ideas para arrancar la demo con un clic.
 */
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { describeError } from '@/api/client';
import { useExploreSearch } from '@/api/hooks';
import { isOpenOrigin, plusDays, today, type SearchCriteria } from '@/api/mappers';
import type { DestinationSummary } from '@/api/normalize';
import { switchApiMode, useSettings } from '@/app/settings';
import { criteriaFromSearch, criteriaToSearch } from '@/app/urlState';
import { exploreRoute } from '@/app/router';
import { countryName, getPlace, placeLabel } from '@/data/geo';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { LazyExploreMap as ExploreMap } from '@/features/map/LazyExploreMap';
import { IconList, IconMap } from '@/ui/icons';
import { Button, Notice, Price, Skeleton, cx, formatDate } from '@/ui/primitives';
import { SearchForm, emptyCriteria } from './SearchForm';

function nextMonthRange(month: number) {
  const now = new Date();
  const year = now.getMonth() + 1 >= month ? now.getFullYear() + 1 : now.getFullYear();
  const mm = String(month).padStart(2, '0');
  const last = new Date(year, month, 0).getDate();
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${last}` };
}

const IDEAS: { title: string; detail: string; search: Record<string, string> }[] = [
  { title: 'A cualquier lugar desde Buenos Aires', detail: 'Open destination, una semana, próximos 3 meses', search: { o: 'BUE' } },
  { title: 'Playas desde Montevideo', detail: 'Tema "Beach" de Sabre, fin de semana largo o una semana', search: { o: 'MVD', dm: 'theme', dv: 'Beach', los: '3,7' } },
  { title: 'Esquí en julio desde Santiago', detail: 'Tema "Skiing", salida en julio, 5 noches', search: { o: 'SCL', dm: 'theme', dv: 'Skiing', los: '5', ...nextMonthRange(7) } },
  { title: 'Europa desde San Pablo', detail: 'Región ATPCO 210, dos semanas', search: { o: 'SAO', dm: 'region', dv: '210-Europe', los: '14' } },
  { title: '¿Desde dónde es más barato volar a Cancún?', detail: 'Open origin: seis ciudades de Sudamérica', search: { om: 'multi', o: 'EZE,MVD,SCL,LIM,BOG,GRU', dm: 'place', dv: 'CUN' } },
  { title: 'Escapada de fin de semana desde Nueva York', detail: 'Hasta US$ 400, con tarifa directa', search: { o: 'NYC', los: '2,3', b: '400', ns: '1' } },
];

const FLOW = [
  { api: 'Flight Search', text: 'Inspiración desde la caché: destinos y fechas flexibles.' },
  { api: 'Flight Refresh', text: 'Valida en lote que las tarifas cacheadas sigan disponibles.' },
  { api: 'Flight Shop', text: 'Shopping en vivo para las fechas elegidas.' },
  { api: 'Flight Check', text: 'Revalida la oferta elegida antes del checkout.' },
  { api: 'Flight Reshop', text: 'Busca opciones de cambio para un viaje ya emitido.' },
];

function DestinationRow({ summary, active, openOrigin, onHover, to }: { summary: DestinationSummary; active: boolean; openOrigin: boolean; onHover: (c?: string) => void; to: { code: string; search: Record<string, string | undefined> } }) {
  const place = getPlace(summary.code);
  const offer = summary.cheapest;
  const [out, back] = offer.legs;
  return (
    <li className={cx('border-b border-line [content-visibility:auto] [contain-intrinsic-size:auto_72px]', active && 'bg-cyan-soft/60')}>
      <Link
        to="/destino/$code"
        params={{ code: to.code }}
        search={to.search}
        onMouseEnter={() => onHover(summary.code)}
        onMouseLeave={() => onHover(undefined)}
        onFocus={() => onHover(summary.code)}
        onBlur={() => onHover(undefined)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.03]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-medium">
            {openOrigin ? `Desde ${placeLabel(summary.code)}` : placeLabel(summary.code)}{' '}
            <span className="text-2xs font-normal text-ink-soft" translate="no">
              {summary.code}
            </span>
          </p>
          <p className="truncate text-2xs text-ink-soft">
            {place ? countryName(place.country) : ''}
            {out?.departDate ? `, sale ${formatDate(out.departDate)}` : ''}
            {back?.departDate ? `, vuelve ${formatDate(back.departDate)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <Price amount={offer.price!.amount} currency={offer.price!.currency} className="text-[22px]" />
          <p className="text-2xs text-ink-soft">
            {offer.isNonStop ? <span className="text-cyan">Directo</span> : summary.cheapestNonStop ? <>Directo desde <Price amount={summary.cheapestNonStop.price!.amount} currency={summary.cheapestNonStop.price!.currency} className="text-2xs" /></> : 'con escalas'}
          </p>
        </div>
      </Link>
    </li>
  );
}

function Landing() {
  return (
    <div className="grid flex-1 gap-8 lg:grid-cols-[1fr_420px]">
      <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-line">
        <ExploreMap origins={['BUE', 'MVD', 'SCL', 'SAO', 'NYC']} points={[]} />
      </div>
      <div>
        <h2 className="text-2xl">Ideas para empezar la demo</h2>
        <p className="mt-1 text-ink-soft">Cada una arma un request distinto de Flight Search. Tocá una y mirá el request en el API Inspector.</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {IDEAS.map((idea) => (
            <li key={idea.title}>
              <Link to="/" search={idea.search} className="block py-3 hover:text-magenta">
                <span className="block text-[17px] font-medium">{idea.title}</span>
                <span className="block text-sm text-ink-soft">{idea.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="mt-8 text-2xl">El recorrido de la demo</h2>
        <ol className="mt-3 space-y-2">
          {FLOW.map((step, i) => (
            <li key={step.api} className="flex gap-3">
              <span className="font-display text-lg font-semibold text-magenta tabular">{i + 1}</span>
              <span>
                <span className="font-medium" translate="no">
                  {step.api}
                </span>
                <span className="block text-sm text-ink-soft">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Results({ criteria, view }: { criteria: SearchCriteria; view: 'mapa' | 'lista' }) {
  const query = useExploreSearch(criteria);
  const settings = useSettings();
  const navigate = useNavigate({ from: exploreRoute.fullPath });
  const [hovered, setHovered] = useState<string>();
  const openOrigin = isOpenOrigin(criteria);
  const places = useMemo(() => query.data?.places ?? [], [query.data]);
  const fixedDestination = openOrigin ? criteria.destinations[0] : undefined;

  const destinationLink = (s: DestinationSummary) => {
    const offer = s.cheapest;
    const los = offer.lengthOfStay ?? (criteria.tripType === 'roundtrip' ? criteria.lengthsOfStay[0] : undefined);
    const origin = openOrigin ? s.code : criteria.origins[0];
    return {
      code: openOrigin ? fixedDestination! : s.code,
      search: {
        o: origin,
        los: los !== undefined ? String(los) : 'ow',
        from: criteria.dateMode === 'flexible' ? criteria.fromDate : undefined,
        to: criteria.dateMode === 'flexible' ? criteria.toDate : undefined,
        sel: offer.legs[0]?.departDate,
        ns: criteria.nonStop ? '1' : undefined,
      },
    };
  };

  const setView = (v: 'mapa' | 'lista') => navigate({ search: (prev) => ({ ...prev, v: v === 'mapa' ? undefined : v }), replace: true });
  const error = query.error ? describeError(query.error) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      <div className="flex items-center gap-2 lg:hidden">
        {(['mapa', 'lista'] as const).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cx('inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm', view === v ? 'border-ink bg-ink text-paper' : 'border-line')}>
            {v === 'mapa' ? <IconMap size={16} /> : <IconList size={16} />}
            {v === 'mapa' ? 'Mapa' : 'Lista'}
          </button>
        ))}
      </div>
      <div className={cx('relative min-h-[60dvh] flex-1 overflow-hidden rounded-2xl border border-line lg:min-h-[420px]', view === 'lista' && 'hidden lg:block')}>
        <ExploreMap
          origins={openOrigin ? [fixedDestination!] : criteria.origins}
          reverse={openOrigin}
          points={places.map((p) => ({ code: p.code, amount: p.cheapest.price!.amount, currency: p.cheapest.price!.currency, nonStop: p.cheapest.isNonStop }))}
          hovered={hovered}
          onHover={setHovered}
          onSelect={(code) => {
            const s = places.find((p) => p.code === code);
            if (s) {
              const link = destinationLink(s);
              void navigate({ to: '/destino/$code', params: { code: link.code }, search: link.search });
            }
          }}
        />
        {query.isFetching && (
          <div className="absolute left-3 top-3 rounded-full bg-land/95 px-3 py-1.5 text-sm shadow-sm" role="status">
            Consultando Flight Search…
          </div>
        )}
      </div>
      <aside aria-label="Destinos por precio" className={cx('flex min-h-0 flex-col rounded-2xl border border-line bg-land lg:w-[400px]', view === 'mapa' && 'hidden lg:flex')}>
        <div className="flex items-start gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl">{query.isLoading ? 'Buscando destinos…' : openOrigin ? `${places.length} orígenes hacia ${placeLabel(fixedDestination!)}` : `${places.length} destinos`}</h2>
            <ApiSourceTag api="flightSearch" className="-ml-1.5">
              Tarifas más bajas en caché de
            </ApiSourceTag>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-[calc(100dvh-230px)]">
          {error && (
            <div className="p-4">
              <Notice
                tone="error"
                title={error.title}
                action={
                  settings.apiMode === 'live' ? (
                    <Button size="sm" variant="secondary" onClick={() => switchApiMode('mock')}>
                      Pasar a datos de ejemplo
                    </Button>
                  ) : undefined
                }
              >
                {error.detail}
              </Notice>
            </div>
          )}
          {query.data?.warnings.map((w, i) => (
            <div key={i} className="px-4 pt-3">
              <Notice tone="warn" title="Aviso de Sabre">
                {w.description ?? w.type}
              </Notice>
            </div>
          ))}
          {query.isLoading && (
            <ul aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 border-b border-line px-4 py-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </li>
              ))}
            </ul>
          )}
          {query.isSuccess && !places.length && (
            <div className="p-6">
              <p className="text-lg font-medium">No hay tarifas en caché para esta búsqueda</p>
              <p className="mt-1 text-ink-soft">Probá ampliar el rango de fechas, sumar duraciones de estadía o quitar el presupuesto máximo.</p>
            </div>
          )}
          <ul>
            {places.map((s) => (
              <DestinationRow key={s.code} summary={s} active={hovered === s.code} openOrigin={openOrigin} onHover={setHovered} to={destinationLink(s)} />
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export function ExplorePage() {
  const search = exploreRoute.useSearch();
  const navigate = useNavigate({ from: exploreRoute.fullPath });
  const criteria = criteriaFromSearch(search);
  // Mismo queryKey que Results: React Query deduplica, acá solo leemos el estado de carga.
  const busy = useExploreSearch(criteria).isFetching;
  const formKey = JSON.stringify(criteria ?? {});

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
      {criteria && (
        <h1 className="sr-only">
          {isOpenOrigin(criteria) ? `Orígenes más baratos hacia ${placeLabel(criteria.destinations[0] ?? '')}` : `Destinos desde ${criteria.origins.map(placeLabel).join(', ')}`}
        </h1>
      )}
      {!criteria && (
        <div className="max-w-3xl">
          <h1 className="text-[40px] sm:text-hero">¿A dónde se puede ir con este presupuesto?</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink-soft">
            Galaxy Travel busca con fechas y destinos abiertos sobre la caché de Sabre y después confirma el precio en vivo.
          </p>
        </div>
      )}
      <SearchForm
        key={formKey}
        initial={criteria ?? emptyCriteria()}
        busy={busy}
        onSubmit={(c) => navigate({ search: criteriaToSearch(c) })}
      />
      {criteria ? <Results criteria={criteria} view={search.v === 'lista' ? 'lista' : 'mapa'} /> : <Landing />}
      {!criteria && (
        <p className="text-2xs text-ink-soft">
          Las fechas por defecto van del {formatDate(plusDays(today(), 14))} al {formatDate(plusDays(today(), 104))}.
        </p>
      )}
    </div>
  );
}
