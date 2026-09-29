import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Layout } from './Layout';
import { parseSearch, stringifySearch, type RawSearch } from './urlState';
import { ExplorePage } from '@/features/inspire/ExplorePage';
import { DestinationPage } from '@/features/calendar/DestinationPage';
import { NotFound } from './NotFound';

const asRaw = (s: Record<string, unknown>): RawSearch =>
  Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v === undefined || v === null ? undefined : String(v)]));

const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFound });

export const exploreRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: ExplorePage, validateSearch: asRaw });
export const destinationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/destino/$code', component: DestinationPage, validateSearch: asRaw });

const routeTree = rootRoute.addChildren([exploreRoute, destinationRoute]);

export const router = createRouter({ routeTree, parseSearch, stringifySearch, scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
