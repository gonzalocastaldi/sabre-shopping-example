/**
 * Piezas de viaje reutilizables: tramo de itinerario, monograma de aerolínea,
 * estado de validación de Flight Refresh y selector de pasajeros.
 */
import * as Popover from '@radix-ui/react-popover';
import type { BookingClassCodeValidation } from '@/api/mosaic';
import type { Leg } from '@/api/normalize';
import type { Travelers } from '@/api/mappers';
import { airlineName } from '@/data/airlines';
import { PASSENGER_TYPES } from '@/data/catalog';
import { placeLabel } from '@/data/geo';
import { IconAlert, IconCheck, IconChevronDown, IconSwap } from '@/ui/icons';
import { cx, formatDate, formatDuration } from '@/ui/primitives';

export function AirlineMark({ code, size = 32 }: { code: string; size?: number }) {
  // Color estable por aerolínea, dentro de la paleta (sin logos de marcas).
  const hues = ['var(--ink)', 'var(--cyan)', 'var(--magenta)', 'var(--ink-soft)'];
  const color = hues[(code.charCodeAt(0) + code.charCodeAt(1)) % hues.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md font-display font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
      title={airlineName(code)}
      translate="no"
    >
      {code}
    </span>
  );
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Una fila de tramo: hora de salida, línea con escalas, hora de llegada. */
export function LegLine({ leg, label }: { leg: Leg; label?: string }) {
  const stopsLabel = leg.stops === 0 ? 'Directo' : leg.stops === 1 ? '1 escala' : `${leg.stops} escalas`;
  const via = leg.segments.slice(0, -1).map((s) => s.to);
  const plusDays = leg.arriveDate && leg.departDate ? dayDiff(leg.departDate, leg.arriveDate) : 0;
  const carriers = Array.from(new Set(leg.segments.map((s) => s.marketingAirline)));
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AirlineMark code={carriers[0] ?? '??'} />
      <div className="min-w-0 flex-1">
        {label && <p className="text-2xs text-ink-soft">{label}</p>}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-[22px] font-semibold leading-none tabular">{leg.departTime ?? '—'}</p>
            <p className="text-2xs text-ink-soft" translate="no">
              {leg.from}
            </p>
          </div>
          <div className="min-w-[72px] flex-1 text-center">
            <p className="text-2xs text-ink-soft tabular">{formatDuration(leg.durationMin)}</p>
            <div className="relative my-1 h-px bg-ink/30">
              {via.map((code, i) => (
                <span key={code + i} className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full border-2 border-land bg-magenta" style={{ left: `${((i + 1) / (via.length + 1)) * 100}%` }} />
              ))}
            </div>
            <p className={cx('text-2xs', leg.stops === 0 ? 'text-cyan' : 'text-ink-soft')}>
              {stopsLabel}
              {via.length ? ` en ${via.join(', ')}` : ''}
            </p>
          </div>
          <div>
            <p className="font-display text-[22px] font-semibold leading-none tabular">
              {leg.arriveTime ?? '—'}
              {plusDays > 0 && (
                <sup className="ml-0.5 text-2xs font-sans text-magenta" aria-label={`llega ${plusDays} día${plusDays > 1 ? 's' : ''} después`}>
                  +{plusDays}
                </sup>
              )}
            </p>
            <p className="text-2xs text-ink-soft" translate="no">
              {leg.to}
            </p>
          </div>
        </div>
        <p className="mt-1 truncate text-2xs text-ink-soft">
          {carriers.map(airlineName).join(' y ')}
          {leg.segments[0] ? `, vuelo ${leg.segments.map((s) => `${s.marketingAirline} ${s.marketingNumber}`).join(' + ')}` : ''}
        </p>
      </div>
    </div>
  );
}

export function RouteTitle({ from, to, roundTrip }: { from: string; to: string; roundTrip?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span>{placeLabel(from)}</span>
      {roundTrip ? <IconSwap size={22} className="text-magenta" aria-label="ida y vuelta" /> : <span aria-label="a" className="text-magenta">→</span>}
      <span>{placeLabel(to)}</span>
    </span>
  );
}

