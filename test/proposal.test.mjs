import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { applyProposal } from '../scripts/apply-proposal.mjs';
import { root, loadDataset } from '../scripts/dataset.mjs';

async function sandbox() {
  const directory = await mkdtemp(path.join(tmpdir(), 'drone-law-test-'));
  await cp(path.join(root, 'data'), path.join(directory, 'data'), { recursive: true });
  return directory;
}

test('downloaded proposals apply without the website, validate first, and are idempotent', async () => {
  const directory = await sandbox();
  const original = (await loadDataset('examples', directory)).regulations[0];
  const record = { ...original, id: 'example-new-record' };
  const proposal = {
    change: {
      collection: 'examples',
      record_type: 'regulations',
      action: 'add',
      record_id: record.id,
      record,
      expected_content: null,
    },
  };
  assert.equal(await applyProposal(proposal, directory, true), 'valid, no files changed');
  assert.equal((await loadDataset('examples', directory)).regulations.length, 2);
  assert.equal(await applyProposal(proposal, directory), 'applied');
  assert.equal(await applyProposal(proposal, directory), 'unchanged');
  const file = path.join(directory, 'data/examples/regulations', `${record.id}.json`);
  const previous = await readFile(file, 'utf8');
  const edit = {
    change: {
      ...proposal.change,
      action: 'edit',
      expected_content: JSON.stringify(record),
      record: { ...record, summary: 'A revised synthetic fixture, not a real law.' },
    },
  };
  assert.equal(await applyProposal(edit, directory), 'applied');
  await assert.rejects(
    () =>
      applyProposal(
        { change: { ...edit.change, record: { ...record, title: 'Stale edit' } } },
        directory,
      ),
    /changed since review/,
  );
  assert.notEqual(await readFile(file, 'utf8'), previous);
  const revised = edit.change.record;
  assert.equal(
    await applyProposal(
      {
        change: {
          ...edit.change,
          action: 'remove',
          record: null,
          expected_content: JSON.stringify(revised),
        },
      },
      directory,
    ),
    'applied',
  );
});

test('invalid and unsafe proposals leave the source data unchanged', async () => {
  const directory = await sandbox();
  const original = (await loadDataset('examples', directory)).regulations[0];
  const file = path.join(directory, 'data/examples/regulations', `${original.id}.json`);
  const before = await readFile(file, 'utf8');
  const change = {
    collection: 'examples',
    record_type: 'regulations',
    action: 'edit',
    record_id: original.id,
    expected_content: JSON.stringify(original),
    record: { ...original, jurisdiction_ids: ['does-not-exist'] },
  };
  await assert.rejects(() => applyProposal({ change }, directory), /Unknown jurisdiction/);
  await assert.rejects(
    () => applyProposal({ change: { ...change, record_id: '../../outside' } }, directory),
    /Invalid structured/,
  );
  assert.equal(await readFile(file, 'utf8'), before);
});
