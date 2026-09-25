/**
 * Vuelos en vivo (Flight Shop): itinerarios multi-fuente con filtros en la URL,
 * brands como upsell (returnAdditionalOffers), equipaje, flexibilidad y CO₂.
 */
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { describeError } from '@/api/client';
import { useFlightShop } from '@/api/hooks';
import type { ShopSelection } from '@/api/mappers';
import { resolvePolicies, type TripOffer } from '@/api/normalize';
import type { MosaicResponse } from '@/api/mosaic';
import { saveSelectedOffer } from '@/app/offerStore';
import { shopRoute } from '@/app/router';
import { switchApiMode, useSettings } from '@/app/settings';
import { shopFromSearch, shopToSearch, travelersToSearch } from '@/app/urlState';
import { airlineName } from '@/data/airlines';
import { CABINS } from '@/data/catalog';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { LegLine, PolicyList, RouteTitle, TravelersPicker } from '@/features/shared/travel';
import { IconChevronDown, IconLeaf } from '@/ui/icons';
import { Button, Notice, Price, Skeleton, ToggleChip, cx, formatDate, formatDuration } from '@/ui/primitives';

interface OfferGroup {
  main: TripOffer;
  brands: TripOffer[];
}

function groupOffers(offers: TripOffer[]): OfferGroup[] {
  const byId = new Map(offers.map((o) => [o.id, o]));
  const referenced = new Set(offers.flatMap((o) => o.additionalOfferIds));
  return offers
    .filter((o) => !referenced.has(o.id))
    .map((main) => ({ main, brands: [main, ...main.additionalOfferIds.map((id) => byId.get(id)).filter((o): o is TripOffer => Boolean(o))] }));
}

const totalDuration = (o: TripOffer) => o.legs.reduce((n, l) => n + (l.durationMin ?? 0), 0);
const maxStops = (o: TripOffer) => Math.max(...o.legs.map((l) => l.stops));
const departHour = (o: TripOffer) => Number(o.legs[0]?.departTime?.slice(0, 2) ?? 0);
const SOURCE_LABEL: Record<string, string> = { ATPCO: 'ATPCO', NDC: 'NDC', API: 'Low cost (API)' };
const TIME_BUCKETS = [
  { id: 'madrugada', label: 'Madrugada', from: 0, to: 6 },
  { id: 'manana', label: 'Mañana', from: 6, to: 12 },
  { id: 'tarde', label: 'Tarde', from: 12, to: 19 },
  { id: 'noche', label: 'Noche', from: 19, to: 24 },
];

