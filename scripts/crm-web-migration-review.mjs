import crypto from 'node:crypto';

const REF = 'nydmouxljprsfymcvqko';
const CRM = '20261030020000_private_crm.sql';
const WEB = '20261030030000_private_crm_web_reader.sql';
const fail = message => { throw new Error(message); };

export function reviewWebMigration(manifest, readMigration) {
  if (manifest?.project_ref !== REF || manifest?.crm_review?.migration !== CRM || manifest?.crm_web_review?.migration !== WEB) {
    fail('Web apply stopped: reviewed target and migration identities must match.');
  }
  const entries = [...Object.entries(manifest.legacy_migration_sha256 || {}),
    [manifest.crm_review.migration, manifest.crm_review.sha256],
    [manifest.crm_web_review.migration, manifest.crm_web_review.sha256]];
  if (Object.keys(manifest.legacy_migration_sha256 || {}).length !== 4) fail('Web apply stopped: four historical migration checksums are required.');
  for (const [name, expected] of entries) {
    if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(name) || !/^[a-f0-9]{64}$/.test(expected || '')) fail('Web apply stopped: invalid migration review metadata.');
    const actual = crypto.createHash('sha256').update(readMigration(name)).digest('hex');
    if (actual !== expected) fail(`Web apply stopped: reviewed migration checksum changed: ${name}`);
  }
  return WEB;
}

export function requireOnlyReviewedWebPending(preview, allowed) {
  const pending = [...preview.matchAll(/(?:\u2022|\*)\s+(\d{14}_[^\s]+\.sql)/g)].map(match => match[1]);
  if (allowed !== WEB || pending.length !== 1 || pending[0] !== WEB) {
    fail('Web apply stopped: expected exactly the reviewed web migration in the dry run. Inspect history before applying.');
  }
  return true;
}
