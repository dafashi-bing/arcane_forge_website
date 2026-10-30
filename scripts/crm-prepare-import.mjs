#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const DEFAULT_ARCHIVE = '/Users/binggan/new_start/pitches/studio-outreach';
const EXPECTED_SHEET = '1ys9freJEi9vo6iORqKRKpcCpb8PXS-5O1dNQ0rOUOzw';
const TIMEZONE = 'America/Los_Angeles';
export const sha256 = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const text = v => v == null ? '' : String(v).trim();
const nullable = v => text(v) || null;
const isFilled = row => Array.isArray(row) && row.some(v => text(v) !== '');
const normalize = v => text(v).toLowerCase().replace(/\s+/g, ' ');
const toObject = (headers, row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']));

// Sheets serial times are local wall times in the workbook's Pacific timezone.
// Reject ambiguous/nonexistent DST hours rather than silently select an instant.
export function excelSerialToISO(value) {
  ensure(typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 100000, 'Invalid Sheets date serial');
  const wallMs = Date.UTC(1899, 11, 30) + Math.round(value * 86400000);
  const wall = new Date(wallMs);
  const desired = [wall.getUTCFullYear(), wall.getUTCMonth() + 1, wall.getUTCDate(), wall.getUTCHours(), wall.getUTCMinutes(), wall.getUTCSeconds()];
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  const matches = [-7, -8].map(offset => new Date(wallMs - offset * 3600000)).filter(date => {
    const parts = Object.fromEntries(formatter.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
    return [parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second].every((p, i) => p === desired[i]);
  });
  ensure(matches.length === 1, 'Ambiguous or nonexistent Pacific wall time requires human reconciliation');
  return matches[0].toISOString();
}

function timestamp(value, label) {
  if (typeof value === 'number') return excelSerialToISO(value);
  ensure(typeof value === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)), `${label} requires an unambiguous timestamp with timezone`);
  return new Date(value).toISOString();
}

function enumValue(value) { return normalize(value).replace(/[ /-]+/g, '_'); }
export function channelFor(value, address) {
  const channel = enumValue(value);
  if (channel === 'professional_profile') return /^https:\/\/(?:[\w-]+\.)?linkedin\.com\//i.test(address) ? 'linkedin' : 'other';
  ensure(['email', 'contact_form', 'linkedin', 'phone', 'other'].includes(channel), `Unsupported channel: ${value}`);
  return channel;
}

function uniqueMap(rows, key, label) {
  const map = new Map();
  for (const row of rows) {
    const id = key(row);
    ensure(id && !map.has(id), `Missing or duplicate ${label}: ${id}`);
    map.set(id, row);
  }
  return map;
}

export function loadSources(snapshotPath, archiveDir) {
  const snapshotRaw = readFileSync(snapshotPath, 'utf8');
  const tailPath = join(dirname(snapshotPath), 'sheet-tail-verification.json');
  const tailVerification = existsSync(tailPath) ? JSON.parse(readFileSync(tailPath, 'utf8')) : null;
  const archiveNames = ['crm-workspace.json', 'outreach-ledger.json', ...readdirSync(archiveDir).filter(n => /^\d{4}-\d{2}-\d{2}-(?:candidates|email-drafts)\.json$/.test(n))].sort();
  const archiveRaw = Object.fromEntries(archiveNames.map(name => [name, readFileSync(join(archiveDir, name), 'utf8')]));
  const digestInputs = { snapshot: JSON.parse(snapshotRaw), tail_verification: tailVerification, archives: Object.fromEntries(Object.entries(archiveRaw).map(([name, raw]) => [name, JSON.parse(raw)])) };
  return { snapshot: JSON.parse(snapshotRaw), tailVerification, archives: Object.fromEntries(Object.entries(archiveRaw).map(([name, raw]) => [name, JSON.parse(raw)])), sourceDigest: sha256(digestInputs), fileDigests: { [basename(snapshotPath)]: sha256(snapshotRaw), ...Object.fromEntries(Object.entries(archiveRaw).map(([name, raw]) => [name, sha256(raw)])) }, archiveRaw, snapshotRaw };
}

