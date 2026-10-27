import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDataset, validateDataset, toGeoJSON, toCSV } from '../scripts/dataset.mjs';

test('published dataset excludes examples', async () => {
  const data = await loadDataset();
  assert.equal(data.kind, 'published');
  assert(data.regulations.every((record) => !record.is_example));
  assert(data.jurisdictions.every((record) => !record.is_example));
  assert.equal(
    toGeoJSON(data).features.length,
    data.regulations.reduce((count, record) => count + record.jurisdiction_ids.length, 0),
  );
});

test('fixtures exercise real geometry and unknown geometry', async () => {
  const data = await loadDataset('examples');
  const features = toGeoJSON(data).features;
  assert.equal(features.length, 2);
  assert(features.some((item) => item.geometry === null));
  assert(features.some((item) => item.geometry?.type === 'Polygon'));
  assert(features.every((item) => item.properties.is_example));
});

for (const [name, mutate, pattern] of [
  ['duplicate IDs', (data) => data.regulations.push(data.regulations[0]), /Duplicate/],
  [
    'unknown jurisdiction',
    (data) => data.regulations[0].jurisdiction_ids.push('missing'),
    /Unknown jurisdiction/,
  ],
  ['invalid date', (data) => (data.regulations[0].reviewed_on = '2026-02-30'), /format/],
  [
    'inverted dates',
    (data) => {
      data.regulations[0].effective_from = '2026-02-01';
      data.regulations[0].effective_until = '2026-01-01';
    },
    /Reversed/,
  ],
  ['missing evidence', (data) => (data.regulations[0].sources = []), /fewer than/],
  ['unsafe URL', (data) => (data.regulations[0].sources[0].url = 'javascript:alert(1)'), /pattern/],
  [
    'credential URL',
    (data) => (data.regulations[0].sources[0].url = 'https://user:pass@example.invalid/test'),
    /credentials/,
  ],
  [
    'unclosed polygon',
    (data) => (data.jurisdictions[1].geometry.coordinates[0][4][0] = -101),
    /Unclosed/,
  ],
  [
    'missing geometry provenance',
    (data) => (data.jurisdictions[1].geometry_source = null),
    /provenance/,
  ],
  [
    'fictional example geometry source',
    (data) => (data.jurisdictions[1].geometry_source.url = 'https://example.gov/boundary'),
    /geometry sources must use .invalid/,
  ],
  ['parent cycle', (data) => (data.jurisdictions[0].parent_id = data.jurisdictions[1].id), /cycle/],
  ['example in publication', (data) => (data.kind = 'published'), /mismatch/],
  [
    'unexpected property',
    (data) => (data.regulations[0].contact_email = 'private@example.invalid'),
    /additional properties/,
  ],
]) {
  test(`rejects ${name}`, async () => {
    const data = await loadDataset('examples');
    mutate(data);
    assert.throws(() => validateDataset(data), pattern);
  });
}

test('GeoJSON uses one stable feature per regulation/jurisdiction pair', async () => {
  const data = await loadDataset('examples');
  data.regulations[0].jurisdiction_ids = ['example-city', 'example-park'];
  const features = toGeoJSON(validateDataset(data)).features;
  assert.equal(features.length, 3);
  assert.equal(new Set(features.map((item) => item.id)).size, 3);
});

test('CSV quotes multiline text and neutralizes spreadsheet formulas', async () => {
  const data = await loadDataset('examples');
  data.regulations[0].title = '=HYPERLINK("evil")';
  data.regulations[0].summary = 'one\ntwo,"three"';
  const csv = toCSV(data);
  assert(csv.includes('"\'=HYPERLINK(""evil"")"'));
  assert(csv.includes('"one\ntwo,""three"""'));
});
