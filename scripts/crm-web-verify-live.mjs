#!/usr/bin/env node
// Read-only verification after explicitly approved reader activation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { webConnectionConfig, CRM_WEB_SQL } from '../lib/crm/reader.mjs';
import { connectionConfig, CRM_SQL } from './crm-client.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'), REF='nydmouxljprsfymcvqko';
class VerificationError extends Error { constructor(code,message){super(message);this.code=code;} }
const fail=(code,message)=>{throw new VerificationError(code,message);};
function readEnv(file,privateFile=false){
  const stat=fs.lstatSync(file);
  if(privateFile&&(!stat.isFile()||(stat.mode&0o777)!==0o600))fail('CREDENTIAL_MODE_INVALID','Reader/agent credentials must be regular mode0600 files.');
  const env={};for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const m=line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);if(!m)continue;
    let value=m[2].trim();
    if(value.startsWith('"')&&value.endsWith('"'))value=JSON.parse(value);
    else if(value.startsWith("'")&&value.endsWith("'"))value=value.slice(1,-1);
    env[m[1]]=value;
  }return env;
}
async function mustDeny(client,sql,values=[]){
  await client.query('SAVEPOINT crm_web_denial');let denied=false;
  try{await client.query({text:sql,values});}catch(error){if(error.code!=='42501')fail('DENIAL_PROBE_FAILED','A denial probe failed for another reason.');denied=true;}
  finally{await client.query('ROLLBACK TO SAVEPOINT crm_web_denial');await client.query('RELEASE SAVEPOINT crm_web_denial');}
  if(!denied)fail('UNEXPECTED_ACCESS','A prohibited CRM read was allowed.');
}
const COUNTS=`SELECT jsonb_build_object(
  'contacts',(SELECT count(*) FROM crm.contacts),'organizations',(SELECT count(*) FROM crm.organizations),
  'research',(SELECT count(*) FROM crm.research),'interactions',(SELECT count(*) FROM crm.interactions),
  'action_events',(SELECT count(*) FROM crm.action_events),'receipts',(SELECT count(*) FROM crm.receipts),
  'fixture_contacts',(SELECT count(*) FROM crm.contacts WHERE id LIKE 'TEST-CRM-%'),
  'fixture_receipts',(SELECT count(*) FROM crm.receipts WHERE idempotency_key LIKE 'test-crm-%'),
  'memberships',(SELECT count(*) FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.member OR r.oid=m.roleid WHERE r.rolname IN ('crm_web','crm_agent')),
  'web_migration_records',(SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20261030030000')) AS counts`;
