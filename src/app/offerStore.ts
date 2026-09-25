/**
 * Guarda la oferta elegida para pasarla de una pantalla a otra (Shop/Search → Check).
 * La URL lleva el id; el contenido vive en sessionStorage (sobrevive a un F5).
 */
import type { OfferAttributes, TaxItem } from '@/api/mosaic';
import type { TripOffer } from '@/api/normalize';
import type { Travelers } from '@/api/mappers';

export interface SelectedOffer {
  offer: TripOffer;
  /** De dónde vino: afecta el relato ("precio en caché" vs "precio de Shop"). */
  source: 'flightSearch' | 'flightShop';
  travelers: Travelers;
  attributes?: OfferAttributes;
  taxItems?: TaxItem[];
  savedAt: number;
}

const PREFIX = 'galaxy-travel:offer:';
const memory = new Map<string, SelectedOffer>();

export function saveSelectedOffer(entry: Omit<SelectedOffer, 'savedAt'>) {
  const value = { ...entry, savedAt: Date.now() };
  memory.set(entry.offer.id, value);
  try {
    sessionStorage.setItem(PREFIX + entry.offer.id, JSON.stringify(value));
  } catch {
    // Sin storage: queda en memoria.
  }
}

export function loadSelectedOffer(id: string): SelectedOffer | undefined {
  if (memory.has(id)) return memory.get(id);
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    return raw ? (JSON.parse(raw) as SelectedOffer) : undefined;
  } catch {
    return undefined;
  }
}