export function prepareImport(sources) {
  const { snapshot, archives, sourceDigest, fileDigests } = sources;
  ensure(snapshot.spreadsheet_id === EXPECTED_SHEET, 'Unexpected operational Sheet identity');
  const capturedAt = timestamp(snapshot.captured_at, 'captured_at');
  const workspace = archives['crm-workspace.json'];
  const ledger = archives['outreach-ledger.json'];
  ensure(workspace.spreadsheet_id === EXPECTED_SHEET, 'Workspace/Sheet identity mismatch');
  const mapping = uniqueMap(workspace.source_mapping, r => r.contact_id, 'immutable contact ID');
  const keyMapping = uniqueMap(workspace.source_mapping, r => r.contact_key, 'immutable source contact key');
  const ledgerBySource = uniqueMap(ledger.contacts, r => `${r.batch_date}:${r.id}`, 'ledger source ID');
  const candidateBySource = new Map();
  const draftBySource = new Map();
  for (const [name, data] of Object.entries(archives)) {
    if (name.endsWith('-candidates.json')) {
      for (const row of data.candidates) {
        const id = `${data.date}:${row.id}`;
        ensure(!candidateBySource.has(id), `Duplicate candidate ID: ${id}`);
        candidateBySource.set(id, { filename: name, record: row });
      }
    }
    if (name.endsWith('-email-drafts.json')) {
      ensure(data.sending_authorized === false, 'Draft archive changed sending authorization; reconcile before import');
      for (const row of [...data.emails, ...data.contact_forms]) {
        const id = `${data.batch_date}:${row.candidate_id}`;
        ensure(!draftBySource.has(id), `Duplicate draft candidate ID: ${id}`);
        draftBySource.set(id, { filename: name, metadata: { prepared_at: data.prepared_at, mailbox: data.mailbox, mail_provider: data.mail_provider, authorization: data.authorization, sending_authorized: data.sending_authorized, verification: data.verification }, record: row });
      }
    }
  }
  const contactSheet = snapshot.sheets?.Contacts;
  const researchSheet = snapshot.sheets?.Research;
  const activitySheet = snapshot.sheets?.Activity;
  ensure(contactSheet && researchSheet && activitySheet, 'All three operational tabs are required');
  for (const [name, sheet] of Object.entries(snapshot.sheets)) {
    const bound = Number(sheet.range.match(/:(?:[A-Z]+)(\d+)$/)?.[1]);
    ensure(bound && sheet.values.length < bound, `${name} read reaches its boundary; read the next bounded range before importing`);
  }
  const contactHeaderIndex = contactSheet.values.findIndex(r => r[0] === 'Organization' && r.includes('Contact key'));
  ensure(contactHeaderIndex >= 0, 'Contacts header not found');
  const headers = contactSheet.values[contactHeaderIndex];
  const contactRows = contactSheet.values.slice(contactHeaderIndex + 1).map((values, i) => ({ values, sheet_row: contactHeaderIndex + 2 + i })).filter(r => isFilled(r.values));
  const researchHeaders = researchSheet.values[0];
  const researchByKey = uniqueMap(researchSheet.values.slice(1).filter(isFilled).map((r, i) => ({ ...toObject(researchHeaders, r), raw_values: r, sheet_row: i + 2 })), r => r['Contact key'], 'Research contact key');
  const activityHeaders = activitySheet.values[0];
  const activity = activitySheet.values.slice(1).map((r, i) => ({ ...toObject(activityHeaders, r), raw_values: r, sheet_row: i + 2 })).filter(r => isFilled(r.raw_values));
  const unassignedActivity = activity.filter(r => !text(r.Contact));
  ensure(unassignedActivity.every(r => enumValue(r.Event) === 'note'), 'Unassigned factual activity requires identity reconciliation');
  const seenContacts = new Set();
  const seenRoutes = new Set();
  const differences = [];
  const records = contactRows.map(({ values, sheet_row }) => {
    const row = toObject(headers, values);
    const match = text(row['Contact key']).match(/\[(AF-\d{8}-\d{2})\]$/);
    ensure(match && mapping.has(match[1]), `Unmapped contact at Contacts row ${sheet_row}; preserve and reconcile it before import`);
    const contactId = match[1];
    ensure(!seenContacts.has(contactId), `Duplicate contact ID: ${contactId}`);
    seenContacts.add(contactId);
    const identity = mapping.get(contactId);
    const sourceId = `${identity.batch_date}:${identity.source_id}`;
    const ledgerRecord = ledgerBySource.get(sourceId);
    const candidate = candidateBySource.get(sourceId);
    ensure(ledgerRecord && candidate, `Archive source missing for ${contactId}`);
    const research = researchByKey.get(row['Contact key']) ?? researchByKey.get(identity.contact_key);
    ensure(research, `Research missing for ${contactId}`);
    const organizationName = text(row.Organization);
    const address = text(row['Contact / URL']);
    const channel = channelFor(row.Channel, address);
    ensure(organizationName && address && text(row.Owner) && text(row.Stage), `Missing canonical contact fields at row ${sheet_row}`);
    const routeIdentity = [normalize(organizationName), channel, normalize(address)].join('|');
    ensure(!seenRoutes.has(routeIdentity), `Duplicate organization/contact route at ${contactId}`);
    seenRoutes.add(routeIdentity);
    const person = nullable(row.Person);
    const sheetObject = { ...row };
    const archivePerson = nullable(ledgerRecord.person);
    for (const [field, current, archived] of [['organization', organizationName, ledgerRecord.studio], ['person', person, archivePerson], ['contact', address, ledgerRecord.contact], ['stage', enumValue(row.Stage), enumValue(ledgerRecord.status)]]) {
      if (current !== archived) differences.push({ contact_id: contactId, field, operational_value: current, archive_value: archived, resolution: 'Current Sheet is authoritative; archive preserved as evidence' });
    }
    const roles = text(row.Relationship).split(/\s*[,;]\s*/).map(enumValue).filter(Boolean);
    ensure(roles.length && roles.every(r => ['pilot_prospect', 'customer', 'publisher', 'partner', 'other'].includes(r)), `Unrecognized relationship requires reconciliation at ${contactId}`);
    const context = { sheet: sheetObject, batch_date: identity.batch_date, source_contact_key: row['Contact key'], person_identity_note: person?.includes(' and ') ? 'Source records this public alias/group as one contact; no individual identities invented.' : null, inbox_state: 'unknown', draft_is_not_send: true, sending_account: null };
    let nextAction = null;
    if (text(row['Next action'])) {
      const dueValue = row['Follow-up due'];
      const dueAt = text(dueValue) ? timestamp(dueValue, `${contactId} follow-up due`) : null;
      nextAction = { description: text(row['Next action']), due_at: dueAt, owner: text(row.Owner) };
      if (typeof dueValue === 'number') context.follow_up_due_precision = Number.isInteger(dueValue) ? 'date_only_start_of_day_America/Los_Angeles' : 'Pacific_wall_time';
    } else ensure(!text(row['Follow-up due']), `Due date without next action at ${contactId}`);
    const draft = draftBySource.get(sourceId) ?? null;
    const sourceRecord = { contact_identity: identity, sheet: { tab: 'Contacts', row: sheet_row, values, object: row }, sheet_research: research, ledger: ledgerRecord, candidate, draft_preparation: draft, unassigned_activity: unassignedActivity, source_file_sha256: fileDigests };
    return {
      contact_id: contactId, organization_name: organizationName, organization_website: null,
      person_name: person, person_role: nullable(row.Role), channel, address,
      relationship_types: roles, stage: enumValue(row.Stage), owner: text(row.Owner), context, source_record: sourceRecord,
      research: [
        { source_key: `sheet:${EXPECTED_SHEET}:Research:${contactId}`, source_url: nullable(research['Contact evidence']), observed_at: capturedAt, kind: 'research_snapshot', content: { ...research, facts: { contact_route: address, person_publicly_recorded: person, role_publicly_recorded: nullable(row.Role) }, inference: { fit_hypothesis: research['Fit hypothesis'], buying_fit: research['Buying fit inference'], outsourcing_signal: research['Outsourcing signal'], ai_openness: research['AI openness'] }, uncertainty: research.Uncertainty, observation_note: 'observed_at is the Sheet snapshot retrieval time; original research/activity dates and date precision are retained in content.' } },
        { source_key: `source-archive:${sourceDigest}:${contactId}`, source_url: `https://docs.google.com/spreadsheets/d/${EXPECTED_SHEET}/edit`, observed_at: capturedAt, kind: 'source_archive', content: sourceRecord },
      ],
      next_action: nextAction,
    };
  });
  ensure(records.length === mapping.size, 'Current Sheet and immutable mapping counts differ; reconcile additions/removals before import');
  ensure(records.length === ledger.contacts.length, 'Current Sheet and local ledger counts differ; reconcile rather than silently drop records');
  ensure(records.length === researchByKey.size, 'Research/Contacts record counts differ');
  const summaryRow = contactSheet.values.find(r => r[0] === 'Contacts' && typeof r[1] === 'number');
  ensure(!summaryRow || summaryRow[1] === records.length, 'Contacts count disagrees with Sheet summary');
  const contactByKey = new Map(records.flatMap(r => [[r.context.source_contact_key, r.contact_id], [mapping.get(r.contact_id).contact_key, r.contact_id]]));
  const interactions = activity.filter(r => text(r.Contact)).map(row => {
    const contactId = contactByKey.get(row.Contact);
    ensure(contactId, `Unmapped Activity contact at row ${row.sheet_row}`);
    const type = enumValue(row.Event);
    ensure(['sent', 'human_reply', 'auto_reply', 'bounce', 'meeting', 'note', 'inbox_checked'].includes(type), `Unrecognized Activity event at row ${row.sheet_row}`);
    const occurredAt = timestamp(row['Time (Pacific)'], `Activity row ${row.sheet_row}`);
    const account = nullable(row.Account);
    ensure(type !== 'sent' || account, `A send requires its real sending account at Activity row ${row.sheet_row}`);
    ensure(text(row['Recorded by']), `Missing activity recorder at row ${row.sheet_row}`);
    ensure(type !== 'inbox_checked', 'Inbox state checks require explicit checked_through evidence; reconcile this Activity row');
    return { idempotency_key: `sheet-activity-${sha256({ sheet: EXPECTED_SHEET, row: row.sheet_row, values: row.raw_values }).slice(0, 40)}`, contact_id: contactId, type, occurred_at: occurredAt, channel: text(row.Channel) ? channelFor(row.Channel, records.find(r => r.contact_id === contactId).address) : 'other', sending_account: account, confirmation: 'observed', evidence: `Google Sheet ${EXPECTED_SHEET}, Activity row ${row.sheet_row}; source snapshot ${fileDigests['sheet-before-cutover.json'] ?? sourceDigest}; recorded by ${row['Recorded by']}${row['Conversation URL'] ? `; ${row['Conversation URL']}` : ''}`, summary: text(row.Summary) || `${row.Event} recorded in operational Sheet`, outcome: null, is_follow_up: false };
  });
  for (const record of records) {
    const rows = interactions.filter(i => i.contact_id === record.contact_id);
    const sheet = record.context.sheet;
    ensure(!text(sheet['First sent']) || rows.some(i => i.type === 'sent'), `Send date without underlying Activity at ${record.contact_id}`);
    ensure(!text(sheet['Last sent']) || rows.some(i => i.type === 'sent'), `Send date without underlying Activity at ${record.contact_id}`);
    ensure(!text(sheet['Last human reply']) || rows.some(i => i.type === 'human_reply'), `Reply date without underlying Activity at ${record.contact_id}`);
    const staged = ['sent', 'contacted', 'replied', 'meeting', 'won', 'lost'];
    ensure(!staged.includes(record.stage) || rows.length > 0, `Stage implies actual activity absent from log at ${record.contact_id}`);
  }
  const payload = { idempotency_key: `sheet-cutover-${sourceDigest}`, source_key: `google-sheet:${EXPECTED_SHEET}`, captured_at: capturedAt, source_sha256: sourceDigest, records, interactions };
  const reconciliation = {
    captured_at: capturedAt, source_sha256: sourceDigest, payload_sha256: sha256(payload), source_file_sha256: fileDigests,
    source_of_truth: 'Current Google Sheet at capture; archive evidence supplements without overriding operational fields',
    counts: { contacts: records.length, organizations: new Set(records.map(r => normalize(r.organization_name))).size, named_person_or_alias_records: records.filter(r => r.person_name).length, research: records.reduce((n, r) => n + r.research.length, 0), next_actions: records.filter(r => r.next_action).length, interactions: interactions.length, sends: interactions.filter(i => i.type === 'sent').length, human_replies: interactions.filter(i => i.type === 'human_reply').length, auto_replies: interactions.filter(i => i.type === 'auto_reply').length, unassigned_notes_preserved: unassignedActivity.length, saved_email_draft_evidence: records.filter(r => r.source_record.draft_preparation?.record?.to).length, manual_form_draft_evidence: records.filter(r => r.source_record.draft_preparation?.record?.state === 'manual_contact_form').length },
    stage_counts: Object.fromEntries([...new Set(records.map(r => r.stage))].map(stage => [stage, records.filter(r => r.stage === stage).length])),
    channels: Object.fromEntries([...new Set(records.map(r => r.channel))].map(channel => [channel, records.filter(r => r.channel === channel).length])),
    differences_resolved_to_live_sheet: differences,
    tail_verification: sources.tailVerification,
    samples: [records[0], records.find(r => r.person_name), records.find(r => r.contact_id === 'AF-20261029-08')].filter(Boolean).map(r => ({ contact_id: r.contact_id, organization_name: r.organization_name, person_name: r.person_name, channel: r.channel, stage: r.stage, draft_evidence_preserved: Boolean(r.source_record.draft_preparation), uncertainty: r.research[0].content.uncertainty })),
    limitations: ['Snapshot ranges must be checked for newer edits immediately before cutover; import refuses inconsistent identities/counts.', 'No inbox was read. Empty reply fields remain unknown.', 'Saved drafts are evidence only; no sending account is inferred.', 'Source snapshots are private ignored local files; source_record and research retain per-contact original content in hosted CRM.'],
  };
  return { payload, reconciliation };
}

