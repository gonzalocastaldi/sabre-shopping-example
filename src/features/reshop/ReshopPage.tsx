/**
 * Cambiar un viaje (Flight Reshop): busca opciones de cambio para un PNR o ticket existente,
 * con flexibilidad de ±3 días. Solo búsqueda: no se ejecuta ningún cambio.
 * En vivo requiere un ticket/PNR real del PCC; por defecto se usa en modo mock.
 */
import { useId, useState } from 'react';
import { describeError } from '@/api/client';
import { useFlightReshop } from '@/api/hooks';
import { plusDays, today, type ReshopForm } from '@/api/mappers';
import type { TripOffer } from '@/api/normalize';
import { useSettings } from '@/app/settings';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { LegLine } from '@/features/shared/travel';
import { PlaceCombobox } from '@/ui/PlaceCombobox';
import { Button, Notice, cx, formatDate, formatMoney } from '@/ui/primitives';

const CHARGE_LABEL: Record<string, { label: string; tone: string }> = {
  'Add collect': { label: 'Pagás la diferencia', tone: 'text-warn' },
  Even: { label: 'Misma tarifa', tone: 'text-cyan' },
  Refund: { label: 'Te queda saldo a favor', tone: 'text-cyan' },
  Unknown: { label: 'Diferencia a confirmar', tone: 'text-ink-soft' },
};

