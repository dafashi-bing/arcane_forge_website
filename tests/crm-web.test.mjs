import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCrmAccess, CrmAccessError } from '../lib/crm/policy.mjs';
import { webConnectionConfig, validateWebRead, executeWebRead, CRM_WEB_SQL, CrmReadError } from '../lib/crm/reader.mjs';

const id = '83470b31-9624-4d49-8b9e-78c430f63001';
const env = { CRM_ALLOWED_USER_ID:id, CRM_ALLOWED_USER_EMAIL:'owner@example.invalid' };
const user = { id,email:'owner@example.invalid',aud:'authenticated',role:'authenticated',email_confirmed_at:'2026-01-01T00:00:00Z',is_anonymous:false };
const db = { CRM_WEB_DATABASE_URL:'postgresql://crm_web.nydmouxljprsfymcvqko:SYNTHETIC@aws-0-us-west-1.pooler.supabase.com:5432/postgres',CRM_WEB_DATABASE_CA:'-----BEGIN CERTIFICATE-----\nSYNTHETIC\n-----END CERTIFICATE-----' };

test('CRM authorization fails closed for missing, malformed, or plural allowed identities', () => {
  for (const configured of [{},{...env,CRM_ALLOWED_USER_ID:''},{...env,CRM_ALLOWED_USER_EMAIL:'owner@example.invalid,second@example.invalid'},
    {...env,CRM_ALLOWED_USER_ID:`${id},${id}`},{...env,CRM_ALLOWED_USER_EMAIL:' owner@example.invalid'}]) {
    assert.equal(evaluateCrmAccess(user,null,configured).status,'unconfigured');
  }
});
test('anonymous, invalid and expired verified-session lookups cannot authorize', () => {
  assert.equal(evaluateCrmAccess(null,null,env).status,'unauthenticated');
  assert.equal(evaluateCrmAccess(user,{code:'invalid_token'},env).status,'unauthenticated');
  assert.equal(evaluateCrmAccess(user,{code:'session_expired'},env).status,'unauthenticated');
});
test('customer sign-in, unverified or anonymous users and metadata spoofing cannot authorize', () => {
  for (const candidate of [{...user,id:'83470b31-9624-4d49-8b9e-78c430f63002'}, {...user,email:'other@example.invalid'},
    {...user,email_confirmed_at:null},{...user,is_anonymous:true},{...user,role:'service_role'}, {...user,aud:'other'},
    {...user,email_confirmed_at:'not-a-date'}, {...user,email_confirmed_at:'9999-01-01T00:00:00Z'},
    {...user,id:'customer',user_metadata:{internal:true,allowed:true,email:env.CRM_ALLOWED_USER_EMAIL}}]) {
    assert.equal(evaluateCrmAccess(candidate,null,env).status,'forbidden');
  }
});
test('only the exact verified identity and email pair authorizes', () => {
  assert.deepEqual(evaluateCrmAccess(user,null,env),{status:'allowed',user:{id,email:user.email}});
  assert.equal(evaluateCrmAccess({...user,email:'OWNER@example.invalid'},null,env).status,'allowed');
  for (const [status,code] of [['unauthenticated',401],['forbidden',403],['unconfigured',503]]) {
    assert.equal(new CrmAccessError(status).statusCode,code);
  }
});
test('web reader refuses agent/maintainer credentials and unapproved hosts or SSL query overrides', () => {
  for (const url of [db.CRM_WEB_DATABASE_URL.replace('crm_web.','crm_agent.'),db.CRM_WEB_DATABASE_URL.replace('crm_web.','postgres.'),
    db.CRM_WEB_DATABASE_URL.replace('nydmouxljprsfymcvqko','wdoiouwzfutdtmdsdgkr'),db.CRM_WEB_DATABASE_URL.replace('5432','6543'),
    db.CRM_WEB_DATABASE_URL.replace('aws-0-us-west-1.pooler.supabase.com','example.invalid'),`${db.CRM_WEB_DATABASE_URL}?sslmode=disable`,
    `${db.CRM_WEB_DATABASE_URL}?options=unsafe`,`${db.CRM_WEB_DATABASE_URL}#fragment`]) {
    assert.throws(()=>webConnectionConfig({...db,CRM_WEB_DATABASE_URL:url}),CrmReadError);
  }
  const config = webConnectionConfig(db);
  assert.equal(config.ssl.rejectUnauthorized,true);
  assert.equal(config.options,'-c default_transaction_read_only=on');
  assert.throws(()=>webConnectionConfig({...db,CRM_WEB_DATABASE_CA:''},()=>{throw Error('missing');}),/temporarily unavailable/);
});
test('the web read boundary rejects mutations, unsupported fields and unbounded queries', () => {
  for (const [operation,args] of [['interaction',{}],['import',{}],['relationships',{stage:'x'.repeat(101)}],
    ['relationships',{query:'\0'}],['relationships',{limit:101}],['today',{offset:-1}],['today',{offset:1000001}],
    ['contact',{}],['contact',{contact_id:''}],['contact',{contact_id:'valid',actor:'caller'}],
    ['relationships',{response_state:'no_reply'}],['relationships',{relationship_type:'admin'}],['today',{query:'unexpected'}]]) {
    assert.throws(()=>validateWebRead(operation,args),error=>error.statusCode===400);
  }
});
test('read requests keep hostile query strings parameterized and use a read-only transaction', async () => {
  const queries=[]; let ended=false;
  class Client {
    async connect() {} async end() { ended=true; }
    async query(query) { queries.push(query); return typeof query==='object'?{rows:[{result:{total:0,contacts:[]}}]}:{rows:[]}; }
  }
  const args={query:"'; SELECT crm.command('import','{}','attacker'); --",stage:'proposed',limit:25};
  const result=await executeWebRead({operation:'relationships',args,env:db,Client});
  assert.equal(result.total,0); assert.equal(ended,true);
  assert.equal(queries[0],'BEGIN READ ONLY'); assert.equal(queries[2],'COMMIT');
  assert.deepEqual(queries[1],{text:CRM_WEB_SQL,values:['relationships',JSON.stringify(args)]});
});
test('driver failures never expose database credentials, contact data or raw errors', async () => {
  let ended=false;
  class Client { async connect() { throw Error('SYNTHETIC password raw private contact'); } async end() {ended=true;} }
  await assert.rejects(()=>executeWebRead({operation:'today',env:db,Client}),error=>{
    assert.equal(error.message,'CRM data is temporarily unavailable.');
    assert.ok(!JSON.stringify(error).includes('SYNTHETIC')); return true;
  });
  assert.equal(ended,true);
});
