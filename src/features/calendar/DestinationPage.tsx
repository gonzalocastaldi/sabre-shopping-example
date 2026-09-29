/**
 * Destino: calendario de tarifas (Flight Search "Per Day" con ofertas completas), franja de
 * 12 meses (Flight Search "Per Month", solo precio). Flight Refresh se prueba desde el mapa.
 */
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { addMonths, format, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';
import { describeError } from '@/api/client';
import { useCalendarSearch, useMonthOverview } from '@/api/hooks';
import { MAX_STAY_DAYS, MIN_STAY_DAYS, plusDays, today, SEARCH_WINDOW_DAYS } from '@/api/mappers';
import type { CalendarDay } from '@/api/normalize';
import { destinationRoute } from '@/app/router';
import { countryName, getPlace, placeLabel } from '@/data/geo';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { RefreshBox } from '@/features/shared/RefreshBox';
import { LegLine, RouteTitle } from '@/features/shared/travel';
import { IconChevronLeft, IconChevronRight } from '@/ui/icons';
import { IconButton, Notice, Price, ToggleChip, cx, formatDate, formatDateLong, formatDays, formatMoney } from '@/ui/primitives';
import { StayDaysSlider } from '@/ui/StayDaysSlider';
import { useMediaQuery } from '@/ui/useMediaQuery';
import { CalendarLegend, FareCalendar } from './FareCalendar';

const MONTH_SHORT = new Intl.DateTimeFormat('es', { month: 'short' });
const DEFAULT_STAY = 7;

/** Días de viaje desde la URL (`los`): entero de 1 a 21; cualquier otra cosa vuelve al default. */
function stayFromSearch(los?: string) {
  const n = Number(los);
  return Number.isInteger(n) && n >= MIN_STAY_DAYS && n <= MAX_STAY_DAYS ? n : DEFAULT_STAY;
}

export function DestinationPage() {
  const { code } = destinationRoute.useParams();
  const search = destinationRoute.useSearch();
  // Sin origen no hay default: no se llama a Flight Search y se explica cómo seguir.
  if (!search.o) return <MissingOrigin code={code} />;
  return <DestinationCalendar origin={search.o} />;
}

/**
 * Vuelta al mapa. Si se llegó desde la tarjeta del mapa, vuelve atrás en el historial: misma
 * búsqueda, tarjeta abierta y sin gastar otra búsqueda (queda en caché). Dentro del calendario
 * todas las navegaciones reemplazan la entrada, así que "atrás" siempre es el mapa. Si se entró
 * por link directo, abre el mapa desde ese origen.
 */
function BackToMap({ origin }: { origin: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const className = 'inline-flex items-center gap-1 rounded-md py-1 pr-2 text-sm text-ink-soft hover:text-ink hover:underline';
  const content = (
    <>
      <IconChevronLeft size={16} />
      Volver al mapa
    </>
  );
  return (
    <nav aria-label="Navegación">
      {canGoBack ? (
        <button type="button" onClick={() => router.history.back()} className={className}>
          {content}
        </button>
      ) : (
        <Link to="/" search={{ o: origin }} className={className}>
          {content}
        </Link>
      )}
    </nav>
  );
}

function MissingOrigin({ code }: { code: string }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6">
      <h1 className="text-[36px] sm:text-[44px]">Calendario de tarifas a {placeLabel(code)}</h1>
      <div className="mt-4 max-w-xl">
        <Notice
          tone="info"
          title="Falta el origen"
          action={
            <Link to="/" className="inline-flex h-8 items-center rounded-md border border-line bg-land px-3 text-sm font-medium hover:border-ink/50">
              Ir al mapa
            </Link>
          }
        >
          El calendario necesita saber desde dónde salís. Buscá en el mapa y tocá el destino.
        </Notice>
      </div>
    </div>
  );
}

function DestinationCalendar({ origin }: { origin: string }) {
  const { code } = destinationRoute.useParams();
  const search = destinationRoute.useSearch();
  const navigate = useNavigate({ from: destinationRoute.fullPath });
  const oneWay = search.los === 'ow';
  const lengthOfStay = oneWay ? undefined : stayFromSearch(search.los);
  // Valor mientras se arrastra el selector; la URL (y la búsqueda) cambia recién al soltar.
  const [draftStay, setDraftStay] = useState<number>();
  const nonStop = search.ns === '1';
  const wide = useMediaQuery('(min-width: 768px)');
  const monthsShown = wide ? 2 : 1;

  const minDate = plusDays(today(), 1);
  const maxDate = plusDays(today(), SEARCH_WINDOW_DAYS);
  // Mes inicial: el de la fecha elegida o, si el mes actual casi terminó, el siguiente.
  const startAnchor = search.sel ?? search.from ?? (Number(minDate.slice(8)) > 20 ? plusDays(minDate, 12) : minDate);
  const firstMonth = search.m ?? format(startOfMonth(new Date(`${startAnchor}T12:00:00`)), 'yyyy-MM-dd');
  const windowFrom = firstMonth < minDate ? minDate : firstMonth;
  const windowTo = (() => {
    const end = format(addMonths(new Date(`${firstMonth}T12:00:00`), monthsShown), 'yyyy-MM-dd');
    const last = plusDays(end, -1);
    return last > maxDate ? maxDate : last;
  })();

  const calendar = useCalendarSearch({ origin, destination: code, fromDate: windowFrom, toDate: windowTo, lengthOfStay, nonStop });
  const overview = useMonthOverview({ origin, destination: code, lengthOfStay, nonStop });

  const days = useMemo(() => calendar.data?.days ?? new Map<string, CalendarDay>(), [calendar.data]);
  const selectedDate = search.sel && days.has(search.sel) ? search.sel : undefined;
  const selected = selectedDate ? days.get(selectedDate) : undefined;
  const offer = selected?.cheapest;

  const set = (patch: Record<string, string | undefined>, replace = true) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace });

  const dest = getPlace(code);
  const months = Array.from({ length: 11 }, (_, i) => format(addMonths(startOfMonth(new Date()), i), 'yyyy-MM'));
  const monthPrices = months.map((m) => overview.data?.get(m)?.price?.amount).filter((n): n is number => n !== undefined);
  const monthMax = Math.max(...monthPrices, 1);
  const monthMin = Math.min(...monthPrices);
  const calError = calendar.error ? describeError(calendar.error) : undefined;
  const returnDate = offer?.legs[1]?.departDate ?? (selectedDate && lengthOfStay !== undefined ? plusDays(selectedDate, lengthOfStay) : undefined);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6">
      <BackToMap origin={origin} />
      <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[36px] sm:text-[44px]">
            <RouteTitle from={origin} to={code} roundTrip={!oneWay} />
          </h1>
          <p className="text-ink-soft">
            {dest ? `${dest.kind === 'city' ? 'Todos los aeropuertos' : dest.name}, ${countryName(dest.country)}` : code}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <StayDaysSlider
          className="w-full max-w-md"
          label="Duración del viaje (lengthsOfStay)"
          value={draftStay ?? lengthOfStay ?? DEFAULT_STAY}
          disabled={oneWay}
          onChange={setDraftStay}
          onCommit={(days) => {
            setDraftStay(undefined);
            if (days !== lengthOfStay) set({ los: String(days), sel: undefined });
          }}
        />
        <div className="flex flex-wrap gap-1.5 pb-5">
          <ToggleChip pressed={oneWay} onToggle={() => set({ los: oneWay ? String(DEFAULT_STAY) : 'ow', sel: undefined })}>
            Solo ida
          </ToggleChip>
          <ToggleChip pressed={nonStop} onToggle={() => set({ ns: nonStop ? undefined : '1' })}>
            Incluir tarifa directa
          </ToggleChip>
        </div>
      </div>

      {/* Franja anual: Per Month */}
      <section aria-labelledby="year-title" className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div>
            <h2 id="year-title" className="text-xl">
              El precio más bajo de cada mes
            </h2>
            <p className="text-sm text-ink-soft">El mes más barato está en magenta.</p>
          </div>
          <ApiSourceTag api="flightSearch" className="-ml-1.5 sm:ml-0">
            Per Month, solo precio, de
          </ApiSourceTag>
        </div>
        <ul className="mt-2 grid grid-cols-11 items-end gap-1 sm:gap-2">
          {months.map((m) => {
            const o = overview.data?.get(m);
            const amount = o?.price?.amount;
            const height = amount ? 16 + ((amount - monthMin) / Math.max(1, monthMax - monthMin)) * 56 : 8;
            const active = firstMonth.slice(0, 7) === m;
            return (
              <li key={m}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`${new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(`${m}-15T12:00:00`))}${amount ? `: desde ${formatMoney(amount, o!.price!.currency)}` : ': sin tarifa'}`}
                  onClick={() => set({ m: `${m}-01` })}
                  className="group flex w-full flex-col items-center gap-1"
                >
                  <span className="hidden font-display text-[13px] font-semibold tabular sm:block">{amount ? formatMoney(amount, o!.price!.currency, { compact: true }) : '—'}</span>
                  <span
                    className={cx('w-full rounded-t-md transition-colors', amount === monthMin ? 'bg-magenta' : active ? 'bg-ink' : 'bg-cyan/50 group-hover:bg-cyan')}
                    style={{ height: overview.isLoading ? 20 : height }}
                    aria-hidden="true"
                  />
                  <span className={cx('text-2xs capitalize', active ? 'font-medium text-ink' : 'text-ink-soft')}>{MONTH_SHORT.format(new Date(`${m}-15T12:00:00`)).replace('.', '')}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="cal-title">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div>
              <h2 id="cal-title" className="text-xl">
                Tarifa más baja por día de salida
              </h2>
              <p className="text-sm text-ink-soft">
                Por adulto, en {[...days.values()][0]?.cheapest.price?.currency ?? 'USD'}
                {oneWay ? ', solo ida' : `, ida y vuelta de ${formatDays(lengthOfStay!)}`}.
              </p>
            </div>
            <span className="flex-1" />
            <IconButton label="Mes anterior" disabled={firstMonth <= format(startOfMonth(new Date()), 'yyyy-MM-dd')} onClick={() => set({ m: format(addMonths(new Date(`${firstMonth}T12:00:00`), -1), 'yyyy-MM-dd') })} className="disabled:opacity-30">
              <IconChevronLeft />
            </IconButton>
            <IconButton label="Mes siguiente" disabled={windowTo >= maxDate} onClick={() => set({ m: format(addMonths(new Date(`${firstMonth}T12:00:00`), 1), 'yyyy-MM-dd') })} className="disabled:opacity-30">
              <IconChevronRight />
            </IconButton>
          </div>
          {calError && (
            <Notice tone="error" title={calError.title}>
              {calError.detail}
            </Notice>
          )}
          <FareCalendar
            firstMonth={firstMonth}
            monthsShown={monthsShown}
            days={days}
            selected={selectedDate}
            onSelect={(date) => set({ sel: date })}
            onNavigate={(m) => set({ m })}
            minDate={minDate}
            maxDate={maxDate}
            loading={calendar.isFetching}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <CalendarLegend />
            <ApiSourceTag api="flightSearch">Per Day, ofertas completas, de</ApiSourceTag>
          </div>
        </section>

        <aside aria-labelledby="sel-title" className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-line bg-land p-5">
            {!offer ? (
              <>
                <h2 id="sel-title" className="text-2xl">
                  Elegí una fecha
                </h2>
                <p className="mt-1 text-ink-soft">
                  Tocá un día del calendario para ver el vuelo en caché de ese día.
                  {days.size ? ` El más barato del período sale ${formatMoney(Math.min(...[...days.values()].map((d) => d.cheapest.price!.amount)), [...days.values()][0].cheapest.price!.currency)}.` : ''}
                </p>
              </>
            ) : (
              <>
                <h2 id="sel-title" className="text-2xl first-letter:uppercase">
                  {formatDateLong(selectedDate!)}
                </h2>
                <p className="text-ink-soft">{returnDate && !oneWay ? `Vuelta el ${formatDate(returnDate)}, ${formatDays(lengthOfStay!)}` : 'Solo ida'}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <Price amount={offer.price!.amount} currency={offer.price!.currency} className="text-[40px] leading-none" />
                    <p className="text-2xs text-ink-soft">por adulto, en caché</p>
                  </div>
                </div>
                <div className="mt-4 space-y-4 border-t border-line pt-4">
                  {offer.legs.map((leg, i) => (
                    <LegLine key={leg.journeyId} leg={leg} label={i === 0 ? 'Ida' : 'Vuelta'} />
                  ))}
                </div>
                {/* Flight Refresh de la tarifa de ese día, sin volver al mapa. */}
                <RefreshBox offer={offer} className="mt-5" />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
