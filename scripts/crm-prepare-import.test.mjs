import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareImport, excelSerialToISO, channelFor, sha256 } from './crm-prepare-import.mjs';

const SHEET = '1ys9freJEi9vo6iORqKRKpcCpb8PXS-5O1dNQ0rOUOzw';
const headers = ['Organization', 'Person', 'Relationship', 'Stage', 'Next action', 'Follow-up due', 'Owner', 'Contact / URL', 'Channel', 'Role', 'First sent', 'Last sent', 'Last human reply', 'Reply outcome', 'Notes', 'Contact key', 'Added'];
const researchHeaders = ['Contact key', 'Organization', 'Contact evidence', 'Fit hypothesis', 'Buying fit inference', 'Uncertainty'];
const activityHeaders = ['Time (Pacific)', 'Contact', 'Event', 'Channel', 'Account', 'Summary', 'Conversation URL', 'Recorded by', 'Message type'];
const serial = (year, month, day, hour = 0, minute = 0) => (Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(1899, 11, 30)) / 86400000;

function fixture() {
  const ids = ['AF-20261028-01', 'AF-20261029-01'];
  const keys = ['Alpha Studio [AF-20261028-01]', 'Beta Studio / Rocky and Tea [AF-20261029-01]'];
  const mapping = ids.map((contact_id, i) => ({ contact_id, contact_key: keys[i], source_id: i ? '2026-10-29-01' : '01', batch_date: i ? '2026-10-29' : '2026-10-28' }));
  const candidates = [
    { id: '01', studio: 'Alpha Studio', contact: 'hello@example.com', status: 'proposed', batch_date: '2026-10-28' },
    { id: '2026-10-29-01', studio: 'Beta Studio', person: 'Rocky and Tea', contact: 'https://twitter.com/example', status: 'proposed', batch_date: '2026-10-29' },
  ];
  return {
    snapshot: { spreadsheet_id: SHEET, captured_at: '2026-10-30T02:04:49.573Z', sheets: {
      Contacts: { range: 'Contacts!A1:Z100', values: [[], ['Arcane Forge relationships'], ['Contacts', 2], [], [], [], [], headers, ['Alpha Studio', '', 'Pilot prospect', 'Proposed', 'Review fit', '', 'Bing', 'hello@example.com', 'Email', '', '', '', '', 'Unreviewed', '', keys[0], 46323], ['Beta Studio', 'Rocky and Tea', 'Pilot prospect', 'Proposed', 'Review fit', '', 'Bing', 'https://twitter.com/example', 'Professional profile', 'Public aliases', '', '', '', 'Unreviewed', '', keys[1], 46324]] },
      Research: { range: 'Research!A1:Z60', values: [researchHeaders, [keys[0], 'Alpha Studio', 'https://example.com', 'Possible fit', 'Inferred', 'Interest and budget unknown'], [keys[1], 'Beta Studio', 'https://example.org', 'Possible fit', 'Inferred', 'Public alias; no verified legal identities']] },
      Activity: { range: 'Activity!A1:Z100', values: [activityHeaders, [serial(2026, 10, 29, 16, 31), '', 'Note', '', '', 'Tracker initialized', '', 'Assistant', 'Other']] },
    } },
    archives: {
      'crm-workspace.json': { spreadsheet_id: SHEET, source_mapping: mapping },
      'outreach-ledger.json': { contacts: candidates },
      '2026-10-28-candidates.json': { date: '2026-10-28', candidates: [candidates[0]] },
      '2026-10-29-candidates.json': { date: '2026-10-29', candidates: [candidates[1]] },
      '2026-10-28-email-drafts.json': { batch_date: '2026-10-28', sending_authorized: false, prepared_at: '2026-10-30T01:43:41Z', mailbox: 'drafts@example.com', mail_provider: 'Outlook', authorization: 'Create drafts only', verification: { draft_count: 1 }, emails: [{ candidate_id: '01', to: 'hello@example.com', state: 'created_verified', text_content: 'Draft body only' }], contact_forms: [] },
    },
    sourceDigest: 'a'.repeat(64), fileDigests: { 'sheet-before-cutover.json': 'b'.repeat(64) }, tailVerification: { ranges: [{ tab: 'Contacts', range: 'A101:Q2000', values: null }] },
  };
}

