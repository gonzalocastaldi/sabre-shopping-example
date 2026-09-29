/**
 * Duración del viaje en días, con un solo punto: cualquier entero de 1 a 21, que es lo que
 * acepta `lengthsOfStay` en Flight Search. `onChange` corre mientras se arrastra; `onCommit`,
 * al soltar (o con cada tecla), para disparar una búsqueda por elección y no una por paso.
 */
import * as Slider from '@radix-ui/react-slider';
import { useId } from 'react';
import { MAX_STAY_DAYS, MIN_STAY_DAYS } from '@/api/mappers';
import { cx, formatDays } from './primitives';

const MARKS = [MIN_STAY_DAYS, 7, 14, MAX_STAY_DAYS];
const THUMB = 20;

export function StayDaysSlider({
  value,
  onChange,
  onCommit,
  label = 'Duración del viaje',
  hint,
  disabled,
  className,
}: {
  value: number;
  onChange: (days: number) => void;
  onCommit?: (days: number) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cx(disabled && 'opacity-50', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        <span className="font-display text-lg font-semibold tabular" aria-hidden="true">
          {formatDays(value)}
        </span>
      </div>
      <Slider.Root
        className="relative flex h-6 w-full touch-none select-none items-center"
        min={MIN_STAY_DAYS}
        max={MAX_STAY_DAYS}
        step={1}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        onValueCommit={onCommit ? ([v]) => onCommit(v) : undefined}
        aria-labelledby={`${id}-label`}
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-ink/15">
          <Slider.Range className="absolute h-full rounded-full bg-ink" />
        </Slider.Track>
        <Slider.Thumb
          aria-labelledby={`${id}-label`}
          aria-valuetext={formatDays(value)}
          className="block size-5 rounded-full border-2 border-ink bg-land focus-visible:outline-2 focus-visible:outline-cyan data-[disabled]:cursor-not-allowed"
        />
      </Slider.Root>
      {/* Marcas alineadas con el centro del punto (Radix lo mantiene dentro de la barra). */}
      <div className="relative mt-1 h-4 text-2xs text-ink-soft tabular" aria-hidden="true">
        {MARKS.map((m) => (
          <span key={m} className="absolute -translate-x-1/2" style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${(m - MIN_STAY_DAYS) / (MAX_STAY_DAYS - MIN_STAY_DAYS)})` }}>
            {m}
          </span>
        ))}
      </div>
      {hint && <p className="mt-1 text-2xs text-ink-soft">{hint}</p>}
    </div>
  );
}
