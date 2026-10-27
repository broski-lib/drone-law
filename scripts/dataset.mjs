import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const schema = JSON.parse(
  await readFile(path.join(root, 'schema/dataset.schema.json'), 'utf8'),
);
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

async function records(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (!entry.name.endsWith('.json')) continue;
    if (!entry.isFile()) throw new Error(`Expected a regular JSON file: ${entry.name}`);
    const record = JSON.parse(await readFile(path.join(directory, entry.name), 'utf8'));
    if (entry.name !== `${record.id}.json`)
      throw new Error(`Filename must match record ID: ${entry.name}`);
    result.push(record);
  }
  return result;
}

export async function loadDataset(kind = 'published', directory = root) {
  if (!['published', 'examples'].includes(kind)) throw new Error('Unknown dataset kind');
  const metadata = JSON.parse(await readFile(path.join(directory, 'data/metadata.json'), 'utf8'));
  const base = path.join(directory, kind === 'examples' ? 'data/examples' : 'data');
  const dataset = {
    ...metadata,
    kind,
    jurisdictions: await records(path.join(base, 'jurisdictions')),
    regulations: await records(path.join(base, 'regulations')),
  };
  validateDataset(dataset);
  return dataset;
}

export function validateDataset(dataset) {
  if (!validateSchema(dataset))
    throw new Error(ajv.errorsText(validateSchema.errors, { separator: '\n' }));
  const jurisdictionIds = new Set(dataset.jurisdictions.map((item) => item.id));
  const regulationIds = new Set(dataset.regulations.map((item) => item.id));
  if (
    jurisdictionIds.size !== dataset.jurisdictions.length ||
    regulationIds.size !== dataset.regulations.length
  )
    throw new Error('Duplicate record ID');
  const jurisdictions = new Map(dataset.jurisdictions.map((item) => [item.id, item]));
  for (const record of [...dataset.jurisdictions, ...dataset.regulations]) {
    if (record.is_example !== (dataset.kind === 'examples'))
      throw new Error(`Example/publication mismatch: ${record.id}`);
    if (record.is_example !== record.id.startsWith('example-'))
      throw new Error(`Example ID prefix mismatch: ${record.id}`);
  }
  for (const item of dataset.jurisdictions) {
    const seen = new Set([item.id]);
    let parent = item.parent_id;
    while (parent !== null) {
      if (!jurisdictionIds.has(parent)) throw new Error(`Unknown parent: ${parent}`);
      if (seen.has(parent)) throw new Error(`Jurisdiction parent cycle: ${item.id}`);
      seen.add(parent);
      parent = jurisdictions.get(parent).parent_id;
    }
    if (Boolean(item.geometry) !== Boolean(item.geometry_source))
      throw new Error(`Geometry provenance mismatch: ${item.id}`);
    if (item.geometry) {
      const geometryUrl = new URL(item.geometry_source.url);
      if (geometryUrl.username || geometryUrl.password)
        throw new Error(`Geometry source URL contains credentials: ${item.id}`);
      if (item.is_example && !geometryUrl.hostname.endsWith('.invalid'))
        throw new Error(`Example geometry sources must use .invalid: ${item.id}`);
      if (!item.is_example && geometryUrl.hostname.endsWith('.invalid'))
        throw new Error(`Published geometry source is fictional: ${item.id}`);
      const polygons =
        item.geometry.type === 'Polygon' ? [item.geometry.coordinates] : item.geometry.coordinates;
      for (const polygon of polygons) {
        for (const ring of polygon) {
          if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])
            throw new Error(`Unclosed ring: ${item.id}`);
          if (new Set(ring.map((position) => position.join(','))).size < 3)
            throw new Error(`Degenerate ring: ${item.id}`);
        }
      }
    }
  }
  for (const item of dataset.regulations) {
    for (const id of item.jurisdiction_ids)
      if (!jurisdictionIds.has(id)) throw new Error(`Unknown jurisdiction: ${id}`);
    for (const id of item.supersedes)
      if (!regulationIds.has(id) || id === item.id)
        throw new Error(`Invalid supersedes reference: ${id}`);
    if (item.effective_from && item.effective_until && item.effective_from > item.effective_until)
      throw new Error(`Reversed effective dates: ${item.id}`);
    if (item.legal_status === 'future' && !item.effective_from)
      throw new Error(`Future regulation needs effective_from: ${item.id}`);
    if (item.legal_status === 'repealed' && !item.effective_until)
      throw new Error(`Repealed regulation needs effective_until: ${item.id}`);
    for (const source of item.sources) {
      const url = new URL(source.url);
      if (url.username || url.password)
        throw new Error(`Source URL contains credentials: ${item.id}`);
      if (item.is_example && !url.hostname.endsWith('.invalid'))
        throw new Error(`Example sources must use .invalid: ${item.id}`);
      if (!item.is_example && url.hostname.endsWith('.invalid'))
        throw new Error(`Published source is fictional: ${item.id}`);
      if (source.checked_on > item.reviewed_on)
        throw new Error(`Source checked after review: ${item.id}`);
    }
  }
  return dataset;
}

export function toGeoJSON(dataset) {
  const jurisdictions = new Map(dataset.jurisdictions.map((item) => [item.id, item]));
  return {
    type: 'FeatureCollection',
    schema_version: dataset.schema_version,
    kind: dataset.kind,
    license: dataset.license,
    features: dataset.regulations.flatMap((regulation) =>
      regulation.jurisdiction_ids.map((id) => ({
        type: 'Feature',
        id: `${regulation.id}:${id}`,
        geometry: jurisdictions.get(id).geometry,
        properties: {
          ...regulation,
          jurisdiction_id: id,
          geometry_source: jurisdictions.get(id).geometry_source,
        },
      })),
    ),
  };
}

export function toCSV(dataset) {
  const columns = [
    'id',
    'title',
    'summary',
    'jurisdiction_ids',
    'authority',
    'topics',
    'legal_status',
    'effective_from',
    'effective_until',
    'reviewed_on',
    'is_example',
    'sources',
  ];
  const cell = (value) => {
    let text =
      value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    [
      columns.map(cell).join(','),
      ...dataset.regulations.map((item) => columns.map((column) => cell(item[column])).join(',')),
    ].join('\r\n') + '\r\n'
  );
}
