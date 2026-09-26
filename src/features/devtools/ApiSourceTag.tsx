import { API_META, type ApiName } from '@/api/client';
import { IconCode } from '@/ui/icons';
import { cx } from '@/ui/primitives';
import { openInspector } from './inspectorState';

/**
 * Procedencia: qué API de Sabre respondió este bloque. Abre el API Inspector filtrado.
 */
export function ApiSourceTag({ api, children, className }: { api: ApiName; children?: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openInspector(api)}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-2xs text-ink-soft transition-colors hover:bg-cyan-soft hover:text-ink',
        className,
      )}
      title={`${API_META[api].role} Tocá para ver el request y la respuesta.`}
    >
      <IconCode size={14} />
      <span>
        {children ? <>{children} </> : null}
        <span className="font-medium text-ink" translate="no">
          {API_META[api].label}
        </span>
      </span>
    </button>
  );
}
