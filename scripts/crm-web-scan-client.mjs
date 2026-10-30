#!/usr/bin/env node
// Inspect built browser assets without printing any private values.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
export function privateMarkers(root = ROOT) {
  const markers = new Set(['CRM_WEB_DATABASE_URL', 'SUPABASE_DB_PASSWORD', 'SELECT crm.web_read(',
    'crm_web.nydmouxljprsfymcvqko', 'crm_agent.nydmouxljprsfymcvqko']);
  const keys = /^(SUPABASE_DB_PASSWORD|SUPABASE_SERVICE_ROLE_KEY|ADMIN_API_TOKEN|CRM_DATABASE_URL|CRM_WEB_DATABASE_URL|CRM_ALLOWED_USER_ID|CRM_ALLOWED_USER_EMAIL|STRIPE_SECRET_KEY|BLOB_READ_WRITE_TOKEN)$/;
  for (const [key, value] of Object.entries(process.env)) {
    if (keys.test(key) && typeof value === 'string' && value.length >= 8) markers.add(value);
  }
  for (const name of ['.env', '.env.local', '.env.crm.local', '.env.crm-web.local']) {
    let body;
    try { body = fs.readFileSync(path.join(root, name), 'utf8'); } catch { continue; }
    for (const line of body.split(/\r?\n/)) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match || !keys.test(match[1])) continue;
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        try { value = JSON.parse(value); } catch { continue; }
      } else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (value.length >= 8) markers.add(value);
      if (match[1].endsWith('DATABASE_URL')) {
        try { const password = decodeURIComponent(new URL(value).password); if (password.length >= 8) markers.add(password); } catch { /* no raw parser errors */ }
      }
    }
  }
  try {
    const imported = JSON.parse(fs.readFileSync(path.join(root, '.crm/import.json'), 'utf8'));
    for (const record of imported.records || []) {
      if (typeof record.contact_id === 'string' && record.contact_id.length >= 8) markers.add(record.contact_id);
      if (typeof record.address === 'string' && record.channel === 'email' && record.address.length >= 8) markers.add(record.address);
    }
  } catch { /* a local private import is optional */ }
  return [...markers];
}

export function containsPrivateMarker(body, markers = privateMarkers()) {
  return markers.some(value => body.includes(value) || body.includes(JSON.stringify(value).slice(1, -1)));
}

export function scanClient(root = ROOT) {
  const directory = path.join(root, '.next/static');
  if (!fs.existsSync(directory)) throw Error('Build browser assets before scanning.');
  const markers = privateMarkers(root);
  let scanned = 0;
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) {
        scanned += 1;
        if (containsPrivateMarker(fs.readFileSync(file, 'utf8'), markers)) throw Error('Private marker detected in browser output; no private value was printed.');
      }
    }
  };
  visit(directory);
  return { status: 'passed', browser_files_scanned: scanned, private_marker_count: markers.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(scanClient())); }
  catch { console.error(JSON.stringify({ status: 'failed', message: 'Client output scan failed; inspect locally without logging private values.' })); process.exitCode = 1; }
}
