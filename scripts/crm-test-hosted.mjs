#!/usr/bin/env node
// Hosted verification only: all synthetic workflow writes stay inside ROLLBACK.
// No role, schema, grants, outreach, or operational data changes are committed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { connectionConfig, CRM_SQL, TARGET_PROJECT } from './crm-client.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const POOLER_HOST = 'aws-0-us-west-1.pooler.supabase.com';
class VerificationError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new VerificationError(code, message); };

function readEnv(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch { fail('CONFIG_UNAVAILABLE', 'Required private target configuration cannot be read.'); }
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        try { value = JSON.parse(value); } catch { fail('CONFIG_INVALID', 'Private configuration contains an invalid quoted value.'); }
      } else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      result[match[1]] = value;
    }
  }
  return result;
}

function adminConfig(root) {
  const env = readEnv(path.join(root, '.env'));
  if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${TARGET_PROJECT}.supabase.co` || !env.SUPABASE_DB_PASSWORD) {
    fail('WRONG_TARGET', 'Hosted verification accepts only the approved target-specific maintainer configuration.');
  }
  let ca;
  try { ca = fs.readFileSync(path.join(root, 'supabase/certs/prod-ca-2021.crt'), 'utf8'); }
  catch { fail('CA_UNAVAILABLE', 'The checked Supabase CA certificate is required.'); }
  if (!ca.includes('-----BEGIN CERTIFICATE-----')) fail('CA_INVALID', 'The checked Supabase CA certificate is invalid.');
  return {
    host: POOLER_HOST, port: 5432, database: 'postgres', user: `postgres.${TARGET_PROJECT}`,
    password: env.SUPABASE_DB_PASSWORD, ssl: { ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 15000, statement_timeout: 60000, query_timeout: 90000,
    application_name: 'arcane-crm-hosted-verification',
  };
}

function workflowSource(root) {
  let source;
  try { source = fs.readFileSync(path.join(root, 'scripts/crm-workflow.sql'), 'utf8'); }
  catch { fail('WORKFLOW_UNAVAILABLE', 'The reviewed transactional workflow SQL cannot be read.'); }
  const marker = '\nSET LOCAL ROLE crm_agent;';
  const parts = source.split(marker);
  if (parts.length !== 2) fail('WORKFLOW_BOUNDARY_INVALID', 'Expected exactly one scoped-role test boundary in the workflow SQL.');
  const prefix = parts[0];
  // These reviewed DO blocks execute inside the explicit transaction. They
  // cannot commit from inside a DO block. Reject top-level commit/reset drift.
  if (!/^BEGIN;$/m.test(prefix) || /^\s*(COMMIT|ROLLBACK|PREPARE\s+TRANSACTION)\b/im.test(prefix) ||
      /^\s*(CREATE|ALTER|DROP|GRANT|REVOKE|TRUNCATE)\s/im.test(prefix)) {
    fail('WORKFLOW_BOUNDARY_INVALID', 'Workflow SQL must retain its rollback-only, schema-preserving boundary.');
  }
  return {
    sql: `${prefix}\nROLLBACK;\n`,
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
  };
}

const COUNT_SQL = `SELECT jsonb_build_object(
  'organizations',(SELECT count(*) FROM crm.organizations),'people',(SELECT count(*) FROM crm.people),
  'contacts',(SELECT count(*) FROM crm.contacts),'relationships',(SELECT count(*) FROM crm.relationships),
  'relationship_events',(SELECT count(*) FROM crm.relationship_events),'research',(SELECT count(*) FROM crm.research),
  'interactions',(SELECT count(*) FROM crm.interactions),'action_events',(SELECT count(*) FROM crm.action_events),
  'imports',(SELECT count(*) FROM crm.imports),'receipts',(SELECT count(*) FROM crm.receipts),
  'fixture_contacts',(SELECT count(*) FROM crm.contacts WHERE id LIKE 'TEST-CRM-%'),
  'fixture_receipts',(SELECT count(*) FROM crm.receipts WHERE idempotency_key LIKE 'test-crm-%')) AS counts`;

async function counts(client) { return (await client.query(COUNT_SQL)).rows[0].counts; }
async function rollback(client) { try { await client.query('ROLLBACK'); } catch { /* no driver details */ } }

async function mustDeny(client, sql, values = []) {
  await client.query('SAVEPOINT crm_authorization_probe');
  let denied = false;
  try { await client.query({ text: sql, values }); }
  catch (error) {
    if (error?.code !== '42501') fail('AUTHORIZATION_PROBE_FAILED', 'Authorization probe failed for a reason other than access denial.');
    denied = true;
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT crm_authorization_probe');
    await client.query('RELEASE SAVEPOINT crm_authorization_probe');
  }
  if (!denied) fail('UNEXPECTED_ACCESS', 'A role could access a CRM operation that must be denied.');
}

async function visitorAclProof(client, role) {
  const result = await client.query(`SELECT
    has_schema_privilege($1::name,'crm','USAGE') AS schema_usage,
    has_function_privilege($1::name,'crm.command(text,jsonb,text)','EXECUTE') AS command_execute,
    EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='crm' AND c.relkind IN ('r','p','v','m','f') AND (
        has_table_privilege($1::name,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
        has_any_column_privilege($1::name,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) AS table_access,
    (SELECT count(*)::integer FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='crm' AND c.relkind IN ('r','p')) AS table_count,
    (SELECT count(*)::integer FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='crm' AND c.relkind IN ('r','p') AND c.relrowsecurity) AS rls_table_count,
    (SELECT count(*)::integer FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='crm') AS policy_count`, [role]);
  const proof = result.rows[0];
  if (proof.schema_usage || proof.command_execute || proof.table_access || proof.table_count < 1 ||
      proof.rls_table_count !== proof.table_count || proof.policy_count !== 0) {
    fail('VISITOR_BOUNDARY_INVALID', 'Visitor/customer privileges or default-deny CRM row security differ from the reviewed boundary.');
  }
  return proof;
}

async function verifyVisitor(client, role) {
  // Role is selected only from this fixed allowlist, never from user input.
  if (!['anon', 'authenticated'].includes(role)) fail('INVALID_TEST_ROLE', 'Unsupported visitor test role.');
  const acl = await visitorAclProof(client, role);
  await client.query('BEGIN');
  let canSetRole = false;
  try {
    try { await client.query(`SET LOCAL ROLE ${role}`); canSetRole = true; }
    catch (error) {
      if (error?.code !== '42501') fail('ROLE_PROBE_FAILED', 'Visitor role probe failed for a reason other than missing SET ROLE permission.');
    }
    if (!canSetRole) {
      return {
        role, status: 'denied_by_effective_acl', mode: 'acl_only', acl,
        limitation: `Maintainer cannot SET ROLE ${role}; effective grants and default-deny RLS were verified, but runtime impersonation was unavailable.`,
      };
    }
    await mustDeny(client, CRM_SQL, ['summary', '{}', 'verification:visitor-probe']);
    await mustDeny(client, 'SELECT 1 FROM crm.contacts LIMIT 1');
    return { role, status: 'denied', mode: 'runtime_and_acl', command_denied: true, table_denied: true, acl };
  } finally { await rollback(client); }
}

async function verifyAgent(client) {
  await client.connect();
  await client.query('BEGIN');
  try {
    const identity = await client.query('SELECT current_user AS role');
    if (identity.rows[0].role !== 'crm_agent') fail('WRONG_AGENT_ROLE', 'Scoped verification did not connect as crm_agent.');
    const summary = await client.query({ text: CRM_SQL, values: ['summary', '{}', 'verification:scoped-login'] });
    if (!summary.rows[0]?.result?.metric_definition) fail('AGENT_COMMAND_FAILED', 'Scoped summary did not return the expected structured result.');
    const search = await client.query({ text: CRM_SQL, values: ['search', '{"query":"TEST-CRM-","limit":100}', 'verification:scoped-login'] });
    if (!Array.isArray(search.rows[0]?.result?.contacts) || search.rows[0].result.total !== 0) {
      fail('FIXTURE_RESIDUE', 'Scoped search found synthetic workflow contacts after rollback.');
    }
    await mustDeny(client, 'SELECT 1 FROM crm.contacts LIMIT 1');
    await mustDeny(client, "SELECT crm.timestamp_arg('2026-10-28T00:00:00Z','verification')");
    return { status: 'verified', role: 'crm_agent', summary_allowed: true, search_allowed: true,
      direct_table_denied: true, internal_helper_denied: true, transaction: 'rolled_back' };
  } finally { await rollback(client); }
}

export async function verifyHosted({ root = ROOT, Client } = {}) {
  const adminOptions = adminConfig(root);
  const credentialFile = path.join(root, '.env.crm.local');
  let stat;
  try { stat = fs.lstatSync(credentialFile); } catch { fail('AGENT_CONFIG_UNAVAILABLE', 'The scoped CRM credential file is required.'); }
  if (!stat.isFile() || (stat.mode & 0o777) !== 0o600) fail('AGENT_CONFIG_MODE_INVALID', 'Scoped CRM credentials must be a regular file with mode 0600.');
  const agentEnv = readEnv(credentialFile);
  if (!agentEnv.CRM_DATABASE_CA_FILE) fail('AGENT_CA_REQUIRED', 'Scoped hosted verification requires an explicit trusted CA file.');
  let agentOptions;
  try { agentOptions = connectionConfig(agentEnv); }
  catch { fail('AGENT_TARGET_INVALID', 'Scoped CRM target or trusted TLS configuration is invalid.'); }
  const workflow = workflowSource(root);
  if (!Client) ({ Client } = (await import('pg')).default);
  const admin = new Client(adminOptions);
  const agent = new Client(agentOptions);
  const notices = [];
  let adminConnected = false;
  admin.on?.('notice', notice => { if (typeof notice.message === 'string' && notice.message.startsWith('PASS: ')) notices.push(notice.message); });
  try {
    await admin.connect(); adminConnected = true;
    const before = await counts(admin);
    if (before.fixture_contacts !== 0 || before.fixture_receipts !== 0) fail('PREEXISTING_FIXTURES', 'Synthetic workflow IDs already exist; no cleanup or overwrite was attempted.');
    try { await admin.query(workflow.sql); }
    finally { await rollback(admin); }
    if (notices.length < 2) fail('WORKFLOW_ASSERTIONS_MISSING', 'The expected core workflow and regression assertion notices were not observed.');
    const afterWorkflow = await counts(admin);
    if (JSON.stringify(before) !== JSON.stringify(afterWorkflow)) fail('WORKFLOW_COUNTS_CHANGED', 'CRM row counts changed across the rolled-back workflow; inspect concurrent changes before continuing.');
    const visitors = [];
    for (const role of ['anon', 'authenticated']) visitors.push(await verifyVisitor(admin, role));
    const scoped = await verifyAgent(agent);
    const after = await counts(admin);
    if (after.fixture_contacts !== 0 || after.fixture_receipts !== 0 || JSON.stringify(before) !== JSON.stringify(after)) {
      fail('FIXTURE_RESIDUE_OR_CONCURRENT_CHANGE', 'Fixture residue or concurrent CRM changes prevent a clean verification result.');
    }
    return {
      status: 'verified', project_ref: TARGET_PROJECT, verified_at: new Date().toISOString(),
      workflow: { status: 'passed', source_sha256: workflow.sha256, assertions: notices, transaction: 'rolled_back' },
      visitor_access: visitors, scoped_agent_access: scoped,
      cleanup: { fixture_contacts: after.fixture_contacts, fixture_receipts: after.fixture_receipts,
        all_crm_row_counts_unchanged: true, committed_test_writes: false },
      limitations: visitors.filter(item => item.limitation).map(item => item.limitation),
    };
  } finally {
    if (adminConnected) await rollback(admin);
    try { await admin.end(); } catch { /* never emit driver details */ }
    try { await agent.end(); } catch { /* never emit driver details */ }
  }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1 || argv[0] !== '--verify') {
    return { status: 'not_run', code: 'EXPLICIT_COMMAND_REQUIRED', usage: 'node scripts/crm-test-hosted.mjs --verify' };
  }
  return verifyHosted();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status === 'not_run') process.exitCode = 2;
  }).catch(error => {
    const output = error instanceof VerificationError
      ? { status: 'failed', code: error.code, message: error.message }
      : { status: 'failed', code: 'HOSTED_VERIFICATION_FAILED', message: 'Hosted verification failed. Transactions were rolled back where connected; inspect target readiness without logging credentials or raw driver errors.' };
    process.stderr.write(`${JSON.stringify(output)}\n`); process.exitCode = 1;
  });
}
