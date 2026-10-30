#!/usr/bin/env node
// Pending-migration rehearsal only. Every schema/role/grant/fixture change rolls back.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(import.meta.dirname,'..');
const REF='nydmouxljprsfymcvqko';
const MIGRATION='20261030030000_private_crm_web_reader.sql';
class VerificationError extends Error { constructor(code,message) { super(message);this.code=code; } }
const fail=(code,message)=>{throw new VerificationError(code,message);};
function privateConfig(root) {
  const env={};
  for(const line of fs.readFileSync(path.join(root,'.env'),'utf8').split(/\r?\n/)) {
    const match=line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if(match) env[match[1]]=match[2].trim().replace(/^(['"])(.*)\1$/,'$2');
  }
  if(env.NEXT_PUBLIC_SUPABASE_URL!==`https://${REF}.supabase.co`||!env.SUPABASE_DB_PASSWORD) fail('WRONG_TARGET','Expected target-specific maintainer configuration.');
  const ca=fs.readFileSync(path.join(root,'supabase/certs/prod-ca-2021.crt'),'utf8');
  if(!ca.includes('-----BEGIN CERTIFICATE-----')) fail('CA_INVALID','Trusted CA is required.');
  return {host:'aws-0-us-west-1.pooler.supabase.com',port:5432,database:'postgres',user:`postgres.${REF}`,
    password:env.SUPABASE_DB_PASSWORD,ssl:{ca,rejectUnauthorized:true},connectionTimeoutMillis:30000,
    statement_timeout:60000,query_timeout:90000,application_name:'arcane-crm-web-rollback-verification'};
}
const COUNTS=`SELECT jsonb_build_object(
  'contacts',(SELECT count(*) FROM crm.contacts),'organizations',(SELECT count(*) FROM crm.organizations),
  'people',(SELECT count(*) FROM crm.people),'research',(SELECT count(*) FROM crm.research),
  'interactions',(SELECT count(*) FROM crm.interactions),'action_events',(SELECT count(*) FROM crm.action_events),
  'relationships',(SELECT count(*) FROM crm.relationships),'relationship_events',(SELECT count(*) FROM crm.relationship_events),
  'imports',(SELECT count(*) FROM crm.imports),'receipts',(SELECT count(*) FROM crm.receipts),
  'fixture_contacts',(SELECT count(*) FROM crm.contacts WHERE id LIKE 'TEST-CRM-%'),
  'fixture_receipts',(SELECT count(*) FROM crm.receipts WHERE idempotency_key LIKE 'test-crm-%'),
  'agent_maintainer_memberships',(SELECT count(*) FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles r ON r.oid=m.roleid JOIN pg_catalog.pg_roles u ON u.oid=m.member
    WHERE r.rolname='crm_agent' AND u.rolname='postgres'),
  'web_role',(SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname='crm_web'),
  'web_function',(SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='crm' AND p.proname='web_read')) AS counts`;
async function mustDeny(client,sql,values=[]) {
  await client.query('SAVEPOINT crm_web_probe'); let denied=false;
  try {await client.query({text:sql,values});}
  catch(error) {if(error?.code!=='42501') fail('DENIAL_PROBE_FAILED','Expected access denial was not observed.'); denied=true;}
  finally {await client.query('ROLLBACK TO SAVEPOINT crm_web_probe');await client.query('RELEASE SAVEPOINT crm_web_probe');}
  if(!denied) fail('UNEXPECTED_ACCESS','A prohibited operation was allowed.');
}
async function setTestRole(client, role) {
  if(!['crm_web','crm_agent'].includes(role)) fail('INVALID_TEST_ROLE','Unsupported fixed test role.');
  await client.query('SAVEPOINT crm_web_role_probe');
  try {await client.query(`SET LOCAL ROLE ${role}`);await client.query('RELEASE SAVEPOINT crm_web_role_probe');return false;}
  catch(error) {
    await client.query('ROLLBACK TO SAVEPOINT crm_web_role_probe');await client.query('RELEASE SAVEPOINT crm_web_role_probe');
    if(error?.code!=='42501') fail('ROLE_PROBE_FAILED','Web role probe failed.');
    // A temporary maintainer membership enables runtime rehearsal. It is in the
    // same outer transaction as CREATE ROLE and is always rolled back with it.
    await client.query(`GRANT ${role} TO postgres`);
    await client.query(`SET LOCAL ROLE ${role}`);return true;
  }
}
function workflow(root) {
  const source=fs.readFileSync(path.join(root,'scripts/crm-web-workflow.sql'),'utf8');
  if([...source.matchAll(/^BEGIN;$/gm)].length!==1 || [...source.matchAll(/^ROLLBACK;$/gm)].length!==1 || /^\s*(COMMIT|PREPARE\s+TRANSACTION)\b/im.test(source)) fail('WORKFLOW_INVALID','Expected one rollback-only workflow boundary.');
  return {source:source.slice(source.indexOf('\nBEGIN;')+8,source.indexOf('\nROLLBACK;')),sha256:crypto.createHash('sha256').update(source).digest('hex')};
}
export async function verifyHosted({root=ROOT,Client}={}) {
  const config=privateConfig(root);
  const source=fs.readFileSync(path.join(root,'supabase/migrations',MIGRATION),'utf8');
  if(/^\s*(COMMIT|ROLLBACK|PREPARE\s+TRANSACTION)\b/im.test(source)) fail('MIGRATION_INVALID','Migration must not control its outer transaction.');
  const test=workflow(root);
  if(!Client) ({Client}=(await import('pg')).default);
  const client=new Client(config);let connected=false;const notices=[];
  client.on?.('notice',notice=>{if(notice.message?.startsWith('PASS: ')) notices.push(notice.message);});
  try {
    await client.connect();connected=true;
    const before=(await client.query(COUNTS)).rows[0].counts;
    if(before.web_role||before.web_function||before.fixture_contacts||before.fixture_receipts) fail('PREEXISTING_STATE','Pending web boundary or synthetic IDs already exist; no changes attempted.');
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query(source);
    const role=(await client.query("SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolinherit FROM pg_catalog.pg_roles WHERE rolname='crm_web'")).rows[0];
    if(!role||Object.values(role).some(Boolean)) fail('ROLE_BOUNDARY_INVALID','New web role has unexpected attributes.');
    const membership=(await client.query("SELECT count(*)::int AS count FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.member OR r.oid=m.roleid WHERE r.rolname='crm_web'")).rows[0].count;
    if(membership) fail('ROLE_MEMBERSHIP_INVALID','New web role has unexpected memberships.');
    const temporaryMembership=await setTestRole(client,'crm_web');
    const read=async(operation,args={})=>(await client.query({text:'SELECT crm.web_read($1::text,$2::jsonb) AS result',values:[operation,JSON.stringify(args)]})).rows[0].result;
    const today=await read('today',{limit:25});
    if(!today?.summary?.metric_definition||!Array.isArray(today.research_batches)) fail('READ_FAILED','Today read did not return reviewed data.');
    const relationships=await read('relationships',{limit:100});
    let detailCounts=null;
    if(relationships.contacts.length) {
      const detail=await read('contact',{contact_id:relationships.contacts[0].contact_id});
      if(!detail?.contact?.id||!detail.organization||!Array.isArray(detail.research)) fail('DETAIL_FAILED','Real contact detail was incomplete.');
      detailCounts={organization_contacts:detail.organization_contacts.length,research:detail.research.length,interactions:detail.interactions.length,actions:detail.actions.length};
    }
    await mustDeny(client,'SELECT 1 FROM crm.contacts LIMIT 1');
    await mustDeny(client,"SELECT crm.command('summary','{}','web-unauthorized')");
    await mustDeny(client,"SELECT crm.timestamp_arg('2026-10-28T00:00:00Z','web-unauthorized')");
    await client.query('RESET ROLE');
    // The hosted maintainer is not a member of the existing agent login. Only
    // this rollback rehearsal adds the membership needed to run its denial
    // probe; it is never part of migration or production login provisioning.
    const temporaryAgentMembership=await setTestRole(client,'crm_agent');
    await client.query('RESET ROLE');
    await client.query(test.source);
    if(notices.length<5) fail('ASSERTIONS_MISSING','Expected web workflow assertions were missing.');
    await client.query('ROLLBACK');
    const after=(await client.query(COUNTS)).rows[0].counts;
    if(JSON.stringify(before)!==JSON.stringify(after)) fail('RESIDUE_OR_CONCURRENT_CHANGE','Row/role/function counts changed after rollback.');
    const report={status:'verified',project_ref:REF,verified_at:new Date().toISOString(),
      migration:{name:MIGRATION,sha256:crypto.createHash('sha256').update(source).digest('hex'),applied_in_rollback_only_transaction:true},
      workflow:{sha256:test.sha256,assertions:notices},
      real_reads:{role:'crm_web',login:false,temporary_maintainer_membership:temporaryMembership,summary:today.summary,
        temporary_agent_probe_membership:temporaryAgentMembership,
        relationships_total:relationships.total,unscheduled_actions:today.unscheduled_actions_total,
        research_batches:today.research_batches,detail_counts:detailCounts},
      direct_table_denied:true,agent_command_denied:true,internal_helper_denied:true,
      cleanup:{all_crm_row_counts_unchanged:true,web_role_exists:false,web_function_exists:false,
        agent_maintainer_memberships:after.agent_maintainer_memberships,
        fixture_contacts:after.fixture_contacts,fixture_receipts:after.fixture_receipts,committed_changes:false}};
    const dir=path.join(root,'.crm');fs.mkdirSync(dir,{recursive:true,mode:0o700});
    fs.writeFileSync(path.join(dir,'web-hosted-rollback-verification.json'),`${JSON.stringify(report,null,2)}\n`,{mode:0o600});
    return {status:'verified',report_file:'.crm/web-hosted-rollback-verification.json',committed_changes:false,contacts:today.summary.contacts,research_batches:today.research_batches.length,workflow_assertions:notices.length};
  } finally {
    if(connected) try {await client.query('ROLLBACK');} catch {}
    try {await client.end();} catch {}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==3||process.argv[2]!=='--verify') {process.stderr.write('Usage: node scripts/crm-web-test-hosted.mjs --verify\n');process.exitCode=2;}
  else verifyHosted().then(result=>process.stdout.write(`${JSON.stringify(result)}\n`)).catch(error=>{
    const safe=error instanceof VerificationError?{status:'failed',code:error.code,message:error.message}:{status:'failed',code:'HOSTED_VERIFICATION_FAILED',message:'Rollback-only web verification stopped. No raw driver errors or credentials were logged.'};
    process.stderr.write(`${JSON.stringify(safe)}\n`);process.exitCode=1;
  });
}