test('deterministic payload preserves drafts, uncertainty, unassigned notes and aliases without inventing outreach', () => {
  const source = fixture();
  const first = prepareImport(source);
  const replay = prepareImport(structuredClone(source));
  assert.deepEqual(first, replay);
  assert.equal(sha256(first.payload), sha256(replay.payload));
  assert.equal(first.payload.interactions.length, 0);
  assert.equal(first.reconciliation.counts.sends, 0);
  assert.equal(first.reconciliation.counts.saved_email_draft_evidence, 1);
  assert.equal(first.payload.records[0].context.sending_account, null);
  assert.equal(first.payload.records[0].source_record.draft_preparation.record.text_content, 'Draft body only');
  assert.equal(first.payload.records[1].person_name, 'Rocky and Tea');
  assert.equal(first.payload.records[1].channel, 'other');
  assert.equal(first.payload.records[1].research[0].content.uncertainty, 'Public alias; no verified legal identities');
  assert.deepEqual(first.payload.records[0].research[1].content, first.payload.records[0].source_record);
  assert.equal(first.payload.records[0].source_record.unassigned_activity.length, 1);
  assert.equal(first.reconciliation.tail_verification.ranges[0].values, null);
});

test('current Sheet fields win while conflicting archive evidence is retained', () => {
  const source = fixture();
  source.snapshot.sheets.Contacts.values[8][3] = 'Approved';
  source.snapshot.sheets.Contacts.values[8][7] = 'new-route@example.com';
  const { payload, reconciliation } = prepareImport(source);
  assert.equal(payload.records[0].stage, 'approved');
  assert.equal(payload.records[0].address, 'new-route@example.com');
  assert.equal(payload.records[0].source_record.ledger.contact, 'hello@example.com');
  assert.equal(reconciliation.differences_resolved_to_live_sheet.length, 2);
});

test('duplicate IDs, duplicate contact routes and mismatched count fail closed', () => {
  const duplicate = fixture();
  duplicate.snapshot.sheets.Contacts.values[9][15] = duplicate.snapshot.sheets.Contacts.values[8][15];
  assert.throws(() => prepareImport(duplicate), /Duplicate contact ID/);
  const routes = fixture();
  routes.snapshot.sheets.Contacts.values[9][0] = ' alpha studio ';
  routes.snapshot.sheets.Contacts.values[9][7] = 'HELLO@example.com';
  routes.snapshot.sheets.Contacts.values[9][8] = 'Email';
  assert.throws(() => prepareImport(routes), /Duplicate organization\/contact route/);
  const missing = fixture();
  missing.snapshot.sheets.Contacts.values.pop();
  assert.throws(() => prepareImport(missing), /counts differ/);
});

test('unknown human additions and truncated boundary ranges are not silently discarded', () => {
  const addition = fixture();
  addition.snapshot.sheets.Contacts.values[9][15] = 'Unknown [AF-20261030-01]';
  assert.throws(() => prepareImport(addition), /Unmapped contact/);
  const boundary = fixture();
  boundary.snapshot.sheets.Contacts.range = 'Contacts!A1:Z10';
  assert.throws(() => prepareImport(boundary), /read reaches its boundary/);
});

test('logged sends need account and actor; derived dates cannot invent missing activity', () => {
  const source = fixture();
  const row = source.snapshot.sheets.Contacts.values[8];
  row[3] = 'Sent';
  row[10] = serial(2026, 10, 29, 16, 31);
  assert.throws(() => prepareImport(source), /without underlying Activity/);
  source.snapshot.sheets.Activity.values.push([serial(2026, 10, 29, 16, 31), row[15], 'Sent', 'Email', '', 'User logged send', '', 'Bing', 'Email']);
  assert.throws(() => prepareImport(source), /real sending account/);
  source.snapshot.sheets.Activity.values[2][4] = 'sender@example.com';
  const { payload } = prepareImport(source);
  assert.equal(payload.interactions.length, 1);
  assert.equal(payload.interactions[0].occurred_at, '2026-10-29T23:31:00.000Z');
  assert.equal(payload.interactions[0].sending_account, 'sender@example.com');
  assert.match(payload.interactions[0].evidence, /recorded by Bing/);
});

test('Pacific serial conversion handles standard/daylight offsets and rejects DST ambiguities', () => {
  assert.equal(excelSerialToISO(serial(2026, 10, 29, 16, 31)), '2026-10-29T23:31:00.000Z');
  assert.equal(excelSerialToISO(serial(2026, 12, 1, 16, 31)), '2026-12-02T00:31:00.000Z');
  assert.throws(() => excelSerialToISO(serial(2026, 11, 1, 1, 30)), /Ambiguous or nonexistent/);
  assert.throws(() => excelSerialToISO(serial(2026, 3, 8, 2, 30)), /Ambiguous or nonexistent/);
  assert.equal(channelFor('Professional profile', 'https://uk.linkedin.com/in/example'), 'linkedin');
  assert.equal(channelFor('Professional profile', 'https://twitter.com/example'), 'other');
});
