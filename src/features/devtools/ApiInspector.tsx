/**
 * API Inspector: panel lateral con cada llamada a Sabre (request, respuesta, estado y
 * latencia). Pensado para la presentación: muestra qué API responde cada parte de la UI.
 */
import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import { API_META } from '@/api/client';
import { clearCalls, useApiCalls, type ApiCall } from '@/api/inspector';
import { useSettings } from '@/app/settings';
import { IconChevronDown, IconClose, IconExternal } from '@/ui/icons';
import { Button, IconButton, cx } from '@/ui/primitives';
import { clearInspectorFilter, setInspectorOpen, useInspectorState } from './inspectorState';

const SENSITIVE_KEYS = new Set(['bookingId', 'number', 'ticketNumber', 'givenName', 'surname', 'middleName']);

function mask(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mask);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SENSITIVE_KEYS.has(k) && typeof v === 'string' ? '••••••' : mask(v)]));
  }
  return value;
}

function statusTone(status: ApiCall['status']) {
  if (status === 'pending') return 'text-ink-soft';
  if (typeof status === 'number' && status < 300) return 'text-cyan';
  return 'text-danger';
}

function statusLabel(status: ApiCall['status']) {
  if (status === 'pending') return 'En curso…';
  if (status === 'cancelled') return 'Cancelada';
  if (status === 'network-error') return 'Sin conexión';
  return String(status);
}

function JsonBlock({ value, label }: { value: unknown; label: string }) {
  const text = useMemo(() => JSON.stringify(value, null, 2) ?? '—', [value]);
  const [copied, setCopied] = useState(false);
  const lines = text.split('\n').length;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-2xs font-medium text-ink-soft">
          {label} <span className="tabular">({lines} líneas)</span>
        </span>
        <button
          type="button"
          className="rounded px-1.5 text-2xs text-ink-soft hover:bg-ink/5 hover:text-ink"
          onClick={() => {
            void navigator.clipboard?.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          <span aria-live="polite">{copied ? 'Copiado' : 'Copiar JSON'}</span>
        </button>
      </div>
      <pre className="max-h-72 overflow-auto rounded-md bg-ink/[0.04] p-3 font-mono text-[12px] leading-relaxed" translate="no">
        {text.length > 60_000 ? `${text.slice(0, 60_000)}\n… (recortado, ${text.length.toLocaleString('es')} caracteres)` : text}
      </pre>
    </div>
  );
}

function CallRow({ call }: { call: ApiCall }) {
  const [open, setOpen] = useState(false);
  const meta = API_META[call.api];
  const request = call.sensitive ? mask(call.request) : call.request;
  const response = call.sensitive ? mask(call.response) : call.response;
  const time = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(call.startedAt);
  return (
    <li className="border-b border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink/[0.03]">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[17px] font-semibold" translate="no">
              {meta.label}
            </span>
            <span className={cx('text-2xs font-medium tabular', statusTone(call.status))}>{statusLabel(call.status)}</span>
          </div>
          <p className="truncate font-mono text-[12px] text-ink-soft" translate="no">
            {call.method} {call.url}
          </p>
        </div>
        <div className="shrink-0 text-right text-2xs text-ink-soft tabular">
          <div>{call.durationMs !== undefined ? `${Math.round(call.durationMs)} ms` : '—'}</div>
          <div>{time}</div>
        </div>
        <IconChevronDown size={16} className={cx('mt-1 shrink-0 text-ink-soft transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          <p className="text-sm text-ink-soft">{meta.role}</p>
          {call.upstreamLatencyMs !== undefined && (
            <p className="text-2xs text-ink-soft">
              Latencia de Sabre: <span className="tabular">{call.upstreamLatencyMs} ms</span>
            </p>
          )}
          {call.sensitive && <p className="text-2xs text-warn">Los datos del ticket y del pasajero se ocultan en pantalla.</p>}
          {call.request !== undefined && <JsonBlock value={request} label="Request" />}
          {call.response !== undefined && <JsonBlock value={response} label="Respuesta" />}
          <a href={meta.docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-cyan hover:underline">
            Documentación de {meta.label} en Developer Hub <IconExternal size={14} />
          </a>
        </div>
      )}
    </li>
  );
}

export function ApiInspector() {
  const { open, filter } = useInspectorState();
  const calls = useApiCalls();
  const settings = useSettings();
  const shown = filter ? calls.filter((c) => c.api === filter) : calls;

  return (
    <Dialog.Root open={open} onOpenChange={setInspectorOpen} modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-line bg-land shadow-[-12px_0_32px_-24px_rgba(27,36,51,.5)] [overscroll-behavior:contain]"
        >
          <header className="flex items-start gap-3 border-b border-line px-4 py-3">
            <div className="flex-1">
              <Dialog.Title className="font-display text-2xl font-semibold">API Inspector</Dialog.Title>
              <Dialog.Description className="text-sm text-ink-soft">
                {settings.apiMode === 'live' ? 'Llamadas reales a Sabre PROD a través del proxy local.' : 'Modo mock: respuestas de ejemplo generadas en el browser.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Cerrar el inspector">
                <IconClose />
              </IconButton>
            </Dialog.Close>
          </header>
          <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-sm">
            <span className="tabular text-ink-soft">
              {shown.length} {shown.length === 1 ? 'llamada' : 'llamadas'}
              {filter ? ` de ${API_META[filter].label}` : ''}
            </span>
            <span className="flex-1" />
            {filter && (
              <Button size="sm" variant="ghost" onClick={clearInspectorFilter}>
                Ver todas
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearCalls} disabled={!calls.length}>
              Vaciar
            </Button>
          </div>
          {shown.length ? (
            <ul className="flex-1 overflow-y-auto">
              {shown.map((call) => (
                <CallRow key={call.id} call={call} />
              ))}
            </ul>
          ) : (
            <div className="flex-1 px-4 py-10 text-center text-ink-soft">
              <p>Todavía no hay llamadas{filter ? ` a ${API_META[filter].label}` : ''}.</p>
              <p className="text-sm">Hacé una búsqueda y acá vas a ver el request y la respuesta de Sabre.</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
