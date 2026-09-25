// Genera tipos TypeScript desde los specs oficiales de Sabre (specs/*.yml).
// Uso: npm run gen:types
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';
import YAML from 'yaml';

const SPECS = ['flightsearch', 'flightshop', 'flightcheck', 'flightrefresh', 'flightreshop'];
const OUT_DIR = new URL('../src/api/types/', import.meta.url);

// Algunos specs usan nombres sueltos en discriminator.mapping ("FlightOffer") en vez de un $ref.
function fixDiscriminatorMappings(node) {
  if (!node || typeof node !== 'object') return;
  if (node.discriminator?.mapping) {
    for (const [key, value] of Object.entries(node.discriminator.mapping)) {
      if (typeof value === 'string' && !value.startsWith('#')) {
        node.discriminator.mapping[key] = `#/components/schemas/${value}`;
      }
    }
  }
  for (const child of Object.values(node)) fixDiscriminatorMappings(child);
}

await mkdir(OUT_DIR, { recursive: true });
for (const name of SPECS) {
  const spec = YAML.parse(await readFile(new URL(`../specs/${name}.yml`, import.meta.url), 'utf8'));
  fixDiscriminatorMappings(spec);
  const ast = await openapiTS(spec, { silent: true });
  const banner = `// Generado por scripts/gen-types.mjs desde specs/${name}.yml. No editar a mano.\n\n`;
  await writeFile(new URL(`${name}.ts`, OUT_DIR), banner + astToString(ast));
  console.log(`✓ src/api/types/${name}.ts`);
}
