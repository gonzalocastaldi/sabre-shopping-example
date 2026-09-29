import { Link, Outlet } from '@tanstack/react-router';
import { useApiCalls } from '@/api/inspector';
import { ApiInspector } from '@/features/devtools/ApiInspector';
import { openInspector } from '@/features/devtools/inspectorState';
import { ConnectionBadge } from '@/features/devtools/SettingsPopover';
import { IconCode } from '@/ui/icons';

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md" aria-label="Galaxy Travel, ir al inicio">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 23 C 10 8, 22 8, 27 23" fill="none" stroke="var(--magenta)" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="5" cy="23" r="2.8" fill="var(--cyan)" />
        <circle cx="27" cy="23" r="2.8" fill="var(--ink)" />
        <circle cx="16" cy="6" r="1.5" fill="var(--ink)" />
      </svg>
      <span className="whitespace-nowrap font-display text-[22px] font-semibold tracking-tight" translate="no">
        Galaxy Travel
      </span>
    </Link>
  );
}

export function Layout() {
  const calls = useApiCalls();
  const pending = calls.some((c) => c.status === 'pending');
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-land focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-4 sm:gap-5 sm:px-6">
          <Wordmark />
          <span className="flex-1" />
          <ConnectionBadge />
          <button
            type="button"
            onClick={() => openInspector()}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-sm hover:border-ink/40"
          >
            <IconCode size={16} />
            <span className="hidden sm:inline">API Inspector</span>
            <span className="tabular rounded-full bg-ink/8 px-1.5 text-2xs" aria-label={`${calls.length} llamadas`}>
              {calls.length}
            </span>
            {pending && <span className="size-1.5 animate-pulse rounded-full bg-magenta" aria-hidden="true" />}
          </button>
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <ApiInspector />
    </div>
  );
}
