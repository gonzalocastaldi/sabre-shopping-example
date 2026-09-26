/**
 * Hooks de TanStack Query por API. Las búsquedas solo corren cuando la URL tiene criterios
 * (acción explícita del usuario) y se cachean 10 minutos para no gastar transacciones en PROD.
 */
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { marketOf, useSettings } from '@/app/settings';
import { searchPlaces, type Place } from '@/data/geo';
import { sabreRequest } from './client';
import {
  buildCalendarSearchRequest,
  buildCheckRequest,
  buildExploreSearchRequest,
  buildMonthOverviewRequest,
  buildRefreshRequests,
  buildReshopRequest,
  buildShopRequest,
  isOpenOrigin,
  type ReshopForm,
  type SearchCriteria,
  type ShopSelection,
  type Travelers,
} from './mappers';
import type { FlightRefreshResponse, MosaicResponse } from './mosaic';
import { buildFareCalendar, normalizeOffers, summarizeByPlace, type TripOffer } from './normalize';
import type { GeoAutocompleteResponse } from './types/geo';

const STALE = 10 * 60_000;

export function useExploreSearch(criteria: SearchCriteria | undefined) {
  const market = marketOf(useSettings());
  const request = criteria ? buildExploreSearchRequest(criteria, market) : undefined;
  return useQuery({
    queryKey: ['flightSearch', 'explore', request],
    enabled: Boolean(request),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => sabreRequest<MosaicResponse>('flightSearch', request, { signal }),
    select: (res) => {
      const offers = normalizeOffers(res);
      return { offers, places: summarizeByPlace(offers, criteria && isOpenOrigin(criteria) ? 'origin' : 'destination'), warnings: res.warnings ?? [] };
    },
  });
}

export interface CalendarParams {
  origin: string;
  destination: string;
  fromDate: string;
  toDate: string;
  lengthOfStay?: number;
  nonStop?: boolean;
}

export function useCalendarSearch(params: CalendarParams | undefined) {
  const market = marketOf(useSettings());
  const request = params ? buildCalendarSearchRequest(params, market) : undefined;
  return useQuery({
    queryKey: ['flightSearch', 'calendar', request],
    enabled: Boolean(request),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => sabreRequest<MosaicResponse>('flightSearch', request, { signal }),
    select: (res) => {
      const offers = normalizeOffers(res);
      return { offers, days: buildFareCalendar(offers, params?.lengthOfStay), warnings: res.warnings ?? [] };
    },
  });
}

export function useMonthOverview(params: { origin: string; destination: string; lengthOfStay?: number; nonStop?: boolean } | undefined) {
  const market = marketOf(useSettings());
  const request = params ? buildMonthOverviewRequest(params, market) : undefined;
  return useQuery({
    queryKey: ['flightSearch', 'months', request],
    enabled: Boolean(request),
    staleTime: STALE,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => sabreRequest<MosaicResponse>('flightSearch', request, { signal }),
    select: (res) => {
      const byMonth = new Map<string, TripOffer>();
      for (const o of normalizeOffers(res)) {
        const month = o.legs[0]?.departDate?.slice(0, 7);
        if (!month || !o.price) continue;
        const cur = byMonth.get(month);
        if (!cur || o.price.amount < cur.price!.amount) byMonth.set(month, o);
      }
      return byMonth;
    },
  });
}

export function useFlightShop(selection: ShopSelection | undefined) {
  const market = marketOf(useSettings());
  const request = selection ? buildShopRequest(selection, market) : undefined;
  return useQuery({
    queryKey: ['flightShop', request],
    enabled: Boolean(request),
    staleTime: STALE,
    queryFn: ({ signal }) => sabreRequest<MosaicResponse>('flightShop', request, { signal }),
    select: (res) => ({ response: res, offers: normalizeOffers(res) }),
  });
}

export function useFlightCheck(offer: TripOffer | undefined, travelers: Travelers) {
  const market = marketOf(useSettings());
  const request = offer ? buildCheckRequest(offer, travelers, market) : undefined;
  return useQuery({
    queryKey: ['flightCheck', offer?.id, request],
    enabled: Boolean(request),
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: ({ signal }) => sabreRequest<MosaicResponse>('flightCheck', request, { signal }),
    select: (res) => ({ response: res, offers: normalizeOffers(res) }),
  });
}

export type RefreshResult = NonNullable<FlightRefreshResponse['itineraries']>[number];

/** Valida en lote (un request por ruta). Devuelve offerId → resultado. */
export function useFlightRefresh() {
  const market = marketOf(useSettings());
  return useMutation({
    mutationFn: async ({ offers, travelers }: { offers: TripOffer[]; travelers: Travelers }) => {
      const groups = buildRefreshRequests(offers, travelers, market);
      const results = new Map<string, RefreshResult>();
      await Promise.all(
        groups.map(async ({ request, offerIds }) => {
          const res = await sabreRequest<FlightRefreshResponse>('flightRefresh', request);
          for (const it of res.itineraries ?? []) {
            const id = offerIds[it.requestedItineraryIndex];
            if (id) results.set(id, it);
          }
        }),
      );
      return results;
    },
  });
}

export function useFlightReshop() {
  const market = marketOf(useSettings());
  return useMutation({
    mutationFn: async (form: ReshopForm) => {
      const res = await sabreRequest<MosaicResponse>('flightReshop', buildReshopRequest(form, market), { sensitive: true });
      return { response: res, offers: normalizeOffers(res) };
    },
  });
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/**
 * Autocompletado: muestra al instante coincidencias locales y, con 3+ letras y 350 ms sin
 * tipear, consulta Geo Autocomplete de Sabre. Si falla, quedan las locales.
 */
export function usePlaceSuggestions(query: string) {
  const q = query.trim();
  const debounced = useDebounced(q, 350);
  const local = searchPlaces(q, 8);
  const remote = useQuery({
    queryKey: ['geoAutocomplete', debounced],
    enabled: debounced.length >= 3,
    staleTime: 60 * 60_000,
    retry: false,
    queryFn: ({ signal }) => sabreRequest<GeoAutocompleteResponse>('geoAutocomplete', undefined, { signal, query: { query: debounced, limit: 6 } }),
    select: (res): Place[] => {
      const docs = [...(res.grouped?.['category:CITY']?.doclist?.docs ?? []), ...(res.grouped?.['category:AIR']?.doclist?.docs ?? [])];
      return docs
        .filter((d) => d.id && /^[A-Z]{3}$/.test(d.id))
        .map((d) => ({
          code: d.id!,
          kind: d.category === 'CITY' ? ('city' as const) : ('airport' as const),
          name: d.name ?? d.id!,
          city: d.city ?? d.name ?? d.id!,
          country: d.country ?? '',
          lat: Number(d.latitude),
          lon: Number(d.longitude),
          weight: (d.ranking ?? 0) / 300,
        }));
    },
  });
  const merged = [...(remote.data ?? []), ...local];
  const seen = new Set<string>();
  const places = merged.filter((p) => (seen.has(p.code) ? false : (seen.add(p.code), true))).slice(0, 8);
  return { places, isFetching: remote.isFetching, source: remote.data?.length ? ('sabre' as const) : ('local' as const) };
}

export interface ProxyMeta {
  baseUrl: string;
  tokenSource: 'env' | 'epr' | 'none' | 'mock';
  pcc: string | null;
  recording: boolean;
}

export function useProxyMeta() {
  return useQuery({
    queryKey: ['proxy-meta'],
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<ProxyMeta> => {
      const res = await fetch('/api/sabre/_meta');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
}
