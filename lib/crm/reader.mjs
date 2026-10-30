import { readFileSync } from 'node:fs';
import path from 'node:path';

const REF = 'nydmouxljprsfymcvqko';
export const CRM_WEB_SQL = 'SELECT crm.web_read($1::text, $2::jsonb) AS result';
const ROLES = ['pilot_prospect','customer','publisher','partner','investor','other'];
const STATES = ['not_contacted','unknown','verified_no_reply','human_reply'];
export class CrmReadError extends Error {
  constructor(code = 'CRM_UNAVAILABLE', statusCode = 503) {
    super(code === 'INVALID_INPUT' ? 'The CRM query is invalid.' : 'CRM data is temporarily unavailable.');
    this.name = 'CrmReadError'; this.code = code; this.statusCode = statusCode;
  }
}
const invalid = () => { throw new CrmReadError('INVALID_INPUT', 400); };
export function validateWebRead(operation, args) {
  if (!['today','relationships','contact'].includes(operation) || !args || typeof args !== 'object' || Array.isArray(args)) invalid();
  const allowed = operation === 'today' ? ['limit','offset'] : operation === 'contact' ? ['contact_id'] : ['query','relationship_type','stage','response_state','limit','offset'];
  if (Object.keys(args).some(key => !allowed.includes(key))) invalid();
  if (args.limit !== undefined && (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100)) invalid();
  if (args.offset !== undefined && (!Number.isInteger(args.offset) || args.offset < 0 || args.offset > 1000000)) invalid();
  for (const [key, max] of [['query',500],['stage',100],['contact_id',150]]) {
    if (args[key] !== undefined && (typeof args[key] !== 'string' || args[key].length > max || args[key].includes('\0'))) invalid();
  }
  if (operation === 'contact' && (typeof args.contact_id !== 'string' || !args.contact_id.trim())) invalid();
  if (args.relationship_type !== undefined && !ROLES.includes(args.relationship_type)) invalid();
  if (args.response_state !== undefined && !STATES.includes(args.response_state)) invalid();
  return { operation, args };
}

export function webConnectionConfig(env = process.env, read = readFileSync) {
  let url;
  try { url = new URL(env.CRM_WEB_DATABASE_URL); } catch { throw new CrmReadError('CRM_NOT_CONFIGURED'); }
  if (!['postgres:','postgresql:'].includes(url.protocol) || url.hostname !== 'aws-0-us-west-1.pooler.supabase.com' ||
      (url.port && url.port !== '5432') || url.pathname !== '/postgres' ||
      decodeURIComponent(url.username) !== `crm_web.${REF}` || !url.password || url.hash ||
      [...url.searchParams].some(([key,value]) => key !== 'sslmode' || !['require','verify-ca','verify-full'].includes(value))) {
    throw new CrmReadError('UNSAFE_DATABASE_TARGET');
  }
  let ca = env.CRM_WEB_DATABASE_CA;
  if (!ca) {
    try { ca = read(env.CRM_WEB_DATABASE_CA_FILE || path.join(process.cwd(),'supabase/certs/prod-ca-2021.crt'),'utf8'); }
    catch { throw new CrmReadError('CRM_CA_UNAVAILABLE'); }
  }
  if (typeof ca !== 'string' || !ca.includes('-----BEGIN CERTIFICATE-----')) throw new CrmReadError('CRM_CA_UNAVAILABLE');
  return { host:url.hostname,port:5432,database:'postgres',user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),
    ssl:{ca,rejectUnauthorized:true},connectionTimeoutMillis:10000,statement_timeout:15000,query_timeout:20000,
    application_name:'arcane-forge-crm-web',options:'-c default_transaction_read_only=on' };
}

// Called only after authorization by data.ts. This module is never a route.
export async function executeWebRead({operation,args={},env=process.env,Client}) {
  validateWebRead(operation,args);
  const config = webConnectionConfig(env);
  const client = new Client(config);
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const result = await client.query({text:CRM_WEB_SQL,values:[operation,JSON.stringify(args)]});
    if (!result?.rows?.length || result.rows[0].result === undefined) throw new CrmReadError('INVALID_DATABASE_RESPONSE');
    await client.query('COMMIT');
    return result.rows[0].result;
  } catch (error) {
    // Driver errors can contain SQL, private data or credentials: never propagate.
    if (error instanceof CrmReadError) throw error;
    throw new CrmReadError();
  } finally {
    await client.end().catch(() => {});
  }
}
