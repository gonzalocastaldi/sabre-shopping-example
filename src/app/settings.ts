/**
 * Preferencias de la demo (modo de API y mercado). Se guardan en localStorage por viewer;
 * si el storage no está disponible, se usan los valores por defecto.
 */
import { useSyncExternalStore } from 'react';

export type ApiMode = 'live' | 'mock';

export interface Settings {
  apiMode: ApiMode;
  /** publicContentPointOfSaleCountry de Flight Search. */
  pointOfSale: string;
  currency: string;
  /** PCC opcional para customerCode / pseudoCityCode. */
  pcc: string;
}

const KEY = 'galaxy-travel:settings';
const envMode = (import.meta.env.VITE_API_MODE as ApiMode | undefined) ?? 'live';
const DEFAULTS: Settings = { apiMode: envMode === 'mock' ? 'mock' : 'live', pointOfSale: 'US', currency: 'USD', pcc: '' };

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let current = read();
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Sin storage: el cambio vale solo para esta pestaña.
  }
  listeners.forEach((l) => l());
}

/** Cambiar de live a mock (o al revés) requiere recargar para arrancar/detener MSW. */
export function switchApiMode(mode: ApiMode) {
  updateSettings({ apiMode: mode });
  window.location.reload();
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current,
  );
}

export const marketOf = (s: Settings) => ({ pointOfSale: s.pointOfSale, currency: s.currency, pcc: s.pcc || undefined });
