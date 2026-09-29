/**
 * Buscador inspiracional (Flight Search). Cuatro campos tipo "tarjeta de embarque",
 * cada uno abre un panel. El estado se confirma en la URL recién al tocar "Buscar destinos".
 */
import * as Popover from '@radix-ui/react-popover';
import * as Slider from '@radix-ui/react-slider';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { useId, useState, type ReactNode } from 'react';
import { MAX_STAY_DAYS, MIN_STAY_DAYS, plusDays, stayDaysBetween, today, type DestinationMode, type OriginMode, type SearchCriteria } from '@/api/mappers';
import { useSettings } from '@/app/settings';
import { defaultWindow } from '@/app/urlState';
import { REGIONS, THEMES, THEME_BY_CODE, REGION_BY_CODE } from '@/data/catalog';
import { countryName, placeLabel } from '@/data/geo';
import { CountryCombobox } from '@/ui/CountryCombobox';
import { PlaceCombobox } from '@/ui/PlaceCombobox';
import { StayDaysSlider } from '@/ui/StayDaysSlider';
import { IconSearch } from '@/ui/icons';
import { Button, ToggleChip, cx, formatDate, formatDays, formatMoney } from '@/ui/primitives';

/** Búsqueda en blanco: sin origen predeterminado (el usuario lo elige). */
export function emptyCriteria(): SearchCriteria {
  const { from, to } = defaultWindow();
  return {
    originMode: 'place',
    origins: [],
    destinationMode: 'anywhere',
    destinations: [],
    exclude: [],
    tripType: 'roundtrip',
    dateMode: 'flexible',
    fromDate: from,
    toDate: to,
    lengthsOfStay: [7],
    nonStop: false,
  };
}

// ---------- Resúmenes para los botones del buscador ----------

function originSummary(c: SearchCriteria) {
  if (!c.origins.length) return 'Elegí el origen';
  if (c.originMode === 'country') return c.origins.map(countryName).join(', ');
  return c.origins.map((o) => `${placeLabel(o)}`).join(', ');
}

function destinationSummary(c: SearchCriteria) {
  switch (c.destinationMode) {
    case 'anywhere':
      return 'Cualquier lugar';
    case 'place':
      return c.destinations.length ? c.destinations.map(placeLabel).join(', ') : 'Elegí un destino';
    case 'country':
      return c.destinations.length ? c.destinations.map(countryName).join(', ') : 'Elegí países';
    case 'region':
      return c.destinations.map((r) => REGION_BY_CODE[r as keyof typeof REGION_BY_CODE]?.label ?? r).join(', ') || 'Elegí una región';
    case 'theme':
      return c.destinations.map((t) => THEME_BY_CODE[t as keyof typeof THEME_BY_CODE]?.label ?? t).join(', ') || 'Elegí temas';
  }
}

const MONTH = new Intl.DateTimeFormat('es', { month: 'short' });
const monthLabel = (iso: string) => MONTH.format(new Date(`${iso}T12:00:00`)).replace('.', '');

function whenSummary(c: SearchCriteria) {
  if (c.dateMode === 'exact') {
    if (!c.departDate) return 'Elegí fechas';
    return c.tripType === 'roundtrip' && c.returnDate ? `${formatDate(c.departDate)} al ${formatDate(c.returnDate)}` : formatDate(c.departDate);
  }
  const from = monthLabel(c.fromDate);
  const to = monthLabel(c.toDate);
  const range = from === to ? from : `${from} a ${to}`;
  if (c.tripType === 'oneway') return `${range}, solo ida`;
  // Un solo valor desde el selector; links viejos pueden traer varios ("3 a 7 días").
  const days = c.lengthsOfStay.length === 1 ? formatDays(c.lengthsOfStay[0]) : `${Math.min(...c.lengthsOfStay)} a ${Math.max(...c.lengthsOfStay)} días`;
  return `${range}, ${days}`;
}

// ---------- Campo tipo tarjeta de embarque ----------

