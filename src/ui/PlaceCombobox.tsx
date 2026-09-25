/**
 * Combobox accesible de aeropuertos/ciudades (patrón ARIA 1.2 combobox + listbox).
 * Sugerencias: coincidencias locales al instante + Geo Autocomplete de Sabre (debounced).
 * Modo múltiple: los elegidos se muestran como chips removibles.
 */
import { useId, useRef, useState } from 'react';
import { usePlaceSuggestions } from '@/api/hooks';
import { countryName, getPlace, placeLabel, type Place } from '@/data/geo';
import { IconClose, IconPin } from './icons';
import { Spinner, cx } from './primitives';

interface Props {
  label: string;
  value: string[];
  onChange: (codes: string[]) => void;
  multiple?: boolean;
  max?: number;
  placeholder?: string;
  autoFocus?: boolean;
  hideLabel?: boolean;
  className?: string;
}

export function PlaceCombobox({ label, value, onChange, multiple, max = 10, placeholder = 'Ciudad o aeropuerto…', hideLabel, className }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { places, isFetching, source } = usePlaceSuggestions(query);
  const options = places.filter((p) => !value.includes(p.code));

  const choose = (place: Place) => {
    if (multiple) onChange([...value, place.code].slice(0, max));
    else onChange([place.code]);
    setQuery('');
    setOpen(false);
    setActive(0);
    if (multiple) inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const single = !multiple && value[0] ? getPlace(value[0]) : undefined;

  return (
    <div className={cx('relative', className)}>
      <label htmlFor={id} className={cx('mb-1 block text-2xs font-medium text-ink-soft', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-land px-2 focus-within:border-cyan focus-within:ring-2 focus-within:ring-cyan/40">
        {value.map((code) => (
            <span key={code} className="inline-flex h-7 items-center gap-1 rounded-full bg-ink/8 pl-2.5 pr-1 text-sm">
              <span translate="no">{placeLabel(code)}</span>
              <span className="text-2xs text-ink-soft" translate="no">
                {code}
              </span>
              <button type="button" aria-label={`Quitar ${placeLabel(code)}`} className="rounded-full p-0.5 hover:bg-ink/10" onClick={() => onChange(value.filter((c) => c !== code))}>
                <IconClose size={14} />
              </button>
            </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          name={`${label}-lugar`}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          className="h-9 min-w-[7rem] flex-1 bg-transparent px-1 outline-none placeholder:text-ink-soft/70"
          placeholder={single ? 'Cambiar…' : value.length && multiple ? (value.length >= max ? '' : 'Agregar otro…') : placeholder}
          value={query}
          disabled={multiple && value.length >= max}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        {isFetching && <Spinner className="text-ink-soft" />}
      </div>
      {open && query.trim().length >= 2 && (
        <ul id={listId} role="listbox" aria-label={`Sugerencias para ${label}`} className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-auto rounded-lg border border-line bg-land py-1 shadow-[0_12px_32px_-16px_rgba(27,36,51,.45)]">
          {options.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">{isFetching ? 'Buscando…' : 'Sin coincidencias. Probá con el código IATA (ej.: EZE).'}</li>}
          {options.map((p, i) => (
            <li
              key={`${p.kind}${p.code}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              onMouseEnter={() => setActive(i)}
              className={cx('flex cursor-pointer items-center gap-3 px-3 py-2', i === active && 'bg-cyan-soft')}
            >
              <IconPin size={16} className="shrink-0 text-ink-soft" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {p.kind === 'city' ? `${p.city} (todos los aeropuertos)` : p.city}
                </span>
                <span className="block truncate text-2xs text-ink-soft">
                  {p.kind === 'city' ? countryName(p.country) : `${p.name}, ${countryName(p.country)}`}
                </span>
              </span>
              <span className="font-display text-lg font-semibold text-ink-soft" translate="no">
                {p.code}
              </span>
            </li>
          ))}
          {options.length > 0 && (
            <li role="presentation" className="border-t border-line px-3 pt-1.5 pb-1 text-2xs text-ink-soft">
              {source === 'sabre' ? 'Sugerencias de Geo Autocomplete (Sabre)' : 'Sugerencias locales'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
