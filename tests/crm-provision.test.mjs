import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { provision } from '../scripts/crm-provision.mjs';

const TEST_ADMIN_PASSWORD = 'synthetic-test-maintainer-password';
const REF = 'nydmouxljprsfymcvqko';
const safeRole = login => ({
  rolname: 'crm_agent', rolcanlogin: login, rolsuper: false, rolcreatedb: false,
  rolcreaterole: false, rolreplication: false, rolbypassrls: false, rolinherit: false,
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcane-crm-provision-test-'));
  fs.mkdirSync(path.join(root, 'supabase/certs'), { recursive: true });
  fs.writeFileSync(path.join(root, '.env'),
    `NEXT_PUBLIC_SUPABASE_URL=https://${REF}.supabase.co\nSUPABASE_DB_PASSWORD=${TEST_ADMIN_PASSWORD}\n`, { mode: 0o600 });
  fs.writeFileSync(path.join(root, 'supabase/certs/prod-ca-2021.crt'),
    '-----BEGIN CERTIFICATE-----\nSYNTHETIC-TEST-CA-NO-NETWORK\n-----END CERTIFICATE-----\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, destination: path.join(root, '.env.crm.local') };
}

function fakeDatabase(options = {}) {
  const state = { connects: 0, ends: 0, queries: [], login: false, ...options };
  class Client {
    constructor(config) { state.config = config; }
    async connect() { state.connects += 1; }
    async end() { state.ends += 1; }
    async query(sql) {
      state.queries.push(sql);
      if (sql === 'BEGIN') { state.transaction = true; return { rows: [] }; }
      if (sql === 'COMMIT') {
        if (state.commitFailure) {
          state.commitUncertain = true;
          // A real driver may embed query/credential details. Provisioning must
          // replace the raw error rather than propagate it.
          throw new Error(`Synthetic lost acknowledgement ${state.generatedPassword}`);
        }
        state.committed = true; state.transaction = false; return { rows: [] };
      }
      if (sql === 'ROLLBACK') {
        state.rolledBack = true; state.transaction = false;
        if (!state.committed && !state.commitUncertain) state.login = false;
        return { rows: [] };
      }
      if (sql.startsWith('ALTER ROLE')) {
        const password = sql.match(/PASSWORD '([a-f0-9]{96})'$/)?.[1];
        assert.ok(Boolean(password), 'Role password interpolation must contain only generated hexadecimal');
        state.generatedPassword = password; state.login = true; return { rows: [] };
      }
      if (/FROM pg_catalog\.pg_roles WHERE rolname\s*=\s*'crm_agent'/.test(sql)) {
        if (state.afterAlterFailure && state.login) throw new Error(`Synthetic failure ${state.generatedPassword}`);
        return { rows: [{ ...safeRole(state.login), ...state.roleOverride }] };
      }
      if (sql.includes('pg_auth_members')) return { rows: [{ count: state.memberships ?? 0 }] };
      if (sql.includes('pg_get_function_identity_arguments')) return { rows: [{
        prosecdef: true, proconfig: ['search_path=pg_catalog, crm'], owner: 'postgres', schema_usage: true, can_execute: true,
        ...state.functionOverride,
      }] };
      if (sql.includes('pg_class') && sql.includes("n.nspname='crm'")) return { rows: [{ count: state.crmTableGrants ?? 0 }] };
      if (sql.includes("p.proname<>'command'")) return { rows: [{ count: state.helperGrants ?? 0 }] };
      if (sql.includes('has_any_column_privilege')) return { rows: [{ count: state.publicWrites ?? 0 }] };
      if (sql.includes("has_schema_privilege('crm_agent',n.oid,'CREATE')")) return { rows: [{ count: state.publicSchemaCreates ?? 0 }] };
      if (sql.includes('WHERE p.prosecdef')) return { rows: [{ count: state.publicDefiners ?? 0 }] };
      if (sql.startsWith('GRANT CONNECT') || sql.startsWith('SET LOCAL') || sql.includes('pg_advisory_xact_lock')) return { rows: [] };
      throw new Error('Unrecognized synthetic database query');
    }
  }
  return { Client, state };
}

function assertNoCredential(value, state) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  assert.ok(!text.includes(TEST_ADMIN_PASSWORD), 'Maintainer credential must never appear in status/errors');
  if (state.generatedPassword) assert.ok(!text.includes(state.generatedPassword), 'Generated credential must never appear in status/errors');
  assert.ok(!text.includes('postgresql://'), 'Connection URLs must never appear in status/errors');
}

async function expectSafeFailure(run, code, state) {
  let captured;
  try { await run(); } catch (error) { captured = error; }
  assert.ok(Boolean(captured), 'Provisioning should fail in this synthetic case');
  assert.equal(captured.code, code);
  assertNoCredential({ code: captured.code, message: captured.message }, state);
  return captured;
}

test('provisioning refuses existing credentials before connecting or resetting', async t => {
  const { root, destination } = fixture(t);
  const existing = 'SYNTHETIC_EXISTING_DO_NOT_OVERWRITE';
  fs.writeFileSync(destination, existing, { mode: 0o600 });
  const { Client, state } = fakeDatabase();
  await expectSafeFailure(() => provision({ root, Client }), 'CREDENTIAL_FILE_EXISTS', state);
  assert.equal(state.connects, 0);
  assert.ok(fs.readFileSync(destination, 'utf8') === existing, 'Existing credential file must stay unchanged');
});

test('provisioning refuses unsafe role attributes, existing login, memberships, and broadened CRM boundary', async t => {
  const cases = [
    { roleOverride: { rolsuper: true }, code: 'ROLE_REVIEW_REQUIRED' },
    { roleOverride: { rolinherit: true }, code: 'ROLE_REVIEW_REQUIRED' },
    { roleOverride: { rolcanlogin: true }, code: 'ROLE_REVIEW_REQUIRED' },
    { memberships: 1, code: 'ROLE_MEMBERSHIP_REVIEW_REQUIRED' },
    { functionOverride: { prosecdef: false }, code: 'CRM_BOUNDARY_REVIEW_REQUIRED' },
    { functionOverride: { proconfig: ['search_path=public'] }, code: 'CRM_BOUNDARY_REVIEW_REQUIRED' },
    { crmTableGrants: 1, code: 'CRM_BOUNDARY_REVIEW_REQUIRED' },
    { helperGrants: 1, code: 'CRM_BOUNDARY_REVIEW_REQUIRED' },
  ];
  for (const options of cases) {
    const { root, destination } = fixture(t);
    const { Client, state } = fakeDatabase(options);
    await expectSafeFailure(() => provision({ root, Client }), options.code, state);
    assert.equal(state.rolledBack, true);
    assert.equal(fs.existsSync(destination), false);
    assert.ok(!state.queries.some(sql => sql.startsWith('ALTER ROLE')), 'Unsafe roles must fail before credential mutation');
  }
});

test('provisioning refuses inherited PUBLIC writes, schema creation, and external privileged routines', async t => {
  for (const options of [{ publicWrites: 1 }, { publicSchemaCreates: 1 }, { publicDefiners: 1 }]) {
    const { root, destination } = fixture(t);
    const { Client, state } = fakeDatabase(options);
    await expectSafeFailure(() => provision({ root, Client }), 'PUBLIC_PRIVILEGES_REVIEW_REQUIRED', state);
    assert.equal(state.rolledBack, true);
    assert.equal(fs.existsSync(destination), false);
    assert.ok(!state.queries.some(sql => sql.startsWith('ALTER ROLE')), 'PUBLIC scope checks must precede credential mutation');
  }
});

test('provisioning succeeds with a durable 0600 scoped credential and never resets it on rerun', async t => {
  const { root, destination } = fixture(t);
  const { Client, state } = fakeDatabase();
  const result = await provision({ root, Client });
  assert.equal(result.status, 'provisioned');
  assert.equal(state.committed, true);
  assert.equal(state.rolledBack, undefined);
  assert.equal(fs.statSync(destination).mode & 0o777, 0o600);
  const body = fs.readFileSync(destination, 'utf8');
  const url = new URL(body.split('\n').find(line => line.startsWith('CRM_DATABASE_URL=')).slice('CRM_DATABASE_URL='.length));
  assert.equal(url.hostname, 'aws-0-us-west-1.pooler.supabase.com');
  assert.equal(url.username, `crm_agent.${REF}`);
  assert.equal(url.port, '5432');
  assert.equal(url.pathname, '/postgres');
  assert.ok(/^[a-f0-9]{96}$/.test(url.password), 'Scoped password must have 384 bits from hexadecimal random bytes');
  assert.ok(body.includes('CRM_ACTOR=assistant:bing-local\n'));
  assert.ok(body.includes('CRM_DATABASE_CA_FILE='));
  assert.equal(state.config.ssl.rejectUnauthorized, true);
  assert.equal(state.config.host, 'aws-0-us-west-1.pooler.supabase.com');
  assert.equal(state.config.user, `postgres.${REF}`);
  assertNoCredential(result, state);
  // Scope checks deliberately audit writes rather than block harmless ordinary
  // PUBLIC SELECT permissions. The supplied mock has no write/definer grants.
  const aclQuery = state.queries.find(sql => sql.includes('has_any_column_privilege'));
  assert.ok(aclQuery.includes("'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'"));
  assert.ok(!aclQuery.includes("'SELECT,INSERT"), 'Public ordinary-data SELECT must not be a false provisioning block');
  const connectsBefore = state.connects;
  await expectSafeFailure(() => provision({ root, Client }), 'CREDENTIAL_FILE_EXISTS', state);
  assert.equal(state.connects, connectsBefore);
  assert.ok(fs.readFileSync(destination, 'utf8') === body, 'Successful credentials must never be silently reset');
});

test('a role mutation failure rolls back and removes staged credentials without leaking driver errors', async t => {
  const { root, destination } = fixture(t);
  const { Client, state } = fakeDatabase({ afterAlterFailure: true });
  await expectSafeFailure(() => provision({ root, Client }), 'PROVISIONING_FAILED', state);
  assert.equal(state.rolledBack, true);
  assert.equal(state.login, false);
  assert.equal(fs.existsSync(destination), false);
  assert.deepEqual(fs.readdirSync(path.join(root, '.crm')), []);
});

test('pre-commit filesystem failure rolls back and removes only the credential inode created by this run', async t => {
  const { root, destination } = fixture(t);
  const { Client, state } = fakeDatabase();
  const originalFsync = fs.fsyncSync;
  let calls = 0;
  fs.fsyncSync = fd => {
    calls += 1;
    if (calls === 2) throw new Error(`Synthetic directory durability failure ${state.generatedPassword}`);
    return originalFsync(fd);
  };
  try {
    await expectSafeFailure(() => provision({ root, Client }), 'PROVISIONING_FAILED', state);
  } finally { fs.fsyncSync = originalFsync; }
  assert.equal(state.rolledBack, true);
  assert.equal(state.login, false);
  assert.equal(state.queries.includes('COMMIT'), false);
  assert.equal(fs.existsSync(destination), false);
  assert.deepEqual(fs.readdirSync(path.join(root, '.crm')), []);
});

test('pre-commit rollback preserves a destination concurrently replaced by another writer', async t => {
  const { root, destination } = fixture(t);
  const { Client, state } = fakeDatabase();
  const originalFsync = fs.fsyncSync;
  let calls = 0;
  const replacement = 'SYNTHETIC_CONCURRENT_FILE_KEEP';
  fs.fsyncSync = fd => {
    calls += 1;
    if (calls === 2) {
      const other = path.join(root, 'replacement.tmp');
      fs.writeFileSync(other, replacement, { mode: 0o600 });
      fs.renameSync(other, destination);
      throw new Error('Synthetic competing writer before commit');
    }
    return originalFsync(fd);
  };
  try {
    await expectSafeFailure(() => provision({ root, Client }), 'PROVISIONING_FAILED', state);
  } finally { fs.fsyncSync = originalFsync; }
  assert.equal(state.rolledBack, true);
  assert.equal(state.queries.includes('COMMIT'), false);
  assert.ok(fs.readFileSync(destination, 'utf8') === replacement, 'Rollback must not remove another writer\'s credential file');
});

test('ambiguous COMMIT preserves the only recovery credential and refuses automatic rerun/reset', async t => {
  const { root, destination } = fixture(t);
  const { Client, state } = fakeDatabase({ commitFailure: true });
  await expectSafeFailure(() => provision({ root, Client }), 'COMMIT_OUTCOME_REVIEW_REQUIRED', state);
  assert.equal(state.commitUncertain, true);
  assert.equal(state.queries.includes('COMMIT'), true);
  assert.equal(fs.statSync(destination).mode & 0o777, 0o600);
  const credential = fs.readFileSync(destination, 'utf8');
  assert.ok(credential.includes(state.generatedPassword), 'Recovery credential must survive unknown commit state');
  const connectsBefore = state.connects;
  await expectSafeFailure(() => provision({ root, Client }), 'CREDENTIAL_FILE_EXISTS', state);
  assert.equal(state.connects, connectsBefore);
  assert.ok(fs.readFileSync(destination, 'utf8') === credential, 'Ambiguous outcome must never trigger an automatic reset');
});
