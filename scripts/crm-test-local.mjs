#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

// This runner never reads .env, credentials, the operational import, or a URL.
// Every SQL statement goes over docker exec to a new network-isolated container.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const image = 'postgres:15-alpine';
const container = `arcane-crm-local-${process.pid}-${randomBytes(4).toString('hex')}`;
const report = { ok: false, image, isolated_network: true, published_ports: [], migrations: [], workflow_checks: [] };
let started = false;

function docker(args, { input, timeout = 15000, allowFailure = false } = {}) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', timeout, maxBuffer: 4 * 1024 * 1024 });
  if (!allowFailure && (result.error || result.status !== 0)) {
    const detail = result.error?.message || result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`;
    throw new Error(`Docker ${args[0]} failed: ${detail.slice(0, 3000)}`);
  }
  return result;
}

function psql(sql, { transaction = false } = {}) {
  const result = docker(['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=terse', ...(transaction ? ['--single-transaction'] : [])], { input: sql, timeout: 45000 });
  return result;
}

async function confirmRemoved(name, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let error = null;
  while (Date.now() < deadline) {
    const remaining = docker(['container', 'inspect', '--format', '{{.State.Status}}', name], { timeout: Math.min(3000, Math.max(1, deadline - Date.now())), allowFailure: true });
    // A nonzero inspect exit also means permission/daemon errors; only Docker's
    // explicit missing-container message establishes successful --rm cleanup.
    if (!remaining.error && remaining.status !== 0 && /No such (?:container|object):/i.test(remaining.stderr ?? '') && (remaining.stderr ?? '').includes(name)) return { removed: true };
    error = remaining.error?.message || (remaining.status !== 0 ? remaining.stderr?.trim() || `Docker inspect exit ${remaining.status}` : `Container still ${remaining.stdout.trim() || 'present'}`);
    await delay(Math.min(200, Math.max(0, deadline - Date.now())));
  }
  return { removed: false, error: error?.slice(0, 1000) || 'Container removal was not confirmed within 10 seconds' };
}

async function main() {
  if (process.argv.length > 2) throw new Error('Usage: node scripts/crm-test-local.mjs (no arguments or hosted mode)');
  // --pull=never also protects against a race after the explicit image check.
  const inspection = docker(['image', 'inspect', image, '--format', '{{.Id}}'], { timeout: 10000, allowFailure: true });
  if (inspection.error || inspection.status !== 0) throw new Error('Local postgres:15-alpine image is unavailable or Docker is inaccessible. This runner never downloads images.');
  docker(['run', '--detach', '--rm', '--pull=never', '--network', 'none', '--name', container, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', image], { timeout: 15000 });
  started = true;
  const deadline = Date.now() + 25000;
  let ready = false;
  while (Date.now() < deadline) {
    // The image's temporary bootstrap server listens only on a Unix socket;
    // TCP readiness means bootstrap finished and the final server is running.
    const result = docker(['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres'], { timeout: Math.min(3000, Math.max(1, deadline - Date.now())), allowFailure: true });
    if (result.status === 0) { ready = true; break; }
    await delay(Math.min(200, Math.max(0, deadline - Date.now())));
  }
  if (!ready) throw new Error('Isolated local Postgres did not become ready within 25 seconds');
  psql('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;\n', { transaction: true });
  const migrationsDir = join(root, 'supabase', 'migrations');
  const migrations = readdirSync(migrationsDir).filter(name => /^\d+_[A-Za-z0-9_]+\.sql$/.test(name)).sort();
  if (!migrations.length) throw new Error('Canonical migration history is empty');
  for (const migration of migrations) {
    psql(readFileSync(join(migrationsDir, migration), 'utf8'), { transaction: true });
    report.migrations.push(migration);
  }
  const workflow = psql(readFileSync(join(root, 'scripts', 'crm-workflow.sql'), 'utf8'));
  report.workflow_checks = [...workflow.stderr.matchAll(/NOTICE:\s*(PASS:[^\n]+)/g)].map(match => match[1]);
  if (!report.workflow_checks.length) throw new Error('Workflow SQL completed without PASS assertions');
  const inventory = docker(['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1'], {
    input: "SELECT json_build_object('contacts',(SELECT count(*) FROM crm.contacts),'interactions',(SELECT count(*) FROM crm.interactions),'receipts',(SELECT count(*) FROM crm.receipts),'research',(SELECT count(*) FROM crm.research),'legacy_tables',(SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename IN ('games','stats','comments','feedback_requests','playtest_signups')));\n",
    timeout: 10000,
  });
  report.after_rollback = JSON.parse(inventory.stdout.trim());
  if (['contacts', 'interactions', 'receipts', 'research'].some(key => report.after_rollback[key] !== 0)) throw new Error('Workflow left CRM test records after rollback');
  if (report.after_rollback.legacy_tables !== 5) throw new Error('Legacy schema rebuild did not produce its five expected tables');
  report.ok = true;
}

try {
  await main();
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  if (started) {
    docker(['stop', '--time', '1', container], { timeout: 10000, allowFailure: true });
    // Docker's --rm removal can finish shortly after stop returns; poll only
    // this unique test container, bounded to ten seconds, without broad rm.
    const cleanup = await confirmRemoved(container);
    report.container_removed = cleanup.removed;
    if (!cleanup.removed) {
      report.ok = false;
      report.cleanup_error = cleanup.error;
      report.container = container;
      process.exitCode = 1;
    }
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
