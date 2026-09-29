/**
 * Tarjeta del destino elegido en el mapa: la oferta en caché de Flight Search y su
 * validación con Flight Refresh (un request, un itinerario). Flota sobre el mapa:
 * abajo a la izquierda en desktop, hoja inferior en mobile.
 */
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState, type Ref } from 'react';
import type { DestinationSummary } from '@/api/normalize';
import { countryName, getPlace, placeLabel } from '@/data/geo';
import { ApiSourceTag } from '@/features/devtools/ApiSourceTag';
import { RefreshBox } from '@/features/shared/RefreshBox';
import { LegLine, RouteTitle } from '@/features/shared/travel';
import { IconCalendar, IconClose } from '@/ui/icons';
import { IconButton, Price, cx, formatDate, formatDays } from '@/ui/primitives';

interface Props {
  summary: DestinationSummary;
  openOrigin: boolean;
  calendarLink: { code: string; search: Record<string, string | undefined> };
  onClose: () => void;
  ref?: Ref<HTMLElement>;
}

export function DestinationCard({ summary, openOrigin, calendarLink, onClose, ref }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [choice, setChoice] = useState<'cheapest' | 'nonstop'>('cheapest');

  const hasNonStopAlt = Boolean(summary.cheapestNonStop && summary.cheapestNonStop.id !== summary.cheapest.id);
  const offer = choice === 'nonstop' && summary.cheapestNonStop ? summary.cheapestNonStop : summary.cheapest;
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
        </div>

        <RefreshBox offer={offer} className="mt-4" />

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