function main(argv) {
  const opts = { snapshot: '.crm/snapshots/sheet-before-cutover.json', 'archive-dir': DEFAULT_ARCHIVE, 'output-dir': '.crm' };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    ensure(Object.hasOwn(opts, key) && argv[i + 1], 'Usage: node scripts/crm-prepare-import.mjs [--snapshot FILE] [--archive-dir DIR] [--output-dir DIR]');
    opts[key] = argv[i + 1];
  }
  const sources = loadSources(resolve(opts.snapshot), resolve(opts['archive-dir']));
  const { payload, reconciliation } = prepareImport(sources);
  const output = resolve(opts['output-dir']);
  mkdirSync(join(output, 'snapshots', 'archives'), { recursive: true });
  for (const [name, raw] of Object.entries(sources.archiveRaw)) writeFileSync(join(output, 'snapshots', 'archives', name), raw, { mode: 0o600 });
  writeFileSync(join(output, 'import.json'), JSON.stringify(payload, null, 2) + '\n', { mode: 0o600 });
  writeFileSync(join(output, 'reconciliation.json'), JSON.stringify(reconciliation, null, 2) + '\n', { mode: 0o600 });
  process.stdout.write(JSON.stringify({ ok: true, payload: join(output, 'import.json'), reconciliation: join(output, 'reconciliation.json'), source_sha256: reconciliation.source_sha256, counts: reconciliation.counts, stage_counts: reconciliation.stage_counts }) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); } catch (error) { process.stderr.write(JSON.stringify({ ok: false, error: error.message }) + '\n'); process.exitCode = 1; }
}
