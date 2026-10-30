#!/usr/bin/env node
// Maintainer-only. Do not import from browser/application code.
// Run only after the human has explicitly approved creating the scoped login.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const PROJECT_REF = 'nydmouxljprsfymcvqko';
const POOLER_HOST = 'aws-0-us-west-1.pooler.supabase.com';
const ROLE = 'crm_agent';
const CREDENTIAL_NAME = '.env.crm.local';

class ProvisionError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new ProvisionError(code, message); };

function pathExists(file) {
  try { fs.lstatSync(file); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    fail('FILESYSTEM_CHECK_FAILED', 'Cannot inspect the local credential destination.');
  }
}

export function validateRole(role, expectLogin = false) {
  if (!role || role.rolname !== ROLE || role.rolcanlogin !== expectLogin ||
      ['rolsuper', 'rolcreatedb', 'rolcreaterole', 'rolreplication', 'rolbypassrls', 'rolinherit'].some(key => role[key] !== false)) {
    fail('ROLE_REVIEW_REQUIRED', 'Expected the existing scoped role with no broader attributes; refusing a credential reset.');
  }
}

function loadMaintainerConfig(root) {
  const config = {};
  let text;
  try { text = fs.readFileSync(path.join(root, '.env'), 'utf8'); }
  catch { fail('CONFIG_MISSING', 'Target-specific maintainer configuration is required.'); }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) config[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  if (config.NEXT_PUBLIC_SUPABASE_URL !== `https://${PROJECT_REF}.supabase.co` || !config.SUPABASE_DB_PASSWORD) {
    fail('WRONG_TARGET', 'Only the approved target-specific database configuration is accepted.');
  }
  const caFile = path.join(root, 'supabase/certs/prod-ca-2021.crt');
  let ca;
  try { ca = fs.readFileSync(caFile, 'utf8'); }
  catch { fail('CA_MISSING', 'The checked Supabase CA file is required; TLS verification cannot be disabled.'); }
  if (!ca.includes('-----BEGIN CERTIFICATE-----')) fail('CA_INVALID', 'The Supabase CA file is invalid.');
  return { ca, caFile, password: config.SUPABASE_DB_PASSWORD };
}

async function checkRoleAndScope(client) {
  const roleResult = await client.query(`SELECT rolname,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolinherit
    FROM pg_catalog.pg_roles WHERE rolname = 'crm_agent'`);
  validateRole(roleResult.rows[0]);
  const members = await client.query(`SELECT count(*)::integer AS count FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles r ON r.oid=m.member OR r.oid=m.roleid WHERE r.rolname='crm_agent'`);
  if (members.rows[0].count !== 0) fail('ROLE_MEMBERSHIP_REVIEW_REQUIRED', 'The scoped role must have no memberships or members.');
  const command = await client.query(`SELECT p.prosecdef,p.proconfig,r.rolname AS owner,
      has_schema_privilege('crm_agent','crm','USAGE') AS schema_usage,
      has_function_privilege('crm_agent',p.oid,'EXECUTE') AS can_execute
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_catalog.pg_roles r ON r.oid=p.proowner
    WHERE n.nspname='crm' AND p.proname='command' AND pg_catalog.pg_get_function_identity_arguments(p.oid)='p_operation text, p_args jsonb, p_actor text'`);
  const fn = command.rows[0];
  if (command.rows.length !== 1 || !fn?.prosecdef || !fn.schema_usage || !fn.can_execute || fn.owner !== 'postgres' ||
      !fn.proconfig?.includes('search_path=pg_catalog, crm')) {
    fail('CRM_BOUNDARY_REVIEW_REQUIRED', 'The reviewed private command boundary was not found with the expected owner and search path.');
  }
  const crmTables = await client.query(`SELECT count(*)::integer AS count FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='crm' AND c.relkind IN ('r','p','v','m','f')
      AND has_table_privilege('crm_agent',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')`);
  const crmHelpers = await client.query(`SELECT count(*)::integer AS count FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='crm' AND p.proname<>'command'
      AND has_function_privilege('crm_agent',p.oid,'EXECUTE')`);
  if (crmTables.rows[0].count || crmHelpers.rows[0].count) {
    fail('CRM_BOUNDARY_REVIEW_REQUIRED', 'The scoped role has direct CRM table or internal helper access.');
  }
  // NOINHERIT does not suppress PUBLIC. Refuse inherited capabilities that can
  // change unrelated data or call privileged application routines; do not repair
  // unrelated grants as a side effect of this provisioning command.
  const broaderTables = await client.query(`SELECT count(*)::integer AS count FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname<>'crm' AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'
      AND c.relkind IN ('r','p','v','m','f') AND (
        has_table_privilege('crm_agent',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
        has_any_column_privilege('crm_agent',c.oid,'INSERT,UPDATE,REFERENCES'))`);
  const broaderSchemas = await client.query(`SELECT count(*)::integer AS count FROM pg_catalog.pg_namespace n
    WHERE n.nspname<>'crm' AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'
      AND has_schema_privilege('crm_agent',n.oid,'CREATE')`);
  const broaderFunctions = await client.query(`SELECT count(*)::integer AS count FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE p.prosecdef AND n.nspname<>'crm'
      AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'
      AND has_schema_privilege('crm_agent',n.oid,'USAGE') AND has_function_privilege('crm_agent',p.oid,'EXECUTE')`);
  if (broaderTables.rows[0].count || broaderSchemas.rows[0].count || broaderFunctions.rows[0].count) {
    fail('PUBLIC_PRIVILEGES_REVIEW_REQUIRED', 'Effective PUBLIC privileges exceed the reviewed CRM-only boundary; no unrelated grants were changed.');
  }
}

