/**
 * Estado de la conexión y ajustes de la demo: live/mock, punto de venta, moneda y PCC.
 */
import * as Popover from '@radix-ui/react-popover';
import { useId } from 'react';
import { useProxyMeta } from '@/api/hooks';
import { switchApiMode, updateSettings, useSettings } from '@/app/settings';
import { countryName } from '@/data/geo';
import { cx } from '@/ui/primitives';

const POS = ['US', 'AR', 'UY', 'BR', 'CL', 'MX', 'CO', 'PE', 'ES'];
const CURRENCIES = ['USD', 'EUR', 'ARS', 'UYU', 'BRL', 'CLP', 'MXN', 'COP', 'PEN'];

export function ConnectionBadge() {
  const settings = useSettings();
  const meta = useProxyMeta();
  const live = settings.apiMode === 'live';
  const missingToken = live && meta.data?.tokenSource === 'none';
  const proxyDown = live && meta.isError;
  const ids = { pos: useId(), cur: useId(), pcc: useId() };

  // El entorno sale del baseUrl del proxy: mostrar "PROD" mientras se le pega a CERT
  // (o al revés) es justo el error que no queremos cometer delante de un cliente.
  const env = !meta.data ? 'Sabre' : meta.data.baseUrl.includes('cert.platform') ? 'CERT' : meta.data.baseUrl.includes('api.platform.sabre.com') ? 'PROD' : 'Sabre';

  const proxyPcc = meta.data?.pcc ?? undefined;
  const effectivePcc = settings.pcc || proxyPcc;
  /**
   * Flight Refresh exige pseudoCityCode: "include the itinerary details in the Flight Refresh
   * request, along with the other required data elements (passengerTypeCode and
   * pseudoCityCode)". Sin PCC la validación del mapa no puede correr.
   * https://developer.sabre.com/rest-api/flightrefresh-api/v1/index.html
   */
  const pccIssue = !live || !meta.data ? undefined : !effectivePcc ? 'missing' : settings.pcc && proxyPcc && settings.pcc !== proxyPcc ? 'override' : undefined;
  const healthy = live && !missingToken && !proxyDown && !pccIssue;

  const label = !live ? 'Datos de ejemplo' : missingToken ? 'Falta el token' : proxyDown ? 'Proxy no disponible' : pccIssue ? `En vivo en ${env}, revisá el PCC` : `En vivo en ${env}`;
  const shortLabel = !live ? 'Mock' : missingToken || proxyDown || pccIssue ? 'Revisar' : env;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cx(
            'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors',
            healthy ? 'border-cyan/40 text-ink hover:bg-cyan-soft' : 'border-warn/40 text-ink hover:bg-warn/10',
          )}
        >
          <span aria-hidden="true" className={cx('size-2 shrink-0 rounded-full', healthy ? 'bg-cyan' : 'bg-warn')} />
          <span className="hidden whitespace-nowrap sm:inline">{label}</span>
          <span className="whitespace-nowrap sm:hidden" aria-label={label}>
            {shortLabel}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-[340px] rounded-xl border border-line bg-land p-4 shadow-[0_16px_40px_-20px_rgba(27,36,51,.45)]">
          <h2 className="font-display text-xl">Conexión con Sabre</h2>
          <fieldset className="mt-3">
            <legend className="text-sm font-medium">Origen de los datos</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['live', 'mock'] as const).map((mode) => (
                <label key={mode} className={cx('cursor-pointer rounded-lg border p-2.5 text-sm', settings.apiMode === mode ? 'border-ink bg-ink/5' : 'border-line hover:border-ink/40')}>
                  <input type="radio" name="api-mode" className="sr-only" checked={settings.apiMode === mode} onChange={() => switchApiMode(mode)} />
                  <span className="block font-medium">{mode === 'live' ? 'En vivo' : 'Mock'}</span>
                  <span className="block text-2xs text-ink-soft">{mode === 'live' ? 'Sabre PROD con tu token' : 'Sin red, datos de ejemplo'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {live && (
            <div className="mt-3 rounded-lg bg-ink/[0.04] p-3 text-sm">
              {meta.isLoading && <p>Consultando el proxy…</p>}
              {proxyDown && <p className="text-danger">El proxy de Vite no respondió. Corré la app con <code translate="no">npm run dev</code>.</p>}
              {meta.data && (
                <>
                  <p className="break-words">
                    Servidor: <span translate="no">{meta.data.baseUrl.replace('https://', '')}</span>
                  </p>
                  <p>
                    Token:{' '}
                    {meta.data.tokenSource === 'env'
                      ? 'SABRE_TOKEN de .env.local'
                      : meta.data.tokenSource === 'epr'
                        ? 'generado con tu EPR (OAuth v2)'
                        : 'no configurado. Copiá .env.example a .env.local y pegá tu token.'}
                  </p>
                  {meta.data.recording && <p className="text-warn">Grabando respuestas en src/mocks/recorded/.</p>}
                  <p>
                    PCC: <span translate="no">{effectivePcc ?? '—'}</span>
                    <span className="text-ink-soft">{settings.pcc ? ' (de Ajustes)' : proxyPcc ? ' (heredado del proxy)' : ''}</span>
                  </p>
                  {pccIssue === 'missing' && (
                    <p className="mt-1 text-danger">Sin PCC no se puede validar con Flight Refresh. Cargá SABRE_REQUEST_PCC en .env.local o escribí uno acá abajo.</p>
                  )}
                  {pccIssue === 'override' && (
                    <p className="mt-1 text-warn">
                      Estás pisando el PCC del proxy (<span translate="no">{proxyPcc}</span>) con <span translate="no">{settings.pcc}</span>. Si Flight Refresh responde vacío, volvé a{' '}
                      <span translate="no">{proxyPcc}</span>.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={ids.pos} className="text-sm font-medium">
                Punto de venta
              </label>
              <select id={ids.pos} name="punto-de-venta" value={settings.pointOfSale} onChange={(e) => updateSettings({ pointOfSale: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-line px-2">
                {POS.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.cur} className="text-sm font-medium">
                Moneda
              </label>
              <select id={ids.cur} name="moneda" value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-line px-2">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor={ids.pcc} className="text-sm font-medium">
                PCC (opcional)
              </label>
              <input
                id={ids.pcc}
                name="pcc"
                autoComplete="off"
                spellCheck={false}
                maxLength={4}
                value={settings.pcc}
                onChange={(e) => updateSettings({ pcc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                placeholder={meta.data?.pcc ? `${meta.data.pcc} (heredado del proxy)` : 'Ej.: AB12…'}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-land px-2 uppercase"
              />
              <p className="mt-1 text-2xs text-ink-soft">Se envía como customerCode (Search) y pseudoCityCode (Refresh, donde es obligatorio). Si lo dejás vacío se usa el de SABRE_REQUEST_PCC.</p>
            </div>
          </div>
          <Popover.Arrow className="fill-land" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