function PassField({ label, value, children, invalid, placeholder, wide }: { label: string; value: string; children: ReactNode; invalid?: boolean; placeholder?: boolean; wide?: boolean }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cx(
            'group flex min-w-0 flex-1 flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-ink/[0.04] data-[state=open]:bg-ink/[0.06]',
            wide && 'sm:flex-[1.4]',
          )}
        >
          <span className="text-2xs text-ink-soft">{label}</span>
          <span className={cx('w-full truncate font-display text-[19px] leading-tight', placeholder ? 'font-medium' : 'font-semibold', invalid ? 'text-danger' : placeholder && 'text-ink-soft')}>{value}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className="z-50 w-[min(92vw,460px)] rounded-xl border border-line bg-land p-4 shadow-[0_20px_48px_-24px_rgba(27,36,51,.55)] [overscroll-behavior:contain]"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-ink/[0.06] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('h-8 rounded-md px-3 text-sm transition-colors', value === o.value ? 'bg-land font-medium shadow-sm' : 'text-ink-soft hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Paneles ----------

function OriginPanel({ c, set }: { c: SearchCriteria; set: (p: Partial<SearchCriteria>) => void }) {
  return (
    <div className="space-y-3">
      <Segmented<OriginMode>
        label="Tipo de origen"
        value={c.originMode}
        onChange={(m) => set({ originMode: m, origins: m === 'country' ? [] : c.origins.slice(0, m === 'place' ? 1 : 10), ...(m !== 'place' && c.destinationMode !== 'place' ? { destinationMode: 'place', destinations: [] } : {}) })}
        options={[
          { value: 'place', label: 'Un lugar' },
          { value: 'multi', label: 'Varios lugares' },
          { value: 'country', label: 'Un país' },
        ]}
      />
      {c.originMode === 'country' ? (
        <CountryCombobox label="País de origen" value={c.origins} onChange={(v) => set({ origins: v })} max={10} />
      ) : (
        <PlaceCombobox label={c.originMode === 'multi' ? 'Aeropuertos o ciudades de origen (hasta 10)' : 'Desde'} value={c.origins} multiple={c.originMode === 'multi'} onChange={(v) => set({ origins: v })} />
      )}
      {c.originMode !== 'place' && (
        <p className="text-sm text-ink-soft">
          Open origin: Flight Search compara desde varios orígenes hacia un destino fijo. Elegí el destino en el campo "A dónde".
        </p>
      )}
    </div>
  );
}

function DestinationPanel({ c, set }: { c: SearchCriteria; set: (p: Partial<SearchCriteria>) => void }) {
  const openOrigin = c.originMode !== 'place';
  const modes: { value: DestinationMode; label: string }[] = openOrigin
    ? [{ value: 'place', label: 'Ciudad o aeropuerto' }]
    : [
        { value: 'anywhere', label: 'Cualquier lugar' },
        { value: 'place', label: 'Ciudad' },
        { value: 'country', label: 'País' },
        { value: 'region', label: 'Región' },
        { value: 'theme', label: 'Tema' },
      ];
  const toggle = (code: string, max: number) =>
    set({ destinations: c.destinations.includes(code) ? c.destinations.filter((d) => d !== code) : [...c.destinations, code].slice(0, max) });

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Tipo de destino" className="flex flex-wrap gap-1.5">
        {modes.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={c.destinationMode === m.value}
            onClick={() => set({ destinationMode: m.value, destinations: [] })}
            className={cx('h-8 rounded-md px-3 text-sm', c.destinationMode === m.value ? 'bg-ink text-paper' : 'bg-ink/[0.06] text-ink-soft hover:text-ink')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {c.destinationMode === 'anywhere' && <p className="text-sm text-ink-soft">Flight Search devuelve la tarifa más baja hacia todos los destinos disponibles desde tu origen.</p>}
      {c.destinationMode === 'place' && (
        <PlaceCombobox label={openOrigin ? 'Destino' : 'Destinos (hasta 10)'} value={c.destinations} multiple={!openOrigin} onChange={(v) => set({ destinations: v })} />
      )}
      {c.destinationMode === 'country' && <CountryCombobox label="Países de destino (hasta 10)" value={c.destinations} onChange={(v) => set({ destinations: v })} />}
      {c.destinationMode === 'region' && (
        <fieldset>
          <legend className="mb-2 text-2xs font-medium text-ink-soft">Zonas ATPCO (hasta 4)</legend>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <ToggleChip key={r.code} pressed={c.destinations.includes(r.code)} onToggle={() => toggle(r.code, 4)}>
                {r.label}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      )}
      {c.destinationMode === 'theme' && (
        <fieldset>
          <legend className="mb-2 text-2xs font-medium text-ink-soft">Temas de Sabre (hasta 4)</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.code}
                type="button"
                aria-pressed={c.destinations.includes(t.code)}
                onClick={() => toggle(t.code, 4)}
                className={cx('rounded-lg border px-3 py-2 text-left', c.destinations.includes(t.code) ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/40')}
              >
                <span className="block font-medium">{t.label}</span>
                <span className={cx('block text-2xs', c.destinations.includes(t.code) ? 'text-paper/75' : 'text-ink-soft')}>{t.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {!openOrigin && c.destinationMode !== 'place' && (
        <CountryCombobox label="Excluir países (opcional)" value={c.exclude} onChange={(v) => set({ exclude: v })} placeholder="Ej.: Brasil…" />
      )}
    </div>
  );
}

function WhenPanel({ c, set }: { c: SearchCriteria; set: (p: Partial<SearchCriteria>) => void }) {
  const ids = { dep: useId(), ret: useId() };
  const first = startOfMonth(new Date());
  const months = Array.from({ length: 11 }, (_, i) => addMonths(first, i));
  const maxDate = plusDays(today(), 330);
  const selectedMonths = months.filter((m) => {
    const start = format(m, 'yyyy-MM-dd');
    const end = format(endOfMonth(m), 'yyyy-MM-dd');
    return end >= c.fromDate && start <= c.toDate;
  });

  const clickMonth = (m: Date) => {
    const start = format(m, 'yyyy-MM-dd') < today() ? plusDays(today(), 1) : format(m, 'yyyy-MM-dd');
    const end = format(endOfMonth(m), 'yyyy-MM-dd') > maxDate ? maxDate : format(endOfMonth(m), 'yyyy-MM-dd');
    // Primer clic: un mes. Segundo clic en otro mes: extiende el rango.
    if (selectedMonths.length === 1 && format(selectedMonths[0], 'yyyy-MM') !== format(m, 'yyyy-MM')) {
      set({ fromDate: start < c.fromDate ? start : c.fromDate, toDate: end > c.toDate ? end : c.toDate });
    } else set({ fromDate: start, toDate: end });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Segmented
          label="Tipo de viaje"
          value={c.tripType}
          onChange={(t) => set({ tripType: t })}
          options={[
            { value: 'roundtrip', label: 'Ida y vuelta' },
            { value: 'oneway', label: 'Solo ida' },
          ]}
        />
        <Segmented
          label="Fechas"
          value={c.dateMode}
          onChange={(d) => set({ dateMode: d, ...(d === 'exact' && !c.departDate ? { departDate: c.fromDate, returnDate: plusDays(c.fromDate, c.lengthsOfStay[0] ?? 7) } : {}) })}
          options={[
            { value: 'flexible', label: 'Flexibles' },
            { value: 'exact', label: 'Exactas' },
          ]}
        />
      </div>

      {c.dateMode === 'flexible' ? (
        <>
          <fieldset>
            <legend className="mb-2 text-2xs font-medium text-ink-soft">Salir en (tocá dos meses para un rango)</legend>
            <div className="grid grid-cols-4 gap-1.5">
              {months.map((m) => {
                const pressed = selectedMonths.some((s) => s.getTime() === m.getTime());
                return (
                  <button
                    key={m.toISOString()}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => clickMonth(m)}
                    className={cx('rounded-lg border px-2 py-1.5 text-center', pressed ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/40')}
                  >
                    <span className="block text-sm font-medium capitalize">{MONTH.format(m).replace('.', '')}</span>
                    <span className={cx('block text-2xs tabular', pressed ? 'text-paper/70' : 'text-ink-soft')}>{m.getFullYear()}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-2xs text-ink-soft">
              Rango de salida: {formatDate(c.fromDate)} al {formatDate(c.toDate)}. Flight Search admite hasta 330 días desde hoy.
            </p>
          </fieldset>
          {c.tripType === 'roundtrip' && (
            <StayDaysSlider
              value={c.lengthsOfStay[0] ?? 7}
              onChange={(days) => set({ lengthsOfStay: [days] })}
              hint={`Se envía como lengthsOfStay. Flight Search acepta de ${MIN_STAY_DAYS} a ${MAX_STAY_DAYS} días.`}
            />
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={ids.dep} className="mb-1 block text-2xs font-medium text-ink-soft">
              Ida
            </label>
            <input id={ids.dep} name="salida" type="date" min={today()} max={maxDate} value={c.departDate ?? ''} onChange={(e) => set({ departDate: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-land px-2" />
          </div>
          {c.tripType === 'roundtrip' && (
            <div>
              <label htmlFor={ids.ret} className="mb-1 block text-2xs font-medium text-ink-soft">
                Vuelta
              </label>
              {/* Flight Search acepta viajes de 1 a 21 días. */}
              <input
                id={ids.ret}
                name="regreso"
                type="date"
                min={c.departDate ? plusDays(c.departDate, MIN_STAY_DAYS) : today()}
                max={c.departDate ? plusDays(c.departDate, MAX_STAY_DAYS) : undefined}
                value={c.returnDate ?? ''}
                onChange={(e) => set({ returnDate: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-land px-2"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OptionsPanel({ c, set, currency }: { c: SearchCriteria; set: (p: Partial<SearchCriteria>) => void; currency: string }) {
  const id = useId();
  const max = currency === 'USD' || currency === 'EUR' ? 3000 : 3000 * ({ ARS: 1400, UYU: 40, BRL: 5.4, CLP: 950, MXN: 18, COP: 4000, PEN: 3.7 }[currency] ?? 1);
  const step = max / 60;
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span id={`${id}-label`} className="text-sm font-medium">
            Presupuesto máximo por persona
          </span>
          <span className="font-display text-lg font-semibold tabular">{c.budget ? formatMoney(c.budget, currency, { compact: true }) : 'Sin límite'}</span>
        </div>
        <Slider.Root
          className="relative flex h-6 w-full touch-none select-none items-center"
          min={0}
          max={max}
          step={step}
          value={[c.budget ?? 0]}
          onValueChange={([v]) => set({ budget: v ? Math.round(v) : undefined })}
          aria-labelledby={`${id}-label`}
        >
          <Slider.Track className="relative h-1 grow rounded-full bg-ink/15">
            <Slider.Range className="absolute h-full rounded-full bg-ink" />
          </Slider.Track>
          <Slider.Thumb aria-labelledby={`${id}-label`} className="block size-5 rounded-full border-2 border-ink bg-land focus-visible:outline-2 focus-visible:outline-cyan" />
        </Slider.Root>
        <p className="mt-1 text-2xs text-ink-soft">Se envía como processingOptions.budget. En 0 no se filtra.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={c.nonStop} onChange={(e) => set({ nonStop: e.target.checked })} className="mt-1 size-4 accent-[var(--magenta)]" />
        <span>
          <span className="block font-medium">Mostrar también la tarifa directa más baja</span>
          <span className="block text-sm text-ink-soft">Activa returnLowestNonStopFare: dos precios por destino, el más barato y el más barato sin escalas.</span>
        </span>
      </label>
    </div>
  );
}

// ---------- Formulario ----------

export function validateCriteria(c: SearchCriteria): string | undefined {
  if (!c.origins.length) return 'Elegí desde dónde salís.';
  if (c.originMode !== 'place' && (c.destinationMode !== 'place' || c.destinations.length !== 1)) return 'Con varios orígenes, elegí un único destino (ciudad o aeropuerto).';
  if (['place', 'country', 'region', 'theme'].includes(c.destinationMode) && !c.destinations.length) return 'Elegí al menos un destino o volvé a "Cualquier lugar".';
  if (c.dateMode === 'exact' && !c.departDate) return 'Elegí la fecha de ida.';
  if (c.dateMode === 'exact' && c.tripType === 'roundtrip') {
    if (!c.returnDate || c.returnDate <= c.departDate!) return 'La vuelta tiene que ser después de la ida.';
    if (stayDaysBetween(c.departDate!, c.returnDate) > MAX_STAY_DAYS) return `Flight Search admite viajes de ${MIN_STAY_DAYS} a ${MAX_STAY_DAYS} días.`;
  }
  return undefined;
}

export function SearchForm({ initial, onSubmit, busy }: { initial: SearchCriteria; onSubmit: (c: SearchCriteria) => void; busy?: boolean }) {
  const { currency } = useSettings();
  const [c, setC] = useState(initial);
  const [error, setError] = useState<string>();
  const set = (patch: Partial<SearchCriteria>) => {
    setC((prev) => ({ ...prev, ...patch }));
    setError(undefined);
  };

  return (
    <form
      role="search"
      aria-label="Buscar destinos"
      onSubmit={(e) => {
        e.preventDefault();
        const problem = validateCriteria(c);
        if (problem) setError(problem);
        else onSubmit(c);
      }}
      className="rounded-2xl border border-line bg-land p-1.5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-stretch">
        {/* En rojo solo después de intentar buscar sin origen, no de entrada. */}
        <PassField label="Desde" value={originSummary(c)} invalid={Boolean(error) && !c.origins.length} placeholder={!c.origins.length}>
          <OriginPanel c={c} set={set} />
        </PassField>
        <div className="perforation hidden sm:block" aria-hidden="true" />
        <PassField label="A dónde" value={destinationSummary(c)} wide>
          <DestinationPanel c={c} set={set} />
        </PassField>
        <div className="perforation hidden sm:block" aria-hidden="true" />
        <PassField label="Cuándo" value={whenSummary(c)} wide>
          <WhenPanel c={c} set={set} />
        </PassField>
        <div className="perforation hidden sm:block" aria-hidden="true" />
        <PassField label="Opciones" value={[c.budget ? `Hasta ${formatMoney(c.budget, currency, { compact: true })}` : 'Sin tope', c.nonStop ? 'con directos' : ''].filter(Boolean).join(', ')}>
          <OptionsPanel c={c} set={set} currency={currency} />
        </PassField>
        <Button type="submit" size="lg" loading={busy} loadingText="Buscando…" className="m-1 sm:w-auto">
          <IconSearch size={18} />
          Buscar destinos
        </Button>
      </div>
      <p aria-live="polite" className={cx('px-3 text-sm text-danger', error ? 'py-1.5' : 'sr-only')}>
        {error}
      </p>
    </form>
  );
}
