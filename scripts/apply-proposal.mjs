import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDataset, validateDataset, root } from './dataset.mjs';

export async function applyProposal(proposal, directory = root, dryRun = false) {
  const change = proposal?.change;
  if (
    !change ||
    !['published', 'examples'].includes(change.collection) ||
    !['regulations', 'jurisdictions'].includes(change.record_type) ||
    !['add', 'edit', 'remove'].includes(change.action) ||
    typeof change.record_id !== 'string' ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(change.record_id) ||
    change.record_id.length > 120 ||
    !(change.expected_content === null || typeof change.expected_content === 'string')
  )
    throw new Error('Invalid structured proposal');
  if (change.action === 'remove' && change.record !== null)
    throw new Error('A removal must have a null record');
  if (change.action !== 'remove' && change.record?.id !== change.record_id)
    throw new Error('Proposal ID does not match its record');
  const data = await loadDataset(change.collection, directory);
  const records = data[change.record_type];
  const index = records.findIndex((record) => record.id === change.record_id);
  const current = index < 0 ? null : JSON.stringify(records[index]);
  const desired = change.action === 'remove' ? null : JSON.stringify(change.record);
  if (current === desired) return 'unchanged';
  if (current !== change.expected_content)
    throw new Error(
      'The local record changed since review. Inspect the diff and prepare a new proposal.',
    );
  if (change.action === 'add' && index >= 0) throw new Error('Cannot add an existing record');
  if (change.action === 'edit' && index < 0) throw new Error('Cannot edit a missing record');
  if (change.action === 'remove') records.splice(index, 1);
  else if (index < 0) records.push(change.record);
  else records[index] = change.record;
  validateDataset(data);
  if (!dryRun) {
    const file = path.join(
      directory,
      'data',
      ...(change.collection === 'examples' ? ['examples'] : []),
      change.record_type,
      `${change.record_id}.json`,
    );
    if (change.action === 'remove') await unlink(file);
    else
      await writeFile(file, JSON.stringify(change.record, null, 2) + '\n', {
        flag: change.action === 'add' ? 'wx' : 'w',
      });
  }
  return dryRun ? 'valid, no files changed' : 'applied';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: pnpm run proposal:apply -- <proposal.json> [--dry-run]');
  const bytes = await readFile(file);
  if (bytes.length > 262144) throw new Error('Proposal exceeds 256 KiB');
  const proposal = JSON.parse(bytes.toString());
  console.log(await applyProposal(proposal, root, process.argv.includes('--dry-run')));
  console.log(
    'Inspect git diff, run pnpm run check, and open a reviewed pull request. Nothing was committed or published.',
  );
}
