import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reviewWebMigration, requireOnlyReviewedWebPending } from '../scripts/crm-web-migration-review.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'supabase/migration-ownership.json'), 'utf8'));
const read = name => fs.readFileSync(path.join(root, 'supabase/migrations', name));
const web = '20261030030000_private_crm_web_reader.sql';

test('web apply review requires byte-identical legacy, applied CRM and reviewed web migration files', () => {
  assert.equal(reviewWebMigration(manifest, read), web);
  for (const changed of [Object.keys(manifest.legacy_migration_sha256)[0], manifest.crm_review.migration, web]) {
    assert.throws(() => reviewWebMigration(manifest, name => name === changed ? Buffer.concat([read(name), Buffer.from('\n-- drift')]) : read(name)), /checksum changed/);
  }
});
test('web apply review refuses a different project, missing history, or unreviewed migration identity', () => {
  for (const changed of [
    { ...manifest, project_ref: 'wdoiouwzfutdtmdsdgkr' },
    { ...manifest, legacy_migration_sha256: {} },
    { ...manifest, crm_web_review: { ...manifest.crm_web_review, migration: '../unreviewed.sql' } },
    { ...manifest, crm_review: { ...manifest.crm_review, sha256: 'invalid' } },
  ]) assert.throws(() => reviewWebMigration(changed, read), /Web apply stopped/);
});
test('web apply accepts exactly one reviewed pending file and rejects empty or extra dry-run migrations', () => {
  assert.equal(requireOnlyReviewedWebPending(`Would push these migrations:\n • ${web}\n`, web), true);
  for (const preview of ['Remote database is up to date.',
    ' • 20261030020000_private_crm.sql\n',
    ` • ${web}\n • 20261030040000_unreviewed.sql\n`,
    ` • ${web}\n • ${web}\n`]) assert.throws(() => requireOnlyReviewedWebPending(preview, web), /expected exactly/);
});
test('apply-web refuses extra CLI arguments before reading credentials or connecting', () => {
  const result = spawnSync(process.execPath, ['scripts/db-admin.mjs', 'apply-web', '--unexpected'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage:/);
});