export async function verifyLive({root=ROOT,Client}={}){
  const adminEnv=readEnv(path.join(root,'.env'));
  if(adminEnv.NEXT_PUBLIC_SUPABASE_URL!==`https://${REF}.supabase.co`||!adminEnv.SUPABASE_DB_PASSWORD)fail('WRONG_TARGET','Expected the approved target configuration.');
  const ca=fs.readFileSync(path.join(root,'supabase/certs/prod-ca-2021.crt'),'utf8');
  const webOptions=webConnectionConfig(readEnv(path.join(root,'.env.crm-web.local'),true));
  const agentOptions=connectionConfig(readEnv(path.join(root,'.env.crm.local'),true));
  if(!Client)({Client}=(await import('pg')).default);
  const web=new Client(webOptions),agent=new Client(agentOptions),admin=new Client({
    host:'aws-0-us-west-1.pooler.supabase.com',port:5432,database:'postgres',user:`postgres.${REF}`,password:adminEnv.SUPABASE_DB_PASSWORD,
    ssl:{ca,rejectUnauthorized:true},connectionTimeoutMillis:30000,query_timeout:30000,application_name:'arcane-crm-web-live-read-verification'});
  const connected=[];
  try{
    await admin.connect();connected.push(admin);const before=(await admin.query(COUNTS)).rows[0].counts;
    if(before.web_migration_records!==1||before.memberships||before.fixture_contacts||before.fixture_receipts)fail('ACTIVATION_STATE_INVALID','Expected applied migration and clean role/fixture state.');
    await web.connect();connected.push(web);await web.query('BEGIN READ ONLY');
    const identity=(await web.query("SELECT current_user AS role,session_user AS session_role,current_setting('transaction_read_only') AS read_only")).rows[0];
    if(identity.role!=='crm_web'||identity.session_role!=='crm_web'||identity.read_only!=='on')fail('WEB_IDENTITY_INVALID','Actual reader login/read-only transaction was not verified.');
    const role=(await web.query("SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolinherit FROM pg_catalog.pg_roles WHERE rolname=current_user")).rows[0];
    if(role?.rolcanlogin!==true||Object.entries(role).some(([key,value])=>key!=='rolcanlogin'&&value!==false))fail('WEB_ROLE_INVALID','Reader role attributes exceed scope.');
    const acl=(await web.query(`SELECT
      EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='crm' AND c.relkind IN ('r','p','v','m','f') AND (has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) AS direct_tables,
      EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='crm' AND p.proname<>'web_read' AND has_function_privilege(current_user,p.oid,'EXECUTE')) AS other_crm_functions`)).rows[0];
    if(acl.direct_tables||acl.other_crm_functions)fail('WEB_GRANTS_INVALID','Reader direct table/helper privileges exceed scope.');
    const read=async(operation,args={})=>(await web.query({text:CRM_WEB_SQL,values:[operation,JSON.stringify(args)]})).rows[0].result;
    const today=await read('today',{limit:25}),relationships=await read('relationships',{limit:100});
    if(!today?.summary?.metric_definition||!relationships.contacts?.length)fail('WEB_READ_FAILED','Real Today/Relationships read failed.');
    const detail=await read('contact',{contact_id:relationships.contacts[0].contact_id});
    if(!detail?.organization||!Array.isArray(detail.research))fail('WEB_DETAIL_FAILED','Real contact detail read failed.');
    await mustDeny(web,'SELECT 1 FROM crm.contacts LIMIT 1');
    await mustDeny(web,"SELECT crm.command('summary','{}','denial-probe')");
    await mustDeny(web,"SELECT crm.timestamp_arg('2026-10-28T00:00:00Z','denial-probe')");
    await web.query('ROLLBACK');
    const visitors=[];
    for(const role of ['anon','authenticated']){
      await admin.query('BEGIN READ ONLY');await admin.query(`SET LOCAL ROLE ${role}`);
      await mustDeny(admin,CRM_WEB_SQL,['today','{}']);await mustDeny(admin,'SELECT 1 FROM crm.contacts LIMIT 1');
      await admin.query('ROLLBACK');visitors.push({role,web_read_denied:true,direct_table_denied:true});
    }
    await agent.connect();connected.push(agent);await agent.query('BEGIN READ ONLY');
    const agentIdentity=(await agent.query('SELECT current_user AS role')).rows[0].role;
    if(agentIdentity!=='crm_agent')fail('AGENT_IDENTITY_INVALID','Agent credential role changed.');
    const agentSummary=(await agent.query({text:CRM_SQL,values:['summary','{}','verification:post-web-activation']})).rows[0].result;
    if(agentSummary.contacts!==today.summary.contacts)fail('AGENT_READ_FAILED','Existing CRM command did not match reader summary.');
    await mustDeny(agent,CRM_WEB_SQL,['today','{}']);await mustDeny(agent,'SELECT 1 FROM crm.contacts LIMIT 1');await agent.query('ROLLBACK');
    const after=(await admin.query(COUNTS)).rows[0].counts;
    if(JSON.stringify(before)!==JSON.stringify(after))fail('STATE_CHANGED','Operational row/grant counts changed during read-only verification.');
    const migrationName='20261030030000_private_crm_web_reader.sql';
    const report={status:'verified',verified_at:new Date().toISOString(),project_ref:REF,
      migration:{name:migrationName,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'supabase/migrations',migrationName))).digest('hex'),hosted_history_records:after.web_migration_records},
      web_login:{role:'crm_web',actual_login:true,tls_ca_verified:true,transaction_read_only:true,scope_memberships:after.memberships,
        direct_tables_denied:true,agent_command_denied:true,internal_helper_denied:true,only_web_read_function:true},
      real_reads:{summary:today.summary,relationships_total:relationships.total,unscheduled_actions:today.unscheduled_actions_total,research_batches:today.research_batches,
        contact_detail:{organization_contacts:detail.organization_contacts.length,research:detail.research.length,interactions:detail.interactions.length,actions:detail.actions.length}},
      visitor_access:visitors,agent_login:{actual_login:true,command_summary:true,web_read_denied:true,direct_tables_denied:true},
      cleanup:{all_crm_counts_unchanged:true,fixture_contacts:after.fixture_contacts,fixture_receipts:after.fixture_receipts,scope_memberships:after.memberships,committed_verification_writes:false},
      website_auth:'not verified by this database-only check; explicit allowed website identity is verified separately'};
    fs.writeFileSync(path.join(root,'.crm/web-live-verification.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
    return {status:'verified',report_file:'.crm/web-live-verification.json',contacts:today.summary.contacts,contacted_unique:today.summary.contacted_unique,human_replied_unique:today.summary.human_replied_unique,inbox_unknown:today.summary.inbox_unknown,scope_memberships:after.memberships};
  }finally{for(const client of connected){try{await client.query('ROLLBACK');}catch{}}for(const client of [web,agent,admin]){try{await client.end();}catch{}}}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==3||process.argv[2]!=='--verify'){process.stderr.write('Usage: node scripts/crm-web-verify-live.mjs --verify\n');process.exitCode=2;}
  else verifyLive().then(result=>process.stdout.write(JSON.stringify(result)+'\n')).catch(error=>{
    const code=error instanceof VerificationError?error.code:typeof error.code==='string'&&/^[A-Z0-9_]{2,64}$/.test(error.code)?error.code:'LIVE_VERIFICATION_FAILED';
    process.stderr.write(JSON.stringify({status:'failed',code,message:error instanceof VerificationError?error.message:'Read-only live verification failed; no raw driver details were logged.'})+'\n');process.exitCode=1;
  });
}
