/**
 * Primitivas del design system Galaxy Travel. Accesibles por defecto:
 * foco visible, labels asociados, estados de carga anunciados.
 */
import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { IconAlert, IconInfo } from './icons';

export { clsx as cx };

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet';

const BUTTON: Record<ButtonVariant, string> = {
  primary: 'bg-magenta text-white hover:bg-magenta-strong disabled:bg-ink-soft/40',
  secondary: 'border border-ink/25 text-ink hover:border-ink/60 hover:bg-land',
  ghost: 'text-ink hover:bg-ink/5',
  quiet: 'text-ink-soft hover:text-ink underline-offset-4 hover:underline',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, loadingText, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color] duration-150 disabled:cursor-not-allowed',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4',
        size === 'lg' && 'h-12 px-6 text-[17px]',
        BUTTON[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx('size-4 animate-spin', className)} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx('inline-flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink', className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Chip conmutador (aria-pressed): temas, duraciones, filtros. */
export function ToggleChip({ pressed, onToggle, children, className, disabled }: { pressed: boolean; onToggle: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onToggle}
      className={clsx(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-[background-color,border-color,color] duration-150 disabled:opacity-40',
        pressed ? 'border-ink bg-ink text-paper' : 'border-line bg-land text-ink hover:border-ink/50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Formato de moneda con Intl (los montos de Sabre llegan como string).
 * es-AR: "US$ 1.235" para dólares, símbolo corto para EUR/BRL/GBP y código ISO para el resto.
 * Sin decimales salvo `precise` (desgloses de impuestos y comparaciones).
 */
export function formatMoney(amount: number, currency: string, opts: { compact?: boolean; precise?: boolean } = {}) {
  const currencyDisplay = currency === 'USD' || currency === 'ARS' ? 'symbol' : ['EUR', 'GBP', 'BRL'].includes(currency) ? 'narrowSymbol' : 'code';
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      currencyDisplay,
      maximumFractionDigits: opts.precise ? 2 : 0,
      minimumFractionDigits: opts.precise ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export function Price({ amount, currency, className, precise }: { amount: number; currency: string; className?: string; compact?: boolean; precise?: boolean }) {
  return (
    <span className={clsx('tabular font-display font-semibold', className)} translate="no">
      {formatMoney(amount, currency, { precise })}
    </span>
  );
}

const DATE_FMT = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });
const DATE_LONG = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const MONTH_FMT = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' });
const asDate = (iso: string) => new Date(`${iso}T12:00:00`);
export const formatDate = (iso: string) => DATE_FMT.format(asDate(iso));
export const formatDateLong = (iso: string) => DATE_LONG.format(asDate(iso));
export const formatMonth = (iso: string) => MONTH_FMT.format(asDate(iso));

/** Duración del viaje (lengthsOfStay de Flight Search, en días): "1 día", "8 días". */
export const formatDays = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function formatDuration(min?: number) {
  if (min === undefined) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function Notice({ tone = 'info', title, children, action }: { tone?: 'info' | 'warn' | 'error'; title: string; children?: ReactNode; action?: ReactNode }) {
  const Icon = tone === 'info' ? IconInfo : IconAlert;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'flex gap-3 rounded-lg border px-4 py-3',
        tone === 'info' && 'border-cyan/30 bg-cyan-soft/60',
        tone === 'warn' && 'border-warn/30 bg-warn/10',
        tone === 'error' && 'border-danger/30 bg-danger/10',
      )}
    >
      <Icon className={clsx('mt-0.5 shrink-0', tone === 'info' ? 'text-cyan' : tone === 'warn' ? 'text-warn' : 'text-danger')} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children && <div className="mt-0.5 text-sm text-ink-soft break-words">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded bg-ink/8', className)} />;
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
