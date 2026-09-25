/** Combobox de países (ISO-2) con nombres en español vía Intl.DisplayNames. */
import { useId, useMemo, useState } from 'react';
import countries from '@/data/countries.json';
import { countryName } from '@/data/geo';
import { IconClose } from './icons';
import { cx } from './primitives';

const ALL = Object.keys(countries as Record<string, string>)
  .map((code) => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CountryCombobox({ label, value, onChange, max = 10, placeholder = 'Escribí un país…' }: { label: string; value: string[]; onChange: (v: string[]) => void; max?: number; placeholder?: string }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const options = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    return ALL.filter((c) => !value.includes(c.code) && (fold(c.name).includes(q) || c.code.toLowerCase() === q)).slice(0, 8);
  }, [query, value]);

  const choose = (code: string) => {
    onChange([...value, code].slice(0, max));
    setQuery('');
    setActive(0);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-2xs font-medium text-ink-soft">
        {label}
      </label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-land px-2 focus-within:border-cyan focus-within:ring-2 focus-within:ring-cyan/40">
        {value.map((code) => (
          <span key={code} className="inline-flex h-7 items-center gap-1 rounded-full bg-ink/8 pl-2.5 pr-1 text-sm">
            {countryName(code)}
            <button type="button" aria-label={`Quitar ${countryName(code)}`} className="rounded-full p-0.5 hover:bg-ink/10" onClick={() => onChange(value.filter((c) => c !== code))}>
              <IconClose size={14} />
            </button>
          </span>
        ))}
        <input
          id={id}
          name={`${label}-pais`}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={value.length >= max}
          className="h-9 min-w-[7rem] flex-1 bg-transparent px-1 outline-none placeholder:text-ink-soft/70"
          placeholder={value.length >= max ? '' : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && options[active]) {
              e.preventDefault();
              choose(options[active].code);
            } else if (e.key === 'Escape') setOpen(false);
            else if (e.key === 'Backspace' && !query && value.length) onChange(value.slice(0, -1));
          }}
        />
      </div>
      {open && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" aria-label={label} className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-line bg-land py-1 shadow-[0_12px_32px_-16px_rgba(27,36,51,.45)]">
          {options.map((c, i) => (
            <li
              key={c.code}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(c.code)}
              onMouseEnter={() => setActive(i)}
              className={cx('flex cursor-pointer items-center justify-between px-3 py-2', i === active && 'bg-cyan-soft')}
            >
              <span>{c.name}</span>
              <span className="text-2xs text-ink-soft" translate="no">
                {c.code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
