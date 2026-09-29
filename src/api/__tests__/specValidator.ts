/**
 * Valida objetos contra los schemas de specs/*.yml (OpenAPI 3.0) usando ajv.
 * Adapta algunas construcciones de OpenAPI 3.0 que no son JSON Schema estándar.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

type SpecName = 'flightsearch' | 'flightrefresh';

function adapt(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(adapt);
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === 'discriminator' || k === 'example' || k === 'examples' || k === 'xml' || k === 'nullable' || k.startsWith('x-')) continue;
    out[k] = adapt(v);
  }
  // Ramas de oneOf con additionalProperties:false que no declaran las propiedades del padre
  // (p. ej. OfferItem de Reshop: `id` está en el padre). En OpenAPI se leen como una sola
  // clase; en JSON Schema el `id` quedaría prohibido. Copiamos las claves del padre a cada rama.
  if (Array.isArray(out.oneOf) && out.properties && typeof out.properties === 'object') {
    const parentKeys = Object.keys(out.properties as object);
    for (const branch of out.oneOf as Record<string, unknown>[]) {
      if (branch.additionalProperties === false) {
        branch.properties = { ...Object.fromEntries(parentKeys.map((k) => [k, true])), ...((branch.properties as object) ?? {}) };
      }
    }
  }
  // oneOf cuyas ramas no se excluyen entre sí (sin required ni additionalProperties:false),
  // como Journey en Flight Search: cualquier objeto matchea todas las ramas y oneOf falla
  // incluso con los ejemplos oficiales. Semánticamente es un anyOf.
  if (Array.isArray(out.oneOf)) {
    const branches = out.oneOf as Record<string, unknown>[];
    const nonExclusive = branches.every((b) => !b.$ref && !b.required && b.additionalProperties !== false);
    if (nonExclusive) {
      out.anyOf = out.oneOf;
      delete out.oneOf;
    }
  }
  // Patrón de OpenAPI que JSON Schema no soporta: additionalProperties:false junto con
  // oneOf/allOf (las propiedades de las ramas quedarían prohibidas). Lo relajamos.
  if (out.additionalProperties === false && (out.oneOf || out.allOf || out.anyOf)) delete out.additionalProperties;
  // OpenAPI 3.0: exclusiveMinimum booleano (estilo draft-04)
  if (out.exclusiveMinimum === true && typeof out.minimum === 'number') {
    out.exclusiveMinimum = out.minimum;
    delete out.minimum;
  } else if (typeof out.exclusiveMinimum === 'boolean') delete out.exclusiveMinimum;
  if (typeof out.exclusiveMaximum === 'boolean') delete out.exclusiveMaximum;
  return out;
}

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
for (const f of ['int32', 'int64', 'number', 'float', 'double', 'uuid']) if (!ajv.formats[f]) ajv.addFormat(f, true);

const loaded = new Set<SpecName>();
function ensure(spec: SpecName) {
  if (loaded.has(spec)) return;
  const raw = readFileSync(fileURLToPath(new URL(`../../../specs/${spec}.yml`, import.meta.url)), 'utf8');
  const doc = YAML.parse(raw);
  ajv.addSchema({ $id: spec, components: adapt(doc.components) });
  loaded.add(spec);
}

export function validateAgainstSpec(spec: SpecName, schema: string, value: unknown): ErrorObject[] {
  ensure(spec);
  const validate = ajv.compile({ $ref: `${spec}#/components/schemas/${schema}` });
  return validate(value) ? [] : (validate.errors ?? []);
}

export function specExample(spec: SpecName, name: string): unknown {
  const doc = YAML.parse(readFileSync(fileURLToPath(new URL(`../../../specs/${spec}.yml`, import.meta.url)), 'utf8'));
  return doc.components.examples[name].value;
}
