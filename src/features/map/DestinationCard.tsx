/**
 * Tarjeta del destino elegido en el mapa: la oferta en caché de Flight Search y su
 * validación con Flight Refresh (un request, un itinerario). Flota sobre el mapa:
 * abajo a la izquierda en desktop, hoja inferior en mobile.
 */
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState, type Ref } from 'react';
import { describeError } from '@/api/client';
import { useFlightRefresh, type RefreshResult } from '@/api/hooks';
import type { Travelers } from '@/api/mappers';
import type { DestinationSummary, TripOffer } from '@/api/normalize';
import { countryName, getPlace, placeLabel } from '@/data/geo';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { LegLine, RouteTitle, TravelersPicker, ValidationBadge, validationDetail } from '@/features/shared/travel';
import { IconCalendar, IconClose, IconShield } from '@/ui/icons';
import { Button, IconButton, Notice, Price, cx, formatDate, formatDays } from '@/ui/primitives';

interface Props {
  summary: DestinationSummary;
  openOrigin: boolean;
  calendarLink: { code: string; search: Record<string, string | undefined> };
  onClose: () => void;
  ref?: Ref<HTMLElement>;
}

function RefreshResultView({ offer, result }: { offer: TripOffer; result: RefreshResult }) {
  const journeys = result.cabinAvailability?.journeys ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ValidationBadge value={result.bookingClassCodeValidation} valid={result.isItineraryValid} />
        <span className={cx('text-2xs', result.isItineraryValid ? 'text-cyan' : 'text-danger')}>
          {result.isItineraryValid ? 'Horario publicado (OAG)' : 'Horario no encontrado'}
        </span>
      </div>
      {result.isItineraryValid && <p className="text-sm text-ink-soft">{validationDetail(result.bookingClassCodeValidation)}</p>}
      {journeys.length > 0 && (
        <table className="w-full text-sm">
          <caption className="mb-1 text-left text-2xs text-ink-soft">Asientos disponibles por clase (cabinAvailability)</caption>
          <thead className="sr-only">
            <tr>
              <th>Vuelo</th>
              <th>Clases y asientos</th>
            </tr>
          </thead>
          <tbody>
            {journeys.flatMap((journey, j) =>
              journey.flights.map((flight, f) => {
                const segment = offer.legs[j]?.segments[f];
                return (
                  <tr key={`${j}-${f}`} className="border-t border-line align-top">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                      <span className="block whitespace-nowrap font-medium" translate="no">
                        {segment ? `${segment.marketingAirline} ${segment.marketingNumber}` : `Vuelo ${f + 1}`}
                      </span>
                      <span className="block text-2xs text-ink-soft" translate="no">
                        {segment ? `${segment.from}–${segment.to}` : ''}
                        {flight.cabinName ? `, ${flight.cabinName}` : ''}
                      </span>
                    </th>
                    <td className="py-1.5">
                      <ul className="flex flex-wrap gap-1" aria-label="Clases tarifarias">
                        {flight.bookingClassCodes.map((b) => {
                          const requested = b.bookingClassCode === segment?.bookingClass;
                          return (
                            <li
                              key={b.bookingClassCode}
                              className={cx(
                                'rounded px-1.5 py-0.5 text-2xs tabular',
                                requested ? 'bg-ink text-paper' : b.seatsAvailable > 0 ? 'bg-cyan-soft text-ink' : 'bg-ink/[0.06] text-ink-soft line-through',
                              )}
                              title={requested ? 'Clase cotizada en la caché' : undefined}
                            >
                              <span translate="no">{b.bookingClassCode}</span> {b.seatsAvailable}
                              {requested && <span className="sr-only"> (clase cotizada)</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function DestinationCard({ summary, openOrigin, calendarLink, onClose, ref }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [choice, setChoice] = useState<'cheapest' | 'nonstop'>('cheapest');
  const [travelers, setTravelers] = useState<Travelers>({ ADT: 1, CNN: 0, INF: 0 });
  const [results, setResults] = useState<Map<string, RefreshResult>>(new Map());
  const refresh = useFlightRefresh();

  const hasNonStopAlt = Boolean(summary.cheapestNonStop && summary.cheapestNonStop.id !== summary.cheapest.id);
  const offer = choice === 'nonstop' && summary.cheapestNonStop ? summary.cheapestNonStop : summary.cheapest;
  const result = results.get(offer.id);
  const [outbound, inbound] = offer.legs;
  const from = outbound?.from ?? '';
  const to = outbound?.to ?? '';
  const place = getPlace(openOrigin ? from : to);

  // Al abrir, el foco va al título (útil con teclado), sin desplazar el mapa; Escape cierra.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [summary.code, onClose]);

  const validate = () =>
    refresh.mutate(
      { offers: [offer], travelers },
      { onSuccess: (map) => setResults((prev) => new Map([...prev, ...map])) },
    );

  const error = refresh.isError ? describeError(refresh.error, 'la validación') : undefined;

  return (
    <section
      ref={ref}
      aria-labelledby="dest-card-title"
      className="pointer-events-auto absolute inset-x-2 bottom-2 z-10 flex max-h-[60%] flex-col overflow-clip rounded-2xl border border-line bg-land shadow-[0_20px_48px_-24px_rgba(27,36,51,.6)] sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-[400px] sm:max-h-[calc(100%-2rem)]"
    >
      {/* El scroll va en un div sin fondo: con un scroller opaco encima del canvas WebGL,
          Chrome dejaba de pintar un rectángulo del mapa por arriba de la tarjeta. */}
      <div className="min-h-0 overflow-y-auto p-4 [overscroll-behavior:contain]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 id="dest-card-title" ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
              <RouteTitle from={from} to={to} roundTrip={Boolean(inbound)} />
            </h2>
            <p className="text-sm text-ink-soft">
              {[
                place && countryName(place.country),
                outbound && `ida ${formatDate(outbound.departDate)}`,
                inbound && `vuelta ${formatDate(inbound.departDate)}`,
                offer.lengthOfStay !== undefined && formatDays(offer.lengthOfStay),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <IconButton label="Cerrar la tarjeta del destino" onClick={onClose}>
            <IconClose />
          </IconButton>
        </div>

        {hasNonStopAlt && (
          <div role="radiogroup" aria-label="Tarifa a mostrar" className="mt-3 inline-flex rounded-lg bg-ink/[0.06] p-0.5">
            {(
              [
                ['cheapest', 'Más barata'],
                ['nonstop', 'Directa más barata'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={choice === value}
                onClick={() => setChoice(value)}
                className={cx('h-8 rounded-md px-3 text-sm', choice === value ? 'bg-land font-medium shadow-sm' : 'text-ink-soft hover:text-ink')}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <Price amount={offer.price!.amount} currency={offer.price!.currency} className="text-[36px] leading-none" />
            <p className="text-2xs text-ink-soft">por adulto, tarifa en caché</p>
          </div>
          <ApiSourceTag api="flightSearch">De</ApiSourceTag>
        </div>

        <div className="mt-4 space-y-4 border-t border-line pt-4">
          {offer.legs.map((leg, i) => (
            <div key={leg.journeyId}>
              <LegLine leg={leg} label={offer.legs.length > 1 ? (i === 0 ? 'Ida' : 'Vuelta') : undefined} />
              <p className="ml-11 mt-1 text-2xs text-ink-soft" translate="no">
                {leg.segments.map((s) => `${s.marketingAirline} ${s.marketingNumber} clase ${s.bookingClass ?? '—'}`).join(', ')}
              </p>
            </div>
          ))}
          {offer.priceOnly && <p className="text-sm text-ink-soft">Esta tarifa vino sin detalle de vuelos: no se puede validar con Flight Refresh.</p>}
        </div>

        <div className="mt-4 rounded-xl border border-line p-3">
          <div className="flex items-start gap-2">
            <IconShield className="mt-0.5 shrink-0 text-cyan" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">¿Sigue disponible esta tarifa?</p>
              <p className="text-sm text-ink-soft">Flight Refresh chequea el horario y los asientos en la clase cotizada, sin reservar.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TravelersPicker value={travelers} onChange={setTravelers} />
            <Button onClick={validate} loading={refresh.isPending} loadingText="Validando…" disabled={offer.priceOnly} className="flex-1">
              {result ? 'Validar de nuevo' : 'Validar con Flight Refresh'}
            </Button>
          </div>
          <div aria-live="polite" className="mt-3 empty:hidden">
            {error && (
              <Notice tone="error" title={error.title}>
                {error.detail}
              </Notice>
            )}
            {result && !refresh.isPending && (
              <>
                <RefreshResultView offer={offer} result={result} />
                <ApiSourceTag api="flightRefresh" className="-ml-1.5 mt-2">
                  Ver request y respuesta de
                </ApiSourceTag>
              </>
            )}
          </div>
        </div>

        <Link
          to="/destino/$code"
          params={{ code: calendarLink.code }}
          search={calendarLink.search}
          className="mt-3 inline-flex items-center gap-2 rounded-md py-1 text-sm text-ink-soft hover:text-ink hover:underline"
        >
          <IconCalendar size={16} />
          Ver el calendario de tarifas de {placeLabel(openOrigin ? calendarLink.code : to)}
        </Link>
      </div>
    </section>
  );
}
