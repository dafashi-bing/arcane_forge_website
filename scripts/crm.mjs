#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { CrmError, OPERATIONS, executeRequest, safeError } from './crm-client.mjs';

export const HELP = `Arcane Forge private CRM (structured JSON; never sends outreach)

Usage: npm run crm -- <operation> [JSON | --file PATH | --stdin] [--actor ACTOR]

Operations: ${OPERATIONS.join(', ')}
Examples:
  npm run crm -- summary
  npm run crm -- search '{"query":"Elsewhere"}'
  npm run crm -- search '{"contacted":true,"limit":100,"offset":0}'
  npm run crm -- search '{"relationship_type":"publisher","response_state":"unknown"}'
  npm run crm -- history '{"contact_id":"AF-20261029-01"}'
  npm run crm -- due
  npm run crm -- due '{"limit":100,"offset":0}'
  npm run crm -- interaction --file /private/tmp/confirmed-interaction.json
  npm run crm -- import --file /private/tmp/reconciled-import.json

Credentials: .env.crm.local (gitignored), CRM_DATABASE_URL, CRM_ACTOR,
optional CRM_DATABASE_CA_FILE. Only dedicated crm_agent on the approved project.
Write operations require idempotency_key; reuse the same key only for exact retries.
Interaction logging records observed/user-confirmed activity; it does not send it.
Inbox checks require sending_account and channel; no-reply needs current evidence
for every channel/account used to contact that record. Missing coverage is unknown.
Search/due return total counts and pagination; use returned next offsets for more.
For clean machine JSON without npm banners: node scripts/crm.mjs <operation> ...
`;

export function parseArguments(argv, env = process.env, read = readFileSync) {
  if (!argv.length || ['help', '--help', '-h'].includes(argv[0])) return { help: true };
  const operation = argv[0];
  let actor = env.CRM_ACTOR;
  let input;
  let mode;
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--actor') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new CrmError('INVALID_INPUT', '--actor requires a value');
      actor = argv[++i];
    } else if (arg === '--file' || arg === '--stdin') {
      if (mode) throw new CrmError('INVALID_INPUT', 'Use exactly one JSON input source');
      mode = arg;
      if (arg === '--file' && !argv[i + 1]) throw new CrmError('INVALID_INPUT', '--file requires a path');
      try {
        input = arg === '--stdin' ? read(0, 'utf8') : read(argv[++i], 'utf8');
      } catch {
        throw new CrmError('INVALID_INPUT', 'Cannot read JSON input');
      }
    } else if (arg.startsWith('--')) {
      throw new CrmError('INVALID_INPUT', 'Unsupported CLI option');
    } else {
      if (mode) throw new CrmError('INVALID_INPUT', 'Use exactly one JSON input source');
      mode = 'json';
      input = arg;
    }
  }
  if (input && Buffer.byteLength(input, 'utf8') > 10 * 1024 * 1024) throw new CrmError('INVALID_INPUT', 'Input exceeds 10 MiB');
  let args;
  try {
    args = input === undefined ? {} : JSON.parse(input);
  } catch {
    throw new CrmError('INVALID_INPUT', 'Input must be valid JSON');
  }
  return { operation, args, actor };
}

export async function main(argv = process.argv.slice(2)) {
  const envPath = fileURLToPath(new URL('../.env.crm.local', import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const request = parseArguments(argv);
  if (request.help) {
    process.stdout.write(HELP);
    return;
  }
  const { default: pg } = await import('pg');
  const result = await executeRequest({ ...request, Client: pg.Client });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify(safeError(error))}\n`);
    process.exitCode = 1;
  });
}
