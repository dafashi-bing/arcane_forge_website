#!/usr/bin/env node
// Maintainer-only schema operations. Never import from application/browser code.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { reviewWebMigration, requireOnlyReviewedWebPending } from './crm-web-migration-review.mjs';
const root = path.resolve(import.meta.dirname, '..');
const ref = 'nydmouxljprsfymcvqko';
const command = process.argv[2];
if (!['history', 'dry-run', 'apply', 'apply-web'].includes(command) || (command === 'apply-web' && process.argv.length !== 3)) {
  console.error('Usage: node scripts/db-admin.mjs history|dry-run|apply|apply-web'); process.exit(1);
}
try {
  const env = {};
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co` || !env.SUPABASE_DB_PASSWORD) throw Error('Expected target-specific configuration missing');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'supabase/migration-ownership.json')));
  for (const [name, digest] of Object.entries(manifest.legacy_migration_sha256)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'supabase/migrations', name))).digest('hex');
    if (actual !== digest) throw Error(`Historical migration changed: ${name}`);
  }
  // The web command reviews all immutable history, the applied agent migration,
  // and the single pending web migration before making any network request.
  const reviewedWeb = command === 'apply-web'
    ? reviewWebMigration(manifest, name => fs.readFileSync(path.join(root, 'supabase/migrations', name)))
    : null;
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=${encodeURIComponent(path.join(root, 'supabase/certs/prod-ca-2021.crt'))}`;
  const run = args => {
    const r = spawnSync('supabase', [...args, '--db-url', url], {cwd: root, encoding: 'utf8', timeout: 90000, maxBuffer: 2000000});
    const output = `${r.stdout || ''}${r.stderr || ''}`.split(env.SUPABASE_DB_PASSWORD).join('[REDACTED]').split(encodeURIComponent(env.SUPABASE_DB_PASSWORD)).join('[REDACTED]').split(url).join('[REDACTED DATABASE URL]');
    process.stdout.write(output);
    if (r.error || r.status !== 0) throw Error('Supabase command failed');
    return output;
  };
  if (command === 'history') run(['migration', 'list']);
  else {
    const preview = run(['db', 'push', '--dry-run']);
    if (command === 'apply') {
      const allowed = manifest.crm_review.migration;
      const reviewedHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'supabase/migrations', allowed))).digest('hex');
      if (reviewedHash !== manifest.crm_review.sha256) throw Error('Reviewed CRM migration checksum changed; review before applying');
      const pending = [...preview.matchAll(/(?:\u2022|\*)\s+(\d{14}_[^\s]+\.sql)/g)].map(m=>m[1]);
      if (pending.length !== 1 || pending[0] !== allowed) throw Error('Apply stopped: expected exactly the reviewed CRM migration. Inspect history and dry run.');
      run(['db', 'push', '--yes']);
    } else if (command === 'apply-web') {
      requireOnlyReviewedWebPending(preview, reviewedWeb);
      run(['db', 'push', '--yes']);
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
