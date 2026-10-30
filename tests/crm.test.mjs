import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { CRM_SQL, TARGET_PROJECT, CrmError, connectionConfig, executeRequest, safeError, validateRequest } from '../scripts/crm-client.mjs';
import { parseArguments } from '../scripts/crm.mjs';

const actor = 'test:local-only';
const env = { CRM_DATABASE_URL: `postgresql://crm_agent.${TARGET_PROJECT}:fixture-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres` };
const event = (changes = {}) => ({
  idempotency_key: 'fixture:sent:1', contact_id: 'FIXTURE-CONTACT', type: 'sent',
  occurred_at: '2026-01-01T12:00:00Z', channel: 'email', sending_account: 'sender@example.invalid',
  confirmation: 'user_confirmed', evidence: 'Local test fixture; never sent or imported', summary: 'Confirmed initial message', ...changes,
});
const record = () => ({
  contact_id: 'FIXTURE-CONTACT', organization_name: 'Local test fixture',
  person_name: null, person_role: null, channel: 'email', address: 'person@example.invalid',
  relationship_types: ['pilot_prospect'], stage: 'proposed', owner: 'Bing',
  context: { uncertainty: 'Local test data' }, source_record: { raw_row: ['fixture'] },
  research: [{ source_key: 'fixture:research', source_url: 'https://example.invalid/', kind: 'research', content: { uncertainty: 'Unverified fixture' } }],
  next_action: null,
});
const batch = () => ({ idempotency_key: 'fixture:batch:1', source_key: 'fixture:snapshot', captured_at: '2026-01-01T12:00:00Z', source_sha256: 'a'.repeat(64), records: [record()], interactions: [] });
const rejectsInput = fn => assert.throws(fn, error => error instanceof CrmError && error.code === 'INVALID_INPUT');

test('connection accepts only dedicated target login with verified TLS', () => {
  const config = connectionConfig(env);
  assert.equal(config.user, `crm_agent.${TARGET_PROJECT}`);
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(config.port, 5432);
  assert.equal(config.password, 'fixture-password');
});

test('connection rejects service product database, admin/visitor roles, wrong hosts and TLS overrides', () => {
  for (const url of [
    env.CRM_DATABASE_URL.replace(TARGET_PROJECT, 'wdoiouwzfutdtmdsdgkr'),
    env.CRM_DATABASE_URL.replace('crm_agent.', 'postgres.'),
    env.CRM_DATABASE_URL.replace('crm_agent.', 'authenticated.'),
    env.CRM_DATABASE_URL.replace('aws-0-us-west-1.pooler.supabase.com', 'attacker.invalid'),
    env.CRM_DATABASE_URL.replace(':5432/', ':6543/'),
    `${env.CRM_DATABASE_URL}?sslmode=disable`,
    `${env.CRM_DATABASE_URL}?sslmode=no-verify`,
    `${env.CRM_DATABASE_URL}?options=-c%20search_path%3Dpublic`,
    `${env.CRM_DATABASE_URL}#fragment`,
  ]) {
    assert.throws(() => connectionConfig({ CRM_DATABASE_URL: url }), error => error.code === 'UNSAFE_DATABASE_TARGET');
  }
});

test('private CA preserves peer verification even with URL sslmode=require', () => {
  const config = connectionConfig({ ...env, CRM_DATABASE_URL: `${env.CRM_DATABASE_URL}?sslmode=require`, CRM_DATABASE_CA_FILE: '/fixture/ca.pem' }, () => 'FIXTURE CA');
  assert.deepEqual(config.ssl, { rejectUnauthorized: true, ca: 'FIXTURE CA' });
});

