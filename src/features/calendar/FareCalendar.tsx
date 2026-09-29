/**
 * Calendario de tarifas: precio más bajo por día de salida (Flight Search, returnMode "Per Day").
 * Grid accesible con flechas del teclado; el color refuerza el precio, que siempre está escrito.
 */
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { useRef } from 'react';
import type { CalendarDay } from '@/api/normalize';
import { cx, formatMoney, formatMonth } from '@/ui/primitives';

const WEEKDAYS = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat('es', { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
const WEEKDAYS_LONG = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat('es', { weekday: 'long' }).format(new Date(2024, 0, 1 + i)));
const iso = (d: Date) => format(d, 'yyyy-MM-dd');
/**
 * Precio de la celda con el símbolo corto de la moneda ("$ 1.782", "€ 890", "R$ 2.100"). El código
 * completo (USD) se indica una vez arriba del calendario y en el aria-label de cada día.
 */
function cellAmount(amount: number, currency: string) {
  try {
    const parts = new Intl.NumberFormat('es-AR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).formatToParts(amount);
    return {
      symbol: parts.find((p) => p.type === 'currency')?.value ?? '',
      number: parts.filter((p) => p.type === 'integer' || p.type === 'group').map((p) => p.value).join(''),
    };
  } catch {
    return { symbol: currency, number: String(Math.round(amount)) };
  }
}

/** 5 escalones por cuantil: el más barato con el color más intenso. */
export function priceBuckets(days: Map<string, CalendarDay>) {
  const prices = [...days.values()].map((d) => d.cheapest.price!.amount).sort((a, b) => a - b);
  const q = (p: number) => prices[Math.min(prices.length - 1, Math.floor(p * prices.length))];
  const cuts = [q(0.2), q(0.4), q(0.6), q(0.8)];
  return (amount: number) => cuts.findIndex((c) => amount <= c) === -1 ? 4 : cuts.findIndex((c) => amount <= c);
}

const BUCKET_CLASS = [
  'bg-cyan text-paper hover:ring-2 hover:ring-ink',
  'bg-[color-mix(in_srgb,var(--cyan)_45%,var(--land))] text-ink hover:ring-2 hover:ring-ink',
  'bg-[color-mix(in_srgb,var(--cyan)_25%,var(--land))] text-ink hover:ring-2 hover:ring-ink',
  'bg-[color-mix(in_srgb,var(--cyan)_10%,var(--land))] text-ink hover:ring-2 hover:ring-ink',
  'bg-land text-ink hover:ring-2 hover:ring-ink',
];

interface Props {
  firstMonth: string;
  monthsShown: number;
  days: Map<string, CalendarDay>;
  selected?: string;
  onSelect: (date: string) => void;
  onNavigate: (firstMonth: string) => void;
  minDate: string;
  maxDate: string;
  loading?: boolean;
}

export function FareCalendar({ firstMonth, monthsShown, days, selected, onSelect, onNavigate, minDate, maxDate, loading }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const bucket = priceBuckets(days);
  const min = Math.min(...[...days.values()].map((d) => d.cheapest.price!.amount));
  const months = Array.from({ length: monthsShown }, (_, i) => addMonths(new Date(`${firstMonth}T12:00:00`), i));
  const lastVisible = iso(endOfMonth(months[months.length - 1]));

  const focusDate = (date: string) => {
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`);
    if (el) el.focus();
    else if (date > lastVisible && date <= maxDate) onNavigate(iso(startOfMonth(new Date(`${date}T12:00:00`))));
    else if (date < firstMonth && date >= minDate) onNavigate(iso(startOfMonth(addMonths(new Date(`${date}T12:00:00`), -(monthsShown - 1)))));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const current = (e.target as HTMLElement).dataset.date;
    if (!current) return;
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    focusDate(iso(addDays(new Date(`${current}T12:00:00`), delta)));
  };

  const tabStop = selected && days.has(selected) ? selected : [...days.keys()].sort()[0];

  return (
    <div ref={gridRef} onKeyDown={onKeyDown} className={cx('grid gap-6 transition-opacity', monthsShown > 1 && 'md:grid-cols-2', loading && 'opacity-60')} aria-busy={loading || undefined}>
      {months.map((month) => {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
        const cells = eachDayOfInterval({ start, end });
        const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
        const monthId = `month-${format(month, 'yyyy-MM')}`;
        return (
          <div key={monthId}>
            <h3 id={monthId} className="mb-2 text-xl first-letter:uppercase">
              {formatMonth(iso(month))}
            </h3>
            <div role="grid" aria-labelledby={monthId} className="w-full">
              <div role="row" className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d, i) => (
                  <div key={i} role="columnheader" aria-label={WEEKDAYS_LONG[i]} className="pb-1 text-center text-2xs text-ink-soft">
                    {d}
                  </div>
                ))}
              </div>
              {weeks.map((week, w) => (
                <div key={w} role="row" className="grid grid-cols-7 gap-1">
                  {week.map((day) => {
                    const date = iso(day);
                    const inMonth = day.getMonth() === month.getMonth();
                    const info = days.get(date);
                    if (!inMonth) return <div key={date} role="gridcell" aria-hidden="true" />;
                    const price = info?.cheapest.price;
                    const shown = price && cellAmount(price.amount, price.currency);
                    const label = price
                      ? `${new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(day)}: desde ${formatMoney(price.amount, price.currency)}${info.cheapest.isNonStop ? ', directo' : ''}${price.amount === min ? ', el precio más bajo' : ''}`
                      : undefined;
                    return (
                      <div key={date} role="gridcell" aria-selected={selected === date}>
                        {price ? (
                          <button
                            type="button"
                            data-date={date}
                            tabIndex={date === tabStop ? 0 : -1}
                            aria-label={label}
                            aria-pressed={selected === date}
                            onClick={() => onSelect(date)}
                            className={cx(
                              'relative flex h-14 w-full flex-col items-center justify-center rounded-md transition-shadow sm:h-16',
                              BUCKET_CLASS[bucket(price.amount)],
                              selected === date && 'ring-2 ring-magenta ring-offset-2 ring-offset-paper hover:ring-magenta',
                            )}
                          >
                            <span className="text-2xs leading-none opacity-80 tabular">{day.getDate()}</span>
                            <span className="mt-1 whitespace-nowrap font-display text-[14px] font-semibold leading-none tabular sm:text-[16px]">
                              <span className="mr-px text-[0.75em] font-medium">{shown?.symbol}</span>
                              {shown?.number}
                            </span>
                            {price.amount === min && <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-magenta" aria-hidden="true" />}
                          </button>
                        ) : (
                          <div className="flex h-14 flex-col items-center justify-center rounded-md text-ink-soft/60 sm:h-16" aria-label={`${day.getDate()}: sin tarifa`}>
                            <span className="text-2xs tabular">{day.getDate()}</span>
                            <span className="text-2xs">{loading ? '…' : date < minDate || date > maxDate ? '' : '—'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-ink-soft">
      <span className="flex items-center gap-1.5">
        Más barato
        <span className="flex" aria-hidden="true">
          {BUCKET_CLASS.map((c, i) => (
            <span key={i} className={cx('h-3 w-5 first:rounded-l last:rounded-r border-y border-line first:border-l last:border-r', c.split(' ')[0])} />
          ))}
        </span>
        Más caro
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-magenta" aria-hidden="true" /> Precio mínimo del período
      </span>
    </div>
  );
}