function BrandOptions({ group, response, selection }: { group: OfferGroup; response: MosaicResponse; selection: ShopSelection }) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-3 border-t border-line bg-paper/60 p-4 sm:grid-cols-3">
      {group.brands.map((brand) => {
        const policies = resolvePolicies(brand, response.offerAttributes);
        return (
          <div key={brand.id} className="flex flex-col rounded-xl border border-line bg-land p-4">
            <p className="font-display text-xl font-semibold">{brand.brandNames[0] ?? 'Tarifa'}</p>
            <Price amount={brand.price!.amount} currency={brand.price!.currency} className="text-2xl" />
            <PolicyList policies={policies} className="mt-3 flex-1" />
            <Button
              className="mt-4"
              onClick={() => {
                saveSelectedOffer({ offer: brand, source: 'flightShop', travelers: selection.travelers, attributes: response.offerAttributes, taxItems: response.taxItems });
                void navigate({ to: '/revision/$offerId', params: { offerId: brand.id }, search: { pax: travelersToSearch(selection.travelers) } });
              }}
            >
              Revisar oferta
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function OfferRow({ group, response, selection, cheapest, fastest }: { group: OfferGroup; response: MosaicResponse; selection: ShopSelection; cheapest: boolean; fastest: boolean }) {
  const [open, setOpen] = useState(false);
  const o = group.main;
  const policies = resolvePolicies(o, response.offerAttributes);
  const paxCount = selection.travelers.ADT + selection.travelers.CNN + selection.travelers.INF;
  const adult = o.travelers.find((t) => t.ptc === 'ADT');
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-land [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 space-y-4">
          {(cheapest || fastest) && (
            <p className="flex gap-2 text-2xs font-medium">
              {cheapest && <span className="rounded-full bg-magenta/10 px-2 py-0.5 text-magenta">El más barato</span>}
              {fastest && <span className="rounded-full bg-cyan-soft px-2 py-0.5 text-cyan">El más rápido</span>}
            </p>
          )}
          {o.legs.map((leg, i) => (
            <LegLine key={leg.journeyId} leg={leg} label={o.legs.length > 1 ? (i === 0 ? `Ida, ${formatDate(leg.departDate)}` : `Vuelta, ${formatDate(leg.departDate)}`) : formatDate(leg.departDate)} />
          ))}
        </div>
        <div className="flex shrink-0 flex-row items-end justify-between gap-4 border-t border-line pt-3 md:w-56 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <div className="text-left md:text-right">
            <Price amount={o.price!.amount} currency={o.price!.currency} className="text-[28px] leading-none" />
            <p className="text-2xs text-ink-soft">
              {paxCount > 1 && adult?.total ? `Total ${paxCount} pasajeros, adulto ${new Intl.NumberFormat('es', { style: 'currency', currency: o.price!.currency, maximumFractionDigits: 0 }).format(adult.total)}` : 'Precio final por persona'}
            </p>
            <p className="mt-1 text-2xs text-ink-soft">
              {o.brandNames[0] ? `Tarifa ${o.brandNames[0]}, ` : ''}
              {policies.checkedBags?.pieces ? 'con valija' : 'sin valija'}
              {o.co2Grams ? (
                <span className="ml-1 inline-flex items-center gap-0.5">
                  <IconLeaf size={12} /> {Math.round(o.co2Grams / 1000)}&nbsp;kg CO₂
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-2xs">
              <span className="rounded bg-ink/[0.06] px-1.5 py-0.5" translate="no">
                {SOURCE_LABEL[o.distributionModel ?? ''] ?? o.distributionModel ?? 'Sabre'}
              </span>
            </p>
          </div>
          <Button variant={open ? 'secondary' : 'primary'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {group.brands.length > 1 ? `${open ? 'Ocultar' : 'Ver'} ${group.brands.length} tarifas` : open ? 'Ocultar' : 'Elegir'}
            <IconChevronDown size={16} className={cx('transition-transform', open && 'rotate-180')} />
          </Button>
        </div>
      </div>
      {open && <BrandOptions group={group} response={response} selection={selection} />}
    </li>
  );
}

export function ShopPage() {
  const search = shopRoute.useSearch();
  const navigate = useNavigate({ from: shopRoute.fullPath });
  const settings = useSettings();
  const selection = shopFromSearch(search);
  const query = useFlightShop(selection);

  const setFilter = (patch: Record<string, string | undefined>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const setSelection = (patch: Partial<ShopSelection>) => selection && navigate({ search: (prev) => ({ ...prev, ...shopToSearch({ ...selection, ...patch }) }) });

  const groups = useMemo(() => groupOffers(query.data?.offers ?? []), [query.data]);
  const airlines = useMemo(() => {
    const min = new Map<string, number>();
    for (const g of groups) for (const a of g.main.airlines) min.set(a, Math.min(min.get(a) ?? Infinity, g.main.price!.amount));
    return [...min].sort((a, b) => a[1] - b[1]);
  }, [groups]);
  const sources = Array.from(new Set(groups.map((g) => g.main.distributionModel ?? 'ATPCO')));

  const fStops = search.fs;
  const fAirlines = search.fa ? search.fa.split(',') : [];
  const fSource = search.fsrc ? search.fsrc.split(',') : [];
  const fTime = search.ft ? search.ft.split(',') : [];
  const sort = search.sort ?? 'precio';

  const visible = groups
    .filter((g) => (fStops === '0' ? maxStops(g.main) === 0 : fStops === '1' ? maxStops(g.main) <= 1 : true))
    .filter((g) => !fAirlines.length || g.main.airlines.some((a) => fAirlines.includes(a)))
    .filter((g) => !fSource.length || fSource.includes(g.main.distributionModel ?? 'ATPCO'))
    .filter((g) => !fTime.length || TIME_BUCKETS.filter((b) => fTime.includes(b.id)).some((b) => departHour(g.main) >= b.from && departHour(g.main) < b.to))
    .sort((a, b) => (sort === 'duracion' ? totalDuration(a.main) - totalDuration(b.main) : a.main.price!.amount - b.main.price!.amount));

  const cheapestId = [...groups].sort((a, b) => a.main.price!.amount - b.main.price!.amount)[0]?.main.id;
  const fastestId = [...groups].sort((a, b) => totalDuration(a.main) - totalDuration(b.main))[0]?.main.id;
  const toggleList = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]).join(',') || undefined;

  if (!selection) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <h1 className="text-4xl">Faltan datos del viaje</h1>
        <p className="mt-2 text-ink-soft">Elegí origen, destino y fecha desde el calendario de un destino.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-magenta px-4 font-medium text-white">
          Explorar destinos
        </Link>
      </div>
    );
  }

  const error = query.error ? describeError(query.error) : undefined;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6">
      <nav aria-label="Migas" className="text-sm text-ink-soft">
        <Link to="/destino/$code" params={{ code: selection.destination }} search={{ o: selection.origin, sel: selection.departDate, los: selection.returnDate ? String(Math.round((Date.parse(selection.returnDate) - Date.parse(selection.departDate)) / 86400000)) : 'ow' }} className="hover:text-ink hover:underline">
          Volver al calendario
        </Link>
      </nav>
      <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[34px] sm:text-[40px]">
            <RouteTitle from={selection.origin} to={selection.destination} roundTrip={Boolean(selection.returnDate)} />
          </h1>
          <p className="text-ink-soft">
            {formatDate(selection.departDate)}
            {selection.returnDate ? ` al ${formatDate(selection.returnDate)}` : ', solo ida'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TravelersPicker value={selection.travelers} onChange={(t) => setSelection({ travelers: t })} />
          <label className="sr-only" htmlFor="cabin">
            Cabina
          </label>
          <select id="cabin" name="cabina" value={selection.cabin} onChange={(e) => setSelection({ cabin: e.target.value as ShopSelection['cabin'] })} className="h-10 rounded-lg border border-line px-2">
            {CABINS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <ToggleChip pressed={Boolean(selection.nonStop)} onToggle={() => setSelection({ nonStop: !selection.nonStop })}>
            Solo directos
          </ToggleChip>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filtros" className="space-y-6">
          <fieldset>
            <legend className="mb-2 font-medium">Escalas</legend>
            {[
              { v: undefined, label: 'Todas' },
              { v: '0', label: 'Solo directos' },
              { v: '1', label: 'Hasta 1 escala' },
            ].map((o) => (
              <label key={o.label} className="flex cursor-pointer items-center gap-2 py-1">
                <input type="radio" name="escalas" checked={fStops === o.v} onChange={() => setFilter({ fs: o.v })} className="accent-[var(--magenta)]" />
                {o.label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-medium">Horario de salida</legend>
            <div className="flex flex-wrap gap-1.5">
              {TIME_BUCKETS.map((b) => (
                <ToggleChip key={b.id} pressed={fTime.includes(b.id)} onToggle={() => setFilter({ ft: toggleList(fTime, b.id) })}>
                  {b.label}
                </ToggleChip>
              ))}
            </div>
          </fieldset>
          {airlines.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-medium">Aerolíneas</legend>
              {airlines.map(([code, min]) => (
                <label key={code} className="flex cursor-pointer items-center gap-2 py-1">
                  <input type="checkbox" checked={fAirlines.includes(code)} onChange={() => setFilter({ fa: toggleList(fAirlines, code) })} className="accent-[var(--magenta)]" />
                  <span className="min-w-0 flex-1 truncate">{airlineName(code)}</span>
                  <Price amount={min} currency={groups[0].main.price!.currency} compact className="text-sm text-ink-soft" />
                </label>
              ))}
            </fieldset>
          )}
          {sources.length > 0 && (
            <fieldset>
              <legend className="mb-1 font-medium">Fuente del contenido</legend>
              <p className="mb-2 text-2xs text-ink-soft">Flight Shop combina ATPCO, NDC y low cost en una sola respuesta.</p>
              {sources.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 py-1">
                  <input type="checkbox" checked={fSource.includes(s)} onChange={() => setFilter({ fsrc: toggleList(fSource, s) })} className="accent-[var(--magenta)]" />
                  {SOURCE_LABEL[s] ?? s}
                </label>
              ))}
            </fieldset>
          )}
        </aside>

        <section aria-labelledby="results-title" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 id="results-title" className="text-2xl">
              {query.isLoading ? 'Buscando vuelos en vivo…' : `${visible.length} de ${groups.length} itinerarios`}
            </h2>
            <ApiSourceTag api="flightShop">Precios en vivo de</ApiSourceTag>
            <span className="flex-1" />
            <div role="radiogroup" aria-label="Ordenar" className="inline-flex rounded-lg bg-ink/[0.06] p-0.5">
              {[
                { v: 'precio', label: 'Más barato' },
                { v: 'duracion', label: 'Más rápido' },
              ].map((o) => (
                <button key={o.v} type="button" role="radio" aria-checked={sort === o.v} onClick={() => setFilter({ sort: o.v === 'precio' ? undefined : o.v })} className={cx('h-8 rounded-md px-3 text-sm', sort === o.v ? 'bg-land font-medium shadow-sm' : 'text-ink-soft hover:text-ink')}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
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
          )}
          {query.data?.response.warnings?.map((w, i) => (
            <div key={i} className="mb-3">
              <Notice tone="warn" title="Aviso de Sabre">
                {w.description ?? w.type}
              </Notice>
            </div>
          ))}
          {query.isLoading && (
            <ul className="space-y-3" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="space-y-3 rounded-xl border border-line bg-land p-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-2/3" />
                </li>
              ))}
            </ul>
          )}
          {query.isSuccess && !visible.length && (
            <div className="rounded-xl border border-line bg-land p-6">
              <p className="text-lg font-medium">{groups.length ? 'Ningún itinerario cumple los filtros' : 'Flight Shop no devolvió vuelos para estas fechas'}</p>
              <p className="mt-1 text-ink-soft">{groups.length ? 'Quitá algún filtro para ver más opciones.' : 'Probá otra fecha desde el calendario o quitá "Solo directos".'}</p>
            </div>
          )}
          {query.data && (
            <ul className="space-y-3">
              {visible.map((g) => (
                <OfferRow key={g.main.id} group={g} response={query.data.response} selection={selection} cheapest={g.main.id === cheapestId} fastest={g.main.id === fastestId && fastestId !== cheapestId} />
              ))}
            </ul>
          )}
          {query.data && groups.length > 0 && (
            <p className="mt-4 text-2xs text-ink-soft">
              Duración total del más rápido: {formatDuration(totalDuration(groups.find((g) => g.main.id === fastestId)!.main))}. Los precios incluyen impuestos.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