function ExchangeRow({ offer }: { offer: TripOffer }) {
  const diff = offer.priceDifference;
  const currency = diff?.currencyCode ?? 'USD';
  const total = Number(diff?.grandTotal ?? 0);
  const fareDiff = Number(diff?.subtotalBeforeFee ?? total);
  const fee = Math.max(0, total - fareDiff);
  const info = CHARGE_LABEL[diff?.type ?? 'Unknown'] ?? CHARGE_LABEL.Unknown;
  const signed = (n: number) => (n === 0 ? formatMoney(0, currency) : `${n > 0 ? '+' : '−'}${formatMoney(Math.abs(n), currency)}`);
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-line bg-land p-4 md:flex-row md:items-center">
      <div className="min-w-0 flex-1 space-y-3">
        {offer.legs.map((leg, i) => (
          <LegLine key={leg.journeyId} leg={leg} label={`${i === 0 ? 'Ida' : 'Vuelta'}, ${formatDate(leg.segments[0]?.departDate ?? leg.departDate)}`} />
        ))}
      </div>
      <div className="shrink-0 md:w-56 md:text-right">
        <p className={cx('text-sm font-medium', info.tone)}>{info.label}</p>
        <p className="font-display text-[28px] font-semibold leading-none tabular">{signed(total)}</p>
        <dl className="mt-1 text-2xs text-ink-soft tabular">
          <div className="flex justify-between gap-3 md:justify-end">
            <dt>Diferencia de tarifa</dt>
            <dd>{signed(fareDiff)}</dd>
          </div>
          {fee > 0 && (
            <div className="flex justify-between gap-3 md:justify-end">
              <dt>Cargo por cambio</dt>
              <dd>+{formatMoney(fee, currency)}</dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
}

export function ReshopPage() {
  const settings = useSettings();
  const ids = { ref: useId(), dep: useId(), ret: useId() };
  const reshop = useFlightReshop();
  const [form, setForm] = useState<ReshopForm>({
    reference: settings.apiMode === 'mock' ? 'GLEBNY' : '',
    referenceType: 'booking',
    origin: 'DFW',
    destination: 'LAX',
    departDate: plusDays(today(), 30),
    flexibleDates: true,
  });
  const [roundTrip, setRoundTrip] = useState(false);
  const [problem, setProblem] = useState<string>();
  const set = (patch: Partial<ReshopForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setProblem(undefined);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = form.reference.trim();
    if (form.referenceType === 'booking' && !/^[A-Za-z0-9]{6,}$/.test(ref)) return setProblem('El código de reserva tiene 6 caracteres o más, letras y números (ej.: GLEBNY).');
    if (form.referenceType === 'ticket' && !/^\d{13}([\s,]+\d{13})*$/.test(ref)) return setProblem('Cada número de ticket tiene 13 dígitos (ej.: 0012972101507).');
    if (!form.origin || !form.destination) return setProblem('Elegí origen y destino del nuevo itinerario.');
    reshop.mutate({ ...form, reference: ref, returnDate: roundTrip ? form.returnDate ?? plusDays(form.departDate, 7) : undefined });
  };

  const offers = reshop.data?.offers ?? [];
  const byDate = new Map<string, TripOffer[]>();
  for (const o of offers) {
    const d = o.legs[0]?.segments[0]?.departDate ?? o.legs[0]?.departDate ?? '';
    byDate.set(d, [...(byDate.get(d) ?? []), o]);
  }
  const error = reshop.error ? describeError(reshop.error) : undefined;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6">
      <h1 className="text-[34px] sm:text-[44px]">Cambiar un viaje</h1>
      <p className="max-w-2xl text-lg text-ink-soft">
        Flight Reshop busca opciones de cambio para un ticket ya emitido y calcula la diferencia de tarifa. Es solo una búsqueda: no modifica la reserva.
      </p>
      {settings.apiMode === 'live' && (
        <div className="mt-4">
          <Notice tone="info" title="En vivo necesitás un PNR o ticket real de tu PCC">
            Flight Reshop es beta y solo responde sobre tickets existentes. Sin uno, pasá a datos de ejemplo desde el indicador de conexión. Los datos del ticket se ocultan en el API Inspector y nunca se graban.
          </Notice>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="space-y-4 self-start rounded-2xl border border-line bg-land p-5" aria-label="Datos del cambio">
          <fieldset>
            <legend className="mb-2 text-2xs font-medium text-ink-soft">Buscar por</legend>
            <div role="radiogroup" className="inline-flex rounded-lg bg-ink/[0.06] p-0.5">
              {(['booking', 'ticket'] as const).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={form.referenceType === t} onClick={() => set({ referenceType: t, reference: '' })} className={cx('h-8 rounded-md px-3 text-sm', form.referenceType === t ? 'bg-land font-medium shadow-sm' : 'text-ink-soft')}>
                  {t === 'booking' ? 'Código de reserva' : 'Número de ticket'}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={ids.ref} className="mb-1 block text-2xs font-medium text-ink-soft">
              {form.referenceType === 'booking' ? 'Código de reserva (PNR)' : 'Números de ticket, separados por coma'}
            </label>
            <input
              id={ids.ref}
              name="referencia"
              autoComplete="off"
              spellCheck={false}
              inputMode={form.referenceType === 'ticket' ? 'numeric' : 'text'}
              value={form.reference}
              onChange={(e) => set({ reference: e.target.value })}
              placeholder={form.referenceType === 'booking' ? 'Ej.: GLEBNY…' : 'Ej.: 0012972101507…'}
              className="h-10 w-full rounded-lg border border-line bg-land px-3 uppercase tracking-wide"
            />
          </div>
          <PlaceCombobox label="Nuevo origen" value={form.origin ? [form.origin] : []} onChange={([v]) => set({ origin: v })} />
          <PlaceCombobox label="Nuevo destino" value={form.destination ? [form.destination] : []} onChange={([v]) => set({ destination: v })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={ids.dep} className="mb-1 block text-2xs font-medium text-ink-soft">
                Nueva ida
              </label>
              <input id={ids.dep} name="nueva-ida" type="date" min={today()} value={form.departDate} onChange={(e) => set({ departDate: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-land px-2" />
            </div>
            <div>
              <label htmlFor={ids.ret} className="mb-1 block text-2xs font-medium text-ink-soft">
                Nueva vuelta
              </label>
              <input
                id={ids.ret}
                name="nueva-vuelta"
                type="date"
                min={form.departDate}
                disabled={!roundTrip}
                value={roundTrip ? form.returnDate ?? plusDays(form.departDate, 7) : ''}
                onChange={(e) => set({ returnDate: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-land px-2 disabled:opacity-40"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="accent-[var(--magenta)]" />
            El viaje tiene vuelta
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={form.flexibleDates} onChange={(e) => set({ flexibleDates: e.target.checked })} className="mt-1 accent-[var(--magenta)]" />
            <span>
              Fechas flexibles, ±3 días
              <span className="block text-2xs text-ink-soft">departureDateFlexibility.plusMinusDays: una opción por fecha alternativa.</span>
            </span>
          </label>
          <p aria-live="polite" className="text-sm text-danger">
            {problem}
          </p>
          <Button type="submit" size="lg" className="w-full" loading={reshop.isPending} loadingText="Buscando opciones…">
            Buscar opciones de cambio
          </Button>
        </form>

        <section aria-labelledby="reshop-results" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 id="reshop-results" className="text-2xl">
              {reshop.isSuccess ? `${offers.length} opciones de cambio` : 'Opciones de cambio'}
            </h2>
            <ApiSourceTag api="flightReshop">Calculado por</ApiSourceTag>
          </div>
          {error && (
            <Notice tone="error" title={error.title}>
              {error.detail}
            </Notice>
          )}
          {!reshop.data && !error && (
            <div className="rounded-xl border border-dashed border-ink/25 p-6 text-ink-soft">
              Completá el código de reserva y las nuevas fechas. Vas a ver cada alternativa con la diferencia a pagar o el saldo a favor.
            </div>
          )}
          {reshop.isSuccess && !offers.length && (
            <div className="rounded-xl border border-line bg-land p-6">
              <p className="text-lg font-medium">No hay opciones de cambio para ese itinerario</p>
              <p className="mt-1 text-ink-soft">Probá activar las fechas flexibles o elegir otra fecha de ida.</p>
            </div>
          )}
          <div className="space-y-6">
            {[...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => (
              <div key={date}>
                <h3 className="mb-2 text-lg">
                  {formatDate(date)}
                  {date === form.departDate ? <span className="ml-2 text-sm font-normal text-ink-soft">fecha pedida</span> : null}
                </h3>
                <ul className="space-y-3">
                  {list.map((o) => (
                    <ExchangeRow key={o.id} offer={o} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
