/**
 * Validación de una tarifa en caché con Flight Refresh (un request, un itinerario): pasajeros,
 * botón y resultado (horario OAG, clase tarifaria y asientos por clase). Se usa en la tarjeta
 * del mapa y en el día elegido del calendario.
 */
import { useState } from 'react';
import { describeError } from '@/api/client';
import { useFlightRefresh, type RefreshResult } from '@/api/hooks';
import type { Travelers } from '@/api/mappers';
import type { TripOffer } from '@/api/normalize';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { TravelersPicker, ValidationBadge, validationDetail } from '@/features/shared/travel';
import { IconShield } from '@/ui/icons';
import { Button, Notice, cx } from '@/ui/primitives';

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

export function RefreshBox({ offer, className }: { offer: TripOffer; className?: string }) {
  const [travelers, setTravelers] = useState<Travelers>({ ADT: 1, CNN: 0, INF: 0 });
  // Resultados por oferta: al cambiar de día (o de tarifa) y volver, se conserva la validación.
  const [results, setResults] = useState<Map<string, RefreshResult>>(new Map());
  const refresh = useFlightRefresh();
  // Estado de carga y error solo si la última validación fue de esta oferta.
  const isCurrent = refresh.variables?.offers[0]?.id === offer.id;
  const pending = refresh.isPending && isCurrent;
  const error = refresh.isError && isCurrent ? describeError(refresh.error, 'la validación') : undefined;
  const result = results.get(offer.id);

  const validate = () =>
    refresh.mutate(
      { offers: [offer], travelers },
      { onSuccess: (map) => setResults((prev) => new Map([...prev, ...map])) },
    );

  return (
    <div className={cx('rounded-xl border border-line p-3', className)}>
      <div className="flex items-start gap-2">
        <IconShield className="mt-0.5 shrink-0 text-cyan" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">¿Sigue disponible esta tarifa?</p>
          <p className="text-sm text-ink-soft">
            {offer.priceOnly
              ? 'Esta tarifa vino sin detalle de vuelos: no se puede validar con Flight Refresh.'
              : 'Flight Refresh chequea el horario y los asientos en la clase cotizada, sin reservar.'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TravelersPicker value={travelers} onChange={setTravelers} />
        <Button onClick={validate} loading={pending} loadingText="Validando…" disabled={offer.priceOnly} className="flex-1">
          {result ? 'Validar de nuevo' : 'Validar con Flight Refresh'}
        </Button>
      </div>
      <div aria-live="polite" className="mt-3 empty:hidden">
        {error && (
          <Notice tone="error" title={error.title}>
            {error.detail}
          </Notice>
        )}
        {result && !pending && (
          <>
            <RefreshResultView offer={offer} result={result} />
            <ApiSourceTag api="flightRefresh" className="-ml-1.5 mt-2">
              Ver request y respuesta de
            </ApiSourceTag>
          </>
        )}
      </div>
    </div>
  );
}
