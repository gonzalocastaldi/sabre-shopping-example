import { useSyncExternalStore } from 'react';
import type { ApiName } from '@/api/client';

interface InspectorState {
  open: boolean;
  filter?: ApiName;
}

let state: InspectorState = { open: false };
const listeners = new Set<() => void>();

export function openInspector(filter?: ApiName) {
  state = { open: true, filter };
  listeners.forEach((l) => l());
}

export function setInspectorOpen(open: boolean) {
  state = { ...state, open, filter: open ? state.filter : undefined };
  listeners.forEach((l) => l());
}

export function clearInspectorFilter() {
  state = { ...state, filter: undefined };
  listeners.forEach((l) => l());
}

export function useInspectorState(): InspectorState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
