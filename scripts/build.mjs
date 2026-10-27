import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { compile } from 'json-schema-to-typescript';
import { loadDataset, root, schema, toCSV, toGeoJSON } from './dataset.mjs';

const output = path.join(root, 'dist');
await mkdir(path.join(output, 'examples'), { recursive: true });
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const files = new Map();
for (const kind of ['published', 'examples']) {
  const dataset = await loadDataset(kind);
  const prefix = kind === 'examples' ? 'examples/' : '';
  files.set(`${prefix}regulations.json`, json(dataset));
  files.set(`${prefix}regulations.geojson`, json(toGeoJSON(dataset)));
  files.set(`${prefix}regulations.csv`, toCSV(dataset));
}
files.set('dataset.schema.json', json(schema));
files.set(
  'dataset.d.ts',
  await compile(schema, 'DroneLawDataset', { bannerComment: '', additionalProperties: false }),
);
files.set('DATA-LICENSE.md', await readFile(path.join(root, 'DATA-LICENSE.md'), 'utf8'));
const hashes = {};
for (const [name, content] of files) {
  await writeFile(path.join(output, name), content);
  hashes[name] = {
    sha256: createHash('sha256').update(content).digest('hex'),
    bytes: Buffer.byteLength(content),
  };
}
const revision = createHash('sha256').update(json(hashes)).digest('hex');
const published = await loadDataset();
const manifest = {
  schema_version: published.schema_version,
  revision,
  license: published.license,
  published_regulations: published.regulations.length,
  example_regulations: (await loadDataset('examples')).regulations.length,
  files: hashes,
};
await writeFile(path.join(output, 'manifest.json'), json(manifest));
console.log(
  `Built revision ${revision}, ${published.regulations.length} published regulations. Fictional examples are separate.`,
);
