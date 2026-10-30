import { readFileSync } from 'node:fs';

export const TARGET_PROJECT = 'nydmouxljprsfymcvqko';
export const CRM_SQL = 'SELECT crm.command($1::text, $2::jsonb, $3::text) AS result';
export const OPERATIONS = Object.freeze(['import', 'search', 'history', 'interaction', 'action', 'relationship', 'due', 'summary']);
const WRITE_OPERATIONS = new Set(['import', 'interaction', 'action', 'relationship']);
const CHANNELS = new Set(['email', 'contact_form', 'linkedin', 'phone', 'other']);
const EVENT_TYPES = new Set(['sent', 'human_reply', 'auto_reply', 'bounce', 'meeting', 'note', 'inbox_checked']);
const RELATIONSHIP_TYPES = new Set(['pilot_prospect', 'customer', 'publisher', 'partner', 'investor', 'other']);
const RESPONSE_STATES = new Set(['not_contacted', 'unknown', 'verified_no_reply', 'human_reply']);
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export class CrmError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CrmError';
    this.code = code;
  }
}

function invalid(message) {
  throw new CrmError('INVALID_INPUT', message);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${label} must be an object`);
}

function text(value, label, { optional = false, max = 10000 } = {}) {
  if (optional && (value === undefined || value === null)) return;
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\u0000')) {
    invalid(`${label} must be a nonempty string (at most ${max} characters)`);
  }
}

function timestamp(value, label, optional = false) {
  if (optional && (value === undefined || value === null)) return;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    invalid(`${label} must be an ISO 8601 timestamp with time zone`);
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > maxDay || Number(value.slice(11, 13)) > 23) invalid(`${label} has an invalid calendar date or time`);
}

function choice(value, values, label) {
  if (!values.has(value)) invalid(`${label} has an unsupported value`);
}

function keys(value, allowed, label) {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid(`${label} has an unsupported field`);
}

function limit(value) {
  if (value !== undefined && (!Number.isInteger(value) || value < 1 || value > 100)) invalid('limit must be an integer from 1 to 100');
}

function offset(value) {
  if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > 2147483647)) invalid('offset must be an integer from 0 to 2147483647');
}

function interaction(args) {
  object(args, 'interaction');
  keys(args, ['idempotency_key', 'contact_id', 'type', 'occurred_at', 'channel', 'sending_account', 'confirmation', 'evidence', 'summary', 'outcome', 'follow_up_due_at', 'is_follow_up', 'inbox_state', 'checked_through'], 'interaction');
  text(args.idempotency_key, 'idempotency_key', { max: 200 });
  text(args.contact_id, 'contact_id', { max: 150 });
  choice(args.type, EVENT_TYPES, 'type');
  timestamp(args.occurred_at, 'occurred_at');
  choice(args.channel, CHANNELS, 'channel');
  choice(args.confirmation, new Set(['user_confirmed', 'observed']), 'confirmation');
  text(args.evidence, 'evidence');
  text(args.summary, 'summary');
  text(args.outcome, 'outcome', { optional: true });
  text(args.sending_account, 'sending_account', { optional: !['sent', 'inbox_checked'].includes(args.type), max: 1000 });
  timestamp(args.follow_up_due_at, 'follow_up_due_at', true);
  if (args.follow_up_due_at !== undefined && args.follow_up_due_at !== null) {
    if (args.type !== 'sent') invalid('follow_up_due_at only belongs to sent events');
    if (Date.parse(args.follow_up_due_at) < Date.parse(args.occurred_at)) invalid('follow_up_due_at cannot precede occurred_at');
  }
  if (args.is_follow_up !== undefined && typeof args.is_follow_up !== 'boolean') invalid('is_follow_up must be boolean');
  if (args.is_follow_up && args.type !== 'sent') invalid('Only a sent event can be a follow-up');
  if (args.type === 'inbox_checked') {
    choice(args.inbox_state, new Set(['no_reply', 'unknown']), 'inbox_state');
    timestamp(args.checked_through, 'checked_through');
    if (Date.parse(args.checked_through) > Date.parse(args.occurred_at)) invalid('checked_through cannot be later than occurred_at');
  } else if (args.inbox_state !== undefined || args.checked_through !== undefined) {
    invalid('Inbox state belongs only to an inbox_checked event');
  }
  if (Date.parse(args.occurred_at) > Date.now() + 60000) invalid('An actual interaction cannot have a future occurred_at');
}

export function validateRequest(operation, args, actor) {
  if (!OPERATIONS.includes(operation)) invalid('Unknown CRM operation');
  object(args, 'args');
  text(actor, 'CRM_ACTOR / --actor', { max: 150 });
  if (Buffer.byteLength(JSON.stringify(args), 'utf8') > MAX_INPUT_BYTES) invalid('Input exceeds 10 MiB');
  if (WRITE_OPERATIONS.has(operation)) text(args.idempotency_key, 'idempotency_key', { max: 200 });
  if (operation === 'search') {
    keys(args, ['query', 'limit', 'offset', 'contacted', 'response_state', 'relationship_type'], 'search');
    if (args.query !== undefined && (typeof args.query !== 'string' || args.query.length > 500 || args.query.includes('\u0000'))) invalid('query must be a string of at most 500 characters');
    limit(args.limit);
    offset(args.offset);
    if (args.contacted !== undefined && typeof args.contacted !== 'boolean') invalid('contacted must be boolean');
    if (args.response_state !== undefined) choice(args.response_state, RESPONSE_STATES, 'response_state');
    if (args.relationship_type !== undefined) choice(args.relationship_type, RELATIONSHIP_TYPES, 'relationship_type');
  } else if (operation === 'history') {
    keys(args, ['contact_id'], 'history');
    text(args.contact_id, 'contact_id', { max: 150 });
  } else if (operation === 'interaction') {
    interaction(args);
  } else if (operation === 'action') {
    keys(args, ['idempotency_key', 'contact_id', 'action_id', 'description', 'status', 'due_at', 'owner'], 'action');
    text(args.contact_id, 'contact_id', { max: 150 });
    if (args.action_id !== undefined && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(args.action_id)) invalid('action_id must be a UUID');
    text(args.description, 'description', { max: 2000 });
    text(args.owner, 'owner', { max: 150 });
    choice(args.status, new Set(['open', 'done', 'cancelled']), 'status');
    if (args.action_id === undefined && args.status !== 'open') invalid('A new action must have status open');
    timestamp(args.due_at, 'due_at', true);
  } else if (operation === 'relationship') {
    keys(args, ['idempotency_key', 'contact_id', 'relationship_type', 'stage', 'context', 'owner', 'outcome'], 'relationship');
    text(args.contact_id, 'contact_id', { max: 150 });
    choice(args.relationship_type, RELATIONSHIP_TYPES, 'relationship_type');
    text(args.stage, 'stage', { max: 100 });
    text(args.owner, 'owner', { optional: true, max: 150 });
    text(args.outcome, 'outcome', { optional: true });
    if (args.context !== undefined) object(args.context, 'context');
  } else if (operation === 'due') {
    keys(args, ['as_of', 'limit', 'offset'], 'due');
    timestamp(args.as_of, 'as_of', true);
    limit(args.limit);
    offset(args.offset);
  } else if (operation === 'summary') {
    if ('since' in args || 'until' in args) invalid('summary currently supports lifetime metrics only; omit since/until');
    keys(args, [], 'summary');
  } else if (operation === 'import') {
    keys(args, ['idempotency_key', 'source_key', 'captured_at', 'source_sha256', 'records', 'interactions'], 'import');
    text(args.source_key, 'source_key', { max: 1000 });
    timestamp(args.captured_at, 'captured_at');
    if (typeof args.source_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(args.source_sha256)) invalid('source_sha256 must be a lowercase SHA-256 hex digest');
    if (!Array.isArray(args.records) || args.records.length < 1 || args.records.length > 500) invalid('records must be an array with 1 to 500 contacts');
    const contactIds = new Set();
    for (const record of args.records) {
      object(record, 'record');
      keys(record, ['contact_id', 'organization_name', 'organization_website', 'person_name', 'person_role', 'channel', 'address', 'relationship_types', 'stage', 'owner', 'context', 'source_record', 'research', 'next_action'], 'record');
      text(record.contact_id, 'record.contact_id', { max: 150 });
      if (contactIds.has(record.contact_id)) invalid('Import contains duplicate contact_id values');
      contactIds.add(record.contact_id);
      text(record.organization_name, 'record.organization_name', { max: 300 });
      text(record.person_name, 'record.person_name', { optional: true, max: 300 });
      for (const key of ['organization_website', 'person_role']) text(record[key], `record.${key}`, { optional: true, max: 2000 });
      choice(record.channel, CHANNELS, 'record.channel');
      text(record.address, 'record.address', { max: 2000 });
      if (!Array.isArray(record.relationship_types) || record.relationship_types.length < 1 || record.relationship_types.length > 10) invalid('record.relationship_types must have 1 to 10 roles');
      for (const role of record.relationship_types) choice(role, RELATIONSHIP_TYPES, 'record relationship type');
      if (new Set(record.relationship_types).size !== record.relationship_types.length) invalid('record.relationship_types must not contain duplicates');
      text(record.stage, 'record.stage', { max: 100 });
      text(record.owner, 'record.owner', { max: 150 });
      object(record.context, 'record.context');
      object(record.source_record, 'record.source_record');
      if (!Array.isArray(record.research) || record.research.length > 100) invalid('record.research must be an array with at most 100 entries');
      for (const item of record.research) {
        object(item, 'research item');
        keys(item, ['source_key', 'source_url', 'observed_at', 'kind', 'content'], 'research item');
        text(item.source_key, 'research.source_key', { max: 1000 });
        text(item.source_url, 'research.source_url', { optional: true, max: 2000 });
        timestamp(item.observed_at, 'research.observed_at', true);
        text(item.kind, 'research.kind', { max: 100 });
        object(item.content, 'research.content');
      }
      if (record.next_action !== undefined && record.next_action !== null) {
        object(record.next_action, 'next_action');
        keys(record.next_action, ['description', 'due_at', 'owner'], 'next_action');
        text(record.next_action.description, 'next_action.description', { max: 2000 });
        timestamp(record.next_action.due_at, 'next_action.due_at', true);
        text(record.next_action.owner, 'next_action.owner', { max: 150 });
      }
    }
    if (args.interactions !== undefined) {
      if (!Array.isArray(args.interactions) || args.interactions.length > 5000) invalid('interactions must be an array with at most 5000 events');
      for (const event of args.interactions) interaction(event);
    }
  }
  return { operation, args, actor };
}

export function connectionConfig(env = process.env, read = readFileSync) {
  let url;
  try {
    if (!env.CRM_DATABASE_URL) throw new Error();
    url = new URL(env.CRM_DATABASE_URL);
  } catch {
    throw new CrmError('CRM_NOT_CONFIGURED', 'Set CRM_DATABASE_URL in private .env.crm.local');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      url.hostname !== 'aws-0-us-west-1.pooler.supabase.com' ||
      (url.port && url.port !== '5432') || url.pathname !== '/postgres' ||
      decodeURIComponent(url.username) !== `crm_agent.${TARGET_PROJECT}` ||
      !url.password || url.hash ||
      [...url.searchParams].some(([key, value]) => key !== 'sslmode' || !['require', 'verify-ca', 'verify-full'].includes(value))) {
    throw new CrmError('UNSAFE_DATABASE_TARGET', 'CRM requires the dedicated crm_agent login on the approved target project/session pooler');
  }
  let ca;
  if (env.CRM_DATABASE_CA_FILE) {
    try {
      ca = read(env.CRM_DATABASE_CA_FILE, 'utf8');
    } catch {
      throw new CrmError('CRM_CA_UNAVAILABLE', 'Cannot read CRM_DATABASE_CA_FILE');
    }
  }
  return {
    host: url.hostname,
    port: 5432,
    database: 'postgres',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    connectionTimeoutMillis: 15000,
    statement_timeout: 30000,
    application_name: 'arcane-forge-crm-cli',
  };
}

export function safeError(error) {
  if (error instanceof CrmError) return { error: { code: error.code, message: error.message } };
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{2,40}$/.test(error.code) ? error.code : 'CRM_REQUEST_FAILED';
  const messages = {
    '42501': 'CRM role is not authorized for this operation',
    '28P01': 'CRM login failed; check the private CRM credential',
    '23505': 'Duplicate identity or conflicting idempotency key; review the existing record',
    '22023': 'Database rejected the CRM input; check operation fields and existing record IDs',
    'P0001': 'Database rejected the CRM operation; review input and existing record state',
    'ECONNREFUSED': 'CRM database connection refused',
    'ENOTFOUND': 'CRM database hostname could not be resolved',
    'ETIMEDOUT': 'CRM database connection timed out',
    'SELF_SIGNED_CERT_IN_CHAIN': 'Set CRM_DATABASE_CA_FILE to the trusted Supabase CA certificate',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE': 'Set CRM_DATABASE_CA_FILE to the trusted Supabase CA certificate',
  };
  return { error: { code, message: messages[code] || 'CRM request failed; inspect configuration and database readiness without logging credentials' } };
}

export async function executeRequest({ operation, args, actor, env = process.env, Client }) {
  validateRequest(operation, args, actor);
  const config = connectionConfig(env);
  const client = new Client(config);
  try {
    await client.connect();
    const response = await client.query({ text: CRM_SQL, values: [operation, JSON.stringify(args), actor] });
    if (!response?.rows?.length || response.rows[0].result === undefined) throw new CrmError('INVALID_DATABASE_RESPONSE', 'CRM command returned no structured result');
    return response.rows[0].result;
  } finally {
    await client.end().catch(() => {});
  }
}
