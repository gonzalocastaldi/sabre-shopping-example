/**
 * Hash estable (FNV-1a de 32 bits sobre JSON con claves ordenadas).
 * Lo usan el proxy (para nombrar grabaciones) y el mock del browser (para encontrarlas),
 * por eso no depende de APIs de Node ni del browser.
 */
export function stableStringify(value: unknown): string {
  const normalize = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, normalize(obj[k])]));
    }
    return v;
  };
  return JSON.stringify(normalize(value) ?? null);
}

export function stableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