export async function provision({ root = ROOT, Client } = {}) {
  const destination = path.join(root, CREDENTIAL_NAME);
  if (pathExists(destination)) fail('CREDENTIAL_FILE_EXISTS', 'Credential file already exists; refusing to reset or overwrite it.');
  const config = loadMaintainerConfig(root);
  if (!Client) ({ Client } = (await import('pg')).default);
  const client = new Client({
    host: POOLER_HOST, port: 5432, user: `postgres.${PROJECT_REF}`, database: 'postgres', password: config.password,
    ssl: { ca: config.ca, rejectUnauthorized: true }, connectionTimeoutMillis: 15000,
    query_timeout: 20000, application_name: 'arcane-crm-maintainer-provision',
  });
  let transaction = false;
  let commitAttempted = false;
  let committed = false;
  let staged;
  let linkedIdentity;
  try {
    await client.connect();
    await client.query('BEGIN'); transaction = true;
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SELECT pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm:provision-login',0))");
    if (pathExists(destination)) fail('CREDENTIAL_FILE_EXISTS', 'Credential file already exists; refusing to reset or overwrite it.');
    await checkRoleAndScope(client);
    const password = crypto.randomBytes(48).toString('hex');
    // This generated hexadecimal value is the only interpolation into SQL.
    // Never include SQL statements, driver errors, configuration, or secrets in output.
    if (!/^[a-f0-9]{96}$/.test(password)) fail('GENERATION_FAILED', 'Credential generation failed.');
    const url = `postgresql://${ROLE}.${PROJECT_REF}:${password}@${POOLER_HOST}:5432/postgres`;
    const body = `CRM_DATABASE_URL=${url}\nCRM_DATABASE_CA_FILE=${JSON.stringify(config.caFile)}\nCRM_ACTOR=assistant:bing-local\n`;
    const privateDir = path.join(root, '.crm');
    fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
    staged = path.join(privateDir, `provision-${crypto.randomBytes(12).toString('hex')}.tmp`);
    const fd = fs.openSync(staged, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
    try { fs.writeFileSync(fd, body, 'utf8'); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); }
    await client.query(`ALTER ROLE crm_agent LOGIN PASSWORD '${password}'`);
    await client.query('GRANT CONNECT ON DATABASE postgres TO crm_agent');
    const after = await client.query(`SELECT rolname,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolinherit
      FROM pg_catalog.pg_roles WHERE rolname='crm_agent'`);
    validateRole(after.rows[0], true);
    // link() publishes without overwriting any existing file. Both paths are on
    // the same filesystem. Make the 0600 credential durable before committing.
    fs.linkSync(staged, destination);
    const stat = fs.lstatSync(destination); linkedIdentity = { dev: stat.dev, ino: stat.ino };
    if ((stat.mode & 0o777) !== 0o600 || !stat.isFile()) fail('CREDENTIAL_MODE_INVALID', 'Credential destination must be a regular file with mode 0600.');
    fs.unlinkSync(staged); staged = undefined;
    const dirFd = fs.openSync(root, fs.constants.O_RDONLY);
    try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
    commitAttempted = true;
    await client.query('COMMIT'); committed = true; transaction = false;
    return { status: 'provisioned', project_ref: PROJECT_REF, role: ROLE, credential_file: CREDENTIAL_NAME, mode: '0600' };
  } catch (error) {
    if (transaction) { try { await client.query('ROLLBACK'); } catch { /* never emit driver details */ } }
    if (!commitAttempted && linkedIdentity) {
      try {
        const current = fs.lstatSync(destination);
        if (current.dev === linkedIdentity.dev && current.ino === linkedIdentity.ino) fs.unlinkSync(destination);
      } catch { /* a changed destination must never be removed */ }
    }
    if (commitAttempted && !committed) {
      // A lost COMMIT acknowledgement is ambiguous. Preserve the only recovery
      // credential and refuse automatic reset on subsequent runs.
      fail('COMMIT_OUTCOME_REVIEW_REQUIRED', 'Commit outcome is uncertain. The local credential was preserved; verify role/login state before any manual recovery.');
    }
    if (error instanceof ProvisionError) throw error;
    fail('PROVISIONING_FAILED', 'Provisioning stopped without a confirmed committed login change. No secret or driver details were logged.');
  } finally {
    if (staged) { try { fs.unlinkSync(staged); } catch { /* restricted orphan file can be reviewed locally */ } }
    try { await client.end(); } catch { /* no driver details */ }
  }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1 || argv[0] !== '--provision') {
    return { status: 'not_run', code: 'EXPLICIT_COMMAND_REQUIRED', usage: 'node scripts/crm-provision.mjs --provision', note: 'Requires prior explicit human approval for the scoped login.' };
  }
  return provision();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(result => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status === 'not_run') process.exitCode = 2;
  }).catch(error => {
    const safe = error instanceof ProvisionError
      ? { status: 'stopped', code: error.code, message: error.message }
      : { status: 'stopped', code: 'PROVISIONING_FAILED', message: 'Provisioning stopped. Inspect configuration without logging secrets.' };
    process.stderr.write(`${JSON.stringify(safe)}\n`); process.exitCode = 1;
  });
}
