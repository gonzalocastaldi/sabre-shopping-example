/**
 * Registro en memoria de las llamadas a Sabre, para el API Inspector.
 * Es un store externo mínimo (useSyncExternalStore), sin dependencias.
 */
import { useSyncExternalStore } from 'react';
import type { ApiName } from './client';

export interface ApiCall {
  id: number;
  api: ApiName;
  method: string;
  url: string;
  startedAt: number;
  request?: unknown;
  response?: unknown;
  status: number | 'pending' | 'cancelled' | 'network-error';
  durationMs?: number;
  upstreamLatencyMs?: number;
  sensitive?: boolean;
}

const MAX_CALLS = 60;
let calls: ApiCall[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function recordCall(input: Pick<ApiCall, 'api' | 'method' | 'url' | 'request' | 'sensitive'>): number {
  const id = nextId++;
  calls = [{ ...input, id, startedAt: Date.now(), status: 'pending' as const }, ...calls].slice(0, MAX_CALLS);
  emit();
  return id;
}

export function updateCall(id: number, patch: Partial<ApiCall>) {
  calls = calls.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emit();
}

export function clearCalls() {
  calls = [];
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useApiCalls(): ApiCall[] {
  return useSyncExternalStore(subscribe, () => calls, () => calls);
}
