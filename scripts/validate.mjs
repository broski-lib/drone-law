import { loadDataset } from './dataset.mjs';

for (const kind of ['published', 'examples']) {
  const dataset = await loadDataset(kind);
  console.log(
    `${kind}: ${dataset.regulations.length} regulations, ${dataset.jurisdictions.length} jurisdictions, valid`,
  );
}