test('connection never falls back to website/admin environment credentials', () => {
  assert.throws(() => connectionConfig({ SUPABASE_DB_PASSWORD: 'admin-secret', NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid' }), error => error.code === 'CRM_NOT_CONFIGURED');
});

test('query uses a single fixed parameterized private operation', async () => {
  const calls = [];
  class FakeClient {
    constructor(config) { calls.push(['config', config.user]); }
    async connect() { calls.push(['connect']); }
    async query(query) { calls.push(['query', query]); return { rows: [{ result: { contacts: [] } }] }; }
    async end() { calls.push(['end']); }
  }
  const args = { query: "'; DROP SCHEMA public; --" };
  assert.deepEqual(await executeRequest({ operation: 'search', args, actor, env, Client: FakeClient }), { contacts: [] });
  assert.deepEqual(calls[2], ['query', { text: CRM_SQL, values: ['search', JSON.stringify(args), actor] }]);
  assert.deepEqual(calls[3], ['end']);
});

test('connection is closed after failed command or failed authentication', async () => {
  for (const at of ['connect', 'query']) {
    let ended = false;
    class FakeClient {
      async connect() { if (at === 'connect') throw Object.assign(new Error('secret'), { code: '28P01' }); }
      async query() { throw Object.assign(new Error('secret'), { code: '42501' }); }
      async end() { ended = true; }
    }
    await assert.rejects(executeRequest({ operation: 'summary', args: {}, actor, env, Client: FakeClient }));
    assert.equal(ended, true);
  }
});

test('invalid write cannot establish a connection', async () => {
  let constructed = false;
  class NeverConnect { constructor() { constructed = true; } }
  await assert.rejects(executeRequest({ operation: 'interaction', args: event({ sending_account: undefined }), actor, env, Client: NeverConnect }), error => error.code === 'INVALID_INPUT');
  assert.equal(constructed, false);
});

test('send requires actor, identity, account, actual timestamp, evidence and confirmation', () => {
  assert.equal(validateRequest('interaction', event(), actor).operation, 'interaction');
  for (const field of ['idempotency_key', 'contact_id', 'sending_account', 'occurred_at', 'evidence', 'confirmation']) {
    rejectsInput(() => validateRequest('interaction', event({ [field]: undefined }), actor));
  }
  rejectsInput(() => validateRequest('interaction', event(), undefined));
  rejectsInput(() => validateRequest('interaction', event({ confirmation: 'draft_created' }), actor));
  rejectsInput(() => validateRequest('interaction', event({ occurred_at: '2100-01-01T00:00:00Z' }), actor));
});

test('automatic and human replies remain distinct and cannot be follow-up sends', () => {
  for (const type of ['human_reply', 'auto_reply']) {
    validateRequest('interaction', event({ type, sending_account: null }), actor);
    rejectsInput(() => validateRequest('interaction', event({ type, is_follow_up: true }), actor));
  }
  validateRequest('interaction', event({ is_follow_up: true }), actor);
  rejectsInput(() => validateRequest('interaction', event({ type: 'human_reply', follow_up_due_at: '2026-01-02T00:00:00Z' }), actor));
  rejectsInput(() => validateRequest('interaction', event({ follow_up_due_at: '2025-12-31T00:00:00Z' }), actor));
  validateRequest('interaction', event({ follow_up_due_at: '2026-01-02T00:00:00Z' }), actor);
});

test('no-reply state requires a bounded manual inbox check', () => {
  rejectsInput(() => validateRequest('interaction', event({ inbox_state: 'no_reply' }), actor));
  rejectsInput(() => validateRequest('interaction', event({ type: 'inbox_checked', inbox_state: 'no_reply' }), actor));
  validateRequest('interaction', event({ type: 'inbox_checked', inbox_state: 'no_reply', checked_through: '2026-01-01T11:59:00Z' }), actor);
  rejectsInput(() => validateRequest('interaction', event({ type: 'inbox_checked', sending_account: undefined, inbox_state: 'no_reply', checked_through: '2026-01-01T11:59:00Z' }), actor));
  rejectsInput(() => validateRequest('interaction', event({ type: 'inbox_checked', sending_account: '', inbox_state: 'unknown', checked_through: '2026-01-01T11:59:00Z' }), actor));
  rejectsInput(() => validateRequest('interaction', event({ type: 'inbox_checked', inbox_state: 'no_reply', checked_through: '2026-01-02T00:00:00Z' }), actor));
});

test('reject ambiguous date-only, invalid calendar and missing zone timestamps', () => {
  for (const occurred_at of ['2026-01-01', '2026-01-01T12:00:00', '2026-02-30T12:00:00Z', '2026-01-01T24:00:00Z']) {
    rejectsInput(() => validateRequest('interaction', event({ occurred_at }), actor));
  }
  validateRequest('interaction', event({ occurred_at: '2026-01-01T04:00:00-08:00' }), actor);
});

test('import preserves source and uncertainty, allows unknown person and no invented activity', () => {
  const args = batch();
  assert.equal(validateRequest('import', args, actor).args, args);
  assert.equal(args.records[0].person_name, null);
  assert.deepEqual(args.interactions, []);
  assert.equal(args.records[0].context.uncertainty, 'Local test data');
});

test('import rejects missing provenance, duplicate identities, malformed records and incomplete actual sends', () => {
  for (const mutate of [
    args => { delete args.source_sha256; },
    args => { delete args.source_key; },
    args => { args.records.push(record()); },
    args => { args.records[0].relationship_types = []; },
    args => { args.records[0].research[0].content = 'unstructured'; },
    args => { args.interactions = [event({ evidence: undefined })]; },
    args => { args.records[0].next_action = { description: 'Review', owner: 'Bing', due_at: 'tomorrow' }; },
  ]) {
    const args = batch();
    mutate(args);
    rejectsInput(() => validateRequest('import', args, actor));
  }
});

test('relationship mutation supports multiple relationship roles through independent events', () => {
  for (const relationship_type of ['pilot_prospect', 'publisher', 'partner', 'customer']) {
    validateRequest('relationship', { idempotency_key: `fixture:role:${relationship_type}`, contact_id: 'FIXTURE-CONTACT', relationship_type, stage: 'proposed', context: { uncertainty: 'fixture' } }, actor);
  }
  rejectsInput(() => validateRequest('relationship', { idempotency_key: 'fixture:role:typo', contact_id: 'FIXTURE-CONTACT', relationship_type: 'publiser', stage: 'proposed' }, actor));
});

test('actions require explicit status, owner and idempotency', () => {
  const args = { idempotency_key: 'fixture:action:1', contact_id: 'FIXTURE-CONTACT', description: 'Review this candidate', owner: 'Bing', status: 'open', due_at: null };
  validateRequest('action', args, actor);
  for (const key of ['owner', 'status', 'idempotency_key']) {
    rejectsInput(() => validateRequest('action', { ...args, [key]: undefined }, actor));
  }
});

test('reject unknown operations, typo fields and unreasonable result limits', () => {
  rejectsInput(() => validateRequest('sql', { query: 'SELECT *' }, actor));
  rejectsInput(() => validateRequest('search', { query: 'fixture', limt: 20 }, actor));
  rejectsInput(() => validateRequest('search', { query: 'fixture', limit: 100000 }, actor));
  rejectsInput(() => validateRequest('due', { limit: 101 }, actor));
  validateRequest('due', { limit: 100 }, actor);
  rejectsInput(() => validateRequest('summary', { since: '2026-01-02T00:00:00Z', until: '2026-01-01T00:00:00Z' }, actor));
  rejectsInput(() => validateRequest('summary', { since: '2026-01-01T00:00:00Z' }, actor));
  rejectsInput(() => validateRequest('import', { ...batch(), records: [] }, actor));
  rejectsInput(() => validateRequest('interaction', event({ idempotency_key: 'a'.repeat(201) }), actor));
  rejectsInput(() => validateRequest('history', { contact_id: 'a'.repeat(151) }, actor));
  rejectsInput(() => validateRequest('summary', {}, 'a'.repeat(151)));
});

test('search supports browse, outbound/reply/role filters and bounded pagination', () => {
  for (const args of [
    {}, { query: '' }, { query: '', contacted: true, limit: 100, offset: 0 },
    { contacted: false, response_state: 'not_contacted', relationship_type: 'pilot_prospect', offset: 100 },
    { response_state: 'human_reply', relationship_type: 'publisher' },
  ]) validateRequest('search', args, actor);
  for (const args of [
    { offset: -1 }, { offset: 1.5 }, { offset: 2147483648 },
    { contacted: 'true' }, { response_state: 'no_reply' }, { relationship_type: 'publiser' },
    { query: null },
  ]) rejectsInput(() => validateRequest('search', args, actor));
  validateRequest('due', { as_of: '2026-10-29T14:00:00Z', limit: 100, offset: 100 }, actor);
  rejectsInput(() => validateRequest('due', { offset: -1 }, actor));
});

test('CLI supports bounded JSON input from argument, file and stdin', () => {
  assert.deepEqual(parseArguments(['search', '{"query":"fixture"}', '--actor', actor], {}), { operation: 'search', args: { query: 'fixture' }, actor });
  assert.deepEqual(parseArguments(['history', '--file', '/fixture/input.json'], { CRM_ACTOR: actor }, () => '{"contact_id":"FIXTURE-CONTACT"}').args, { contact_id: 'FIXTURE-CONTACT' });
  assert.deepEqual(parseArguments(['summary', '--stdin'], { CRM_ACTOR: actor }, () => '{}').args, {});
  assert.equal(parseArguments(['--help']).help, true);
  rejectsInput(() => parseArguments(['summary', '{}', '--stdin'], {}, () => '{}'));
  rejectsInput(() => parseArguments(['summary', '{broken}']));
  rejectsInput(() => parseArguments(['summary', '--typo']));
});

test('database exceptions never expose raw error, query, password or connection URL', () => {
  const raw = Object.assign(new Error(`password=${env.CRM_DATABASE_URL}`), { code: '42501', detail: 'secret raw database detail' });
  const output = JSON.stringify(safeError(raw));
  assert.match(output, /not authorized/);
  assert.doesNotMatch(output, /fixture-password|postgresql|raw database detail/);
  assert.equal(safeError(new Error('raw')).error.code, 'CRM_REQUEST_FAILED');
});

test('CLI help and invalid input run locally without connecting to CRM', () => {
  const help = spawnSync(process.execPath, ['scripts/crm.mjs', '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /never sends outreach/);
  const bad = spawnSync(process.execPath, ['scripts/crm.mjs', 'interaction', '{}', '--actor', actor], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stderr).error.code, 'INVALID_INPUT');
  assert.equal(bad.stdout, '');
});