export function LegDates({ legs }: { legs: Leg[] }) {
  return (
    <span className="tabular">
      {legs.map((l) => formatDate(l.departDate)).join(' – ')}
    </span>
  );
}

const VALIDATION: Record<BookingClassCodeValidation, { label: string; detail: string; tone: 'ok' | 'warn' | 'bad' }> = {
  Matched: { label: 'Disponible', detail: 'Hay lugar en la clase tarifaria cotizada.', tone: 'ok' },
  'Same cabin': { label: 'Cambió la clase', detail: 'No quedó lugar en la clase cotizada, pero sí en otra de la misma cabina.', tone: 'warn' },
  'Any other': { label: 'Solo en otra cabina', detail: 'Hay lugar únicamente en otra cabina.', tone: 'warn' },
  None: { label: 'Sin disponibilidad', detail: 'No hay lugar en ninguna clase para este itinerario.', tone: 'bad' },
  Unknown: { label: 'Sin verificar', detail: 'El horario no se pudo validar o la aerolínea está exceptuada del chequeo.', tone: 'warn' },
};

export function ValidationBadge({ value, valid = true, compact }: { value?: BookingClassCodeValidation; valid?: boolean; compact?: boolean }) {
  const info = !valid ? { label: 'Horario no encontrado', detail: 'El vuelo no figura en los horarios publicados.', tone: 'bad' as const } : VALIDATION[value ?? 'Unknown'];
  const Icon = info.tone === 'ok' ? IconCheck : IconAlert;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full text-2xs font-medium',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5',
        info.tone === 'ok' && 'bg-cyan-soft text-cyan',
        info.tone === 'warn' && 'bg-warn/12 text-warn',
        info.tone === 'bad' && 'bg-danger/10 text-danger',
      )}
      title={info.detail}
    >
      <Icon size={13} />
      {info.label}
    </span>
  );
}

export const validationDetail = (value?: BookingClassCodeValidation) => VALIDATION[value ?? 'Unknown'].detail;

export function TravelersPicker({ value, onChange }: { value: Travelers; onChange: (t: Travelers) => void }) {
  const total = value.ADT + value.CNN + value.INF;
  const set = (k: keyof Travelers, delta: number) => {
    const next = { ...value, [k]: Math.max(k === 'ADT' ? 1 : 0, value[k] + delta) };
    if (next.INF > next.ADT) next.INF = next.ADT;
    if (next.ADT + next.CNN + next.INF > 9) return;
    onChange(next);
  };
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-land px-3 hover:border-ink/40">
          <span className="tabular">
            {total} {total === 1 ? 'pasajero' : 'pasajeros'}
          </span>
          <IconChevronDown size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-72 rounded-xl border border-line bg-land p-3 shadow-[0_16px_40px_-20px_rgba(27,36,51,.45)]">
          <ul className="divide-y divide-line">
            {PASSENGER_TYPES.map((p) => (
              <li key={p.code} className="flex items-center gap-3 py-2">
                <div className="flex-1">
                  <p className="font-medium">{p.label}</p>
                  <p className="text-2xs text-ink-soft">{p.hint}</p>
                </div>
                <button type="button" aria-label={`Quitar ${p.label.toLowerCase()}`} className="size-8 rounded-full border border-line hover:border-ink/50 disabled:opacity-30" disabled={value[p.code] <= (p.code === 'ADT' ? 1 : 0)} onClick={() => set(p.code, -1)}>
                  −
                </button>
                <span className="w-4 text-center tabular" aria-live="polite">
                  {value[p.code]}
                </span>
                <button type="button" aria-label={`Agregar ${p.label.toLowerCase()}`} className="size-8 rounded-full border border-line hover:border-ink/50 disabled:opacity-30" disabled={total >= 9 || (p.code === 'INF' && value.INF >= value.ADT)} onClick={() => set(p.code, 1)}>
                  +
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-2xs text-ink-soft">Hasta 9 pasajeros. Un bebé por adulto.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
