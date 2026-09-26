/**
 * Revisión de la oferta (Flight Check): revalida precio y disponibilidad de la oferta elegida
 * (por payload si es ATPCO/caché, por offerItemIds si es NDC) y muestra equipaje, reglas,
 * impuestos y brands alternativos. En PROD la demo termina acá: no se reserva.
 */
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { API_META, describeError } from '@/api/client';
import { useFlightCheck } from '@/api/hooks';
import { resolvePolicies, type TripOffer } from '@/api/normalize';
import { loadSelectedOffer } from '@/app/offerStore';
import { checkRoute } from '@/app/router';
import { travelersFromSearch } from '@/app/urlState';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { LegLine, PolicyList, RouteTitle, ValidationBadge, validationDetail } from '@/features/shared/travel';
import { IconInfo, IconShield } from '@/ui/icons';
import { Button, Notice, Price, Skeleton, cx, formatDate, formatMoney } from '@/ui/primitives';

const PTC_LABEL: Record<string, string> = { ADT: 'Adulto', CNN: 'Niño', INF: 'Bebé' };

function PriceCompare({ before, after, beforeLabel }: { before?: TripOffer['price']; after?: TripOffer['price']; beforeLabel: string }) {
  if (!before || !after) return null;
  const diff = after.amount - before.amount;
  const pct = (diff / before.amount) * 100;
  const same = Math.abs(pct) < 0.5;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div>
        <p className="text-2xs text-ink-soft">{beforeLabel}</p>
        <Price amount={before.amount} currency={before.currency} precise className="text-2xl text-ink-soft line-through decoration-1" />
      </div>
      <div>
        <p className="text-2xs text-ink-soft">Precio revalidado</p>
        <Price amount={after.amount} currency={after.currency} precise className="text-[34px] leading-none" />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className="text-2xs text-ink-soft">Diferencia</p>
        <p className={cx('font-display text-2xl font-semibold tabular', same ? 'text-cyan' : diff > 0 ? 'text-warn' : 'text-cyan')}>
          {same ? 'Sin cambios' : `${diff > 0 ? '+' : '−'}${formatMoney(Math.abs(diff), after.currency, { precise: true })}`}
        </p>
        {!same && <p className="text-2xs text-ink-soft tabular">{`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}</p>}
      </div>
    </div>
  );
}

export function CheckPage() {
  const { offerId } = checkRoute.useParams();
  const search = checkRoute.useSearch();
  const stored = useMemo(() => loadSelectedOffer(offerId), [offerId]);
  const travelers = stored?.travelers ?? travelersFromSearch(search.pax);
  const check = useFlightCheck(stored?.offer, travelers);
  const [brandId, setBrandId] = useState<string>();

  if (!stored) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <h1 className="text-4xl">Esta oferta ya no está disponible</h1>
        <p className="mt-2 text-ink-soft">Las ofertas viven en la pestaña donde se eligieron y vencen a los pocos minutos. Volvé a buscar para revisarla.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-magenta px-4 font-medium text-white">
          Explorar destinos
        </Link>
      </div>
    );
  }

  const original = stored.offer;
  const checked = check.data?.offers ?? [];
  const main = checked[0];
  const current = checked.find((o) => o.id === brandId) ?? main;
  const policies = current ? resolvePolicies(current, check.data?.response.offerAttributes) : {};
  const taxItems = check.data?.response.taxItems ?? [];
  const taxes = current ? taxItems.filter((t) => current.taxItemRefs.includes(t.id)) : [];
  const validation = check.data?.response.offerValidationResults?.find((v) => v.offerRef === current?.id)?.bookingClassCodeValidation ?? current?.validation;
  const error = check.error ? describeError(check.error) : undefined;
  const first = original.legs[0];
  const last = original.legs[original.legs.length - 1];
  const method = original.distributionModel === 'NDC' ? 'offerItemIds (NDC)' : 'payload del itinerario (ATPCO)';

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-5 sm:px-6">
      <nav aria-label="Migas" className="text-sm text-ink-soft">
        <button type="button" onClick={() => history.back()} className="hover:text-ink hover:underline">
          Volver a los resultados
        </button>
      </nav>
      <h1 className="mt-2 text-[34px] sm:text-[40px]">
        Revisión de la oferta
      </h1>
      <p className="text-lg text-ink-soft">
        <RouteTitle from={first.from} to={original.legs.length > 1 ? first.to : last.to} roundTrip={original.legs.length > 1} />
        <span className="ml-2 tabular">
          {formatDate(first.departDate)}
          {original.legs.length > 1 ? ` al ${formatDate(last.departDate)}` : ''}
        </span>
      </p>

      <section aria-labelledby="price-title" className="mt-6 rounded-2xl border border-line bg-land p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="price-title" className="text-2xl">
            Precio y disponibilidad
          </h2>
          <span className="flex-1" />
          <ApiSourceTag api="flightCheck">Revalidado con</ApiSourceTag>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Flight Check recrea la oferta por {method} sin tomar inventario, y confirma precio y clase tarifaria antes del checkout.
        </p>
        <div className="mt-4">
          {check.isLoading && (
            <div className="space-y-2" role="status" aria-label="Revalidando con Flight Check">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          )}
          {error && (
            <Notice tone="error" title={error.title}>
              {error.detail}
            </Notice>
          )}
          {check.isSuccess && !main && (
            <Notice tone="warn" title="Flight Check no devolvió una oferta válida">
              La tarifa ya no está disponible en esa clase. Volvé al calendario para elegir otra fecha o consultá vuelos en vivo.
            </Notice>
          )}
          {current && (
            <>
              <PriceCompare before={original.price} after={current.price} beforeLabel={stored.source === 'flightSearch' ? 'Precio en caché (Flight Search)' : `Precio en ${API_META[stored.source].label}`} />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ValidationBadge value={validation} />
                <span className="text-sm text-ink-soft">{validationDetail(validation)}</span>
              </div>
              {current.validUntil && (
                <p className="mt-2 text-2xs text-ink-soft">
                  Oferta válida hasta las {new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(current.validUntil))}.
                </p>
              )}
            </>
          )}
          {check.data?.response.warnings?.map((w, i) => (
            <div key={i} className="mt-3">
              <Notice tone="warn" title="Mensaje de la aerolínea">
                {w.description ?? w.type}
              </Notice>
            </div>
          ))}
        </div>
      </section>

      {checked.length > 1 && (
        <section aria-labelledby="brands-title" className="mt-6">
          <h2 id="brands-title" className="text-2xl">
            Otras tarifas para el mismo vuelo
          </h2>
          <p className="text-sm text-ink-soft">Upsell devuelto por Flight Check (returnAdditionalOffers).</p>
          <div role="radiogroup" aria-labelledby="brands-title" className="mt-3 grid gap-3 sm:grid-cols-3">
            {checked.map((o) => {
              const active = o.id === current?.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setBrandId(o.id)}
                  className={cx('rounded-xl border bg-land p-4 text-left transition-colors', active ? 'border-magenta ring-1 ring-magenta' : 'border-line hover:border-ink/40')}
                >
                  <span className="block font-display text-xl font-semibold">{o.brandNames[0] ?? 'Tarifa'}</span>
                  <Price amount={o.price!.amount} currency={o.price!.currency} className="text-xl" />
                  <PolicyList policies={resolvePolicies(o, check.data?.response.offerAttributes)} className="mt-2" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="itin-title" className="mt-6 rounded-2xl border border-line bg-land p-5">
        <h2 id="itin-title" className="text-2xl">
          Itinerario
        </h2>
        <div className="mt-4 space-y-5">
          {(current ?? original).legs.map((leg, i) => (
            <div key={leg.journeyId}>
              <LegLine leg={leg} label={i === 0 ? `Ida, ${formatDate(leg.departDate)}` : `Vuelta, ${formatDate(leg.departDate)}`} />
              <ul className="ml-11 mt-2 space-y-0.5 text-2xs text-ink-soft">
                {leg.segments.map((s) => (
                  <li key={s.flightId} translate="no">
                    {s.marketingAirline} {s.marketingNumber}, {s.from} a {s.to}, clase {s.bookingClass ?? '—'}
                    {s.cabin ? ` (${s.cabin})` : ''}
                    {s.fareBasis ? `, fare basis ${s.fareBasis}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {current && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section aria-labelledby="pol-title" className="rounded-2xl border border-line bg-land p-5">
            <h2 id="pol-title" className="text-2xl">
              Equipaje y flexibilidad
            </h2>
            <PolicyList policies={policies} className="mt-3" />
          </section>
          <section aria-labelledby="tax-title" className="rounded-2xl border border-line bg-land p-5">
            <h2 id="tax-title" className="text-2xl">
              Desglose por pasajero
            </h2>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">Tarifa base e impuestos por tipo de pasajero</caption>
              <thead>
                <tr className="text-left text-2xs text-ink-soft">
                  <th className="pb-1 font-normal">Pasajero</th>
                  <th className="pb-1 text-right font-normal">Base</th>
                  <th className="pb-1 text-right font-normal">Impuestos</th>
                  <th className="pb-1 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {current.travelers.map((t) => (
                  <tr key={t.ptc} className="border-t border-line">
                    <td className="py-1.5">
                      {t.count} {PTC_LABEL[t.ptc] ?? t.ptc}
                    </td>
                    <td className="py-1.5 text-right">{t.base !== undefined ? formatMoney(t.base, t.currency ?? 'USD', { precise: true }) : '—'}</td>
                    <td className="py-1.5 text-right">{t.taxes !== undefined ? formatMoney(t.taxes, t.currency ?? 'USD', { precise: true }) : '—'}</td>
                    <td className="py-1.5 text-right font-medium">{t.total !== undefined ? formatMoney(t.total, t.currency ?? 'USD', { precise: true }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {taxes.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-ink-soft hover:text-ink">Ver impuestos del adulto ({taxes.length})</summary>
                <ul className="mt-2 space-y-1">
                  {taxes.map((t) => (
                    <li key={t.id} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <span translate="no">{t.taxCode}</span> {t.taxDescription?.toLowerCase()}
                      </span>
                      <span className="tabular">{formatMoney(Number(t.amount), t.currencyCode, { precise: true })}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>
      )}

      <section aria-labelledby="next-title" className="mt-6 flex flex-col gap-4 rounded-2xl border border-dashed border-ink/25 p-5 sm:flex-row sm:items-center">
        <IconShield className="shrink-0 text-cyan" size={28} />
        <div className="flex-1">
          <h2 id="next-title" className="text-xl">
            La demo termina en la revisión
          </h2>
          <p className="text-sm text-ink-soft">
            Estamos en Sabre PROD y el alcance es solo shopping: no se crean reservas ni se emiten tickets. En una OTA real, el siguiente paso sería la orden con Booking u Order Management.
          </p>
        </div>
        <Button disabled title="No disponible en esta demo de shopping">
          Reservar
        </Button>
      </section>
      <p className="mt-4 flex items-center gap-1.5 text-2xs text-ink-soft">
        <IconInfo size={14} /> Los precios incluyen impuestos y cargos informados por Sabre.
      </p>
    </div>
  );
}
