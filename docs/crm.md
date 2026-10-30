# Arcane Forge private CRM

The assistant reads and records CRM data; Bing works through conversation and short summaries. Bing sends every message himself. The interface records evidence of activity and never sends messages.

## Delivery status

The protected read-only website interface is implemented. Its separate web-reader migration and login are active and verified; Vercel Production secrets allow only Bing's confirmed website identity. Website publication and live browser verification are separate from database activation. See [Protected CRM website](crm-web.md) for the validation boundaries and release receipt location.

The hosted CRM is active on project `nydmouxljprsfymcvqko`. Migration ownership, the private schema, scoped login, import and cutover are verified. Supabase is the single operational master. The pointer at `/Users/binggan/new_start/pitches/studio-outreach/crm-workspace.json` now routes agents to this CLI; the Google Sheet and dated files remain historical snapshots. No public website deployment or git push was performed.

## Use from conversation

Ask the assistant for a short response, for example:

- “Who did we contact this week, through which accounts, and who replied?”
- “What needs my attention today?”
- “Show Elsewhere’s history and the evidence behind its proposed fit.”
- “I sent this message from this account at this time; record it and remind me to check next Tuesday.”
- “That was an automatic reply; do not count it as a human response.”

A send needs Bing's confirmation or direct observation plus the exact timestamp, channel, sending account, and evidence. A saved draft is not a send. Empty reply fields are not evidence of no reply. The connected Drive account does not establish a sending account.

## Immediate commands

Run from `/Users/binggan/new_start/arcane_forge_website` using Node 22 and installed dependencies. These commands connect to the hosted private CRM using the scoped local credential and return structured JSON.

```sh
node scripts/crm.mjs --help
node scripts/crm.mjs summary
node scripts/crm.mjs due
node scripts/crm.mjs search '{"query":"Elsewhere"}'
node scripts/crm.mjs history '{"contact_id":"AF-20261029-01"}'
node scripts/crm.mjs search '{"contacted":true,"limit":100,"offset":0}'
```

Commands accept inline JSON, `--file PATH`, or `--stdin`. Use `--actor assistant:chat-identifier` to identify the recorder. The actor is declared by the caller; the database also records its connection role. `npm run crm -- ...` is equivalent but adds npm output banners.

Supported operations are `import`, `search`, `history`, `interaction`, `action`, `relationship`, `due`, and `summary`. Search and due results are bounded; use `limit` and `offset`, inspect returned totals/`next_offset`, and retrieve subsequent pages for larger queues. Search accepts `contacted`, `response_state`, and `relationship_type` filters. Summary explicitly reports lifetime metrics. History includes organization contacts, evidence, interactions, relationship changes, and action history.

## Record activity safely

Prepare JSON locally after Bing reports an actual event, then pass its path to the CLI:

```sh
node scripts/crm.mjs interaction --file /private/tmp/confirmed-interaction.json
```

Required fields are `idempotency_key`, `contact_id`, `type`, `occurred_at`, `channel`, `confirmation`, `evidence`, and `summary`. A `sent` event additionally requires `sending_account`. Optional `follow_up_due_at` creates a review reminder; it never sends a message. A follow-up is a second `sent` event with `is_follow_up: true` and its own idempotency key.

Types are `sent`, `human_reply`, `auto_reply`, `bounce`, `meeting`, `note`, and `inbox_checked`. Timestamps must include a timezone. `confirmation` is `user_confirmed` or `observed`. Use a new idempotency key for a new event. Reusing a key with the identical payload returns the earlier result; conflicting reuse fails.

An `inbox_checked` event requires the checked `channel` and `sending_account`, plus `inbox_state` (`no_reply` or `unknown`) and `checked_through`. To verify no reply, the latest check for every channel/account used to contact this record must say no reply and cover that scope's latest send. A check of one mailbox cannot verify another mailbox or a LinkedIn conversation. A later send or explicit unknown check makes earlier coverage stale. There is no inbox connection or reply synchronization.

Use `action` to create or complete reminders, and `relationship` to add a role or record its changed stage/outcome. These append events instead of overwriting history. Relationship types include pilot prospect, customer, publisher, partner, investor, and other. One organization can have multiple contacts, and one contact can have multiple relationship roles.

## Metrics

The lifetime denominator is the number of distinct stable `contact_id` records with at least one actual or user-confirmed send. The unit is one public contact route/person record. It is not a deduplicated organization or person across several contact routes.

The human-response numerator is the subset of those outbound contact IDs with a human reply at or after the first send. Additional follow-ups do not increase either unique-contact count. Automatic replies are separate. Bounces remain in the denominator; this is not a delivery-adjusted rate. When no contacts have a recorded send, the rate is `null`, not 0%.

`not_contacted`, `unknown`, `verified_no_reply`, and `human_reply` are distinct states. A historical human reply supports the lifetime reply metric; it does not claim every subsequent message was answered or the inbox is currently read.

## Source evidence and imports

The verified hosted import contains 45 proposed contacts, 45 organizations, 19 publicly recorded names/aliases, 90 evidence entries, and 45 proposed next actions. At cutover, there are zero operational interactions, recorded sends, human replies, or automatic replies. All 45 review actions are unscheduled; no follow-up dates were invented. Twenty-two saved email drafts and three manual contact-form drafts are preserved as evidence. Buying-fit inference and uncertainty remain separate from confirmed facts. Public group aliases remain as recorded rather than being split into invented people.

The Sheet was read through all populated columns and grid bounds for Contacts, Activity, and Research, then re-read unchanged immediately before cutover. Its fields were authoritative for the initial import; Supabase now owns current operational state. Original Sheet rows, local candidate records, identity mapping, research caveats, draft metadata, and source hashes are retained. Exact private snapshots, reconciliation, and the frozen payload are in ignored `.crm/`.

```sh
# Retry the already-completed initial import with its identical frozen payload.
# This returns the original import receipt and does not create more contacts.
node scripts/crm.mjs import --file .crm/import.json
```

The original Sheet preparation tool is a one-time migration helper. It expects the old Sheet pointer shape and must not read the current Supabase pointer as if it were still the operational Sheet. For historical reconstruction, use `--archive-dir .crm/snapshots/archives --output-dir /private/tmp/crm-reconstruction`; never overwrite the frozen import merely to retry it. New daily batches use new import source keys, captured timestamps, source hashes, stable contact IDs, evidence, and idempotency keys. Duplicate organization/route identities and conflicting stable IDs must be reviewed instead of silently multiplied. Existing operational state is changed through explicit events, not overwritten by research re-import.

`/Users/binggan/new_start/pitches/studio-outreach/crm-workspace.json` identifies Supabase as the single operational master. The Sheet and dated files remain historical snapshots. There is no two-way sync. The existing daily research schedule is unchanged.

## Access and credentials

The CRM is a private PostgreSQL schema, excluded from the public Data API. Anonymous site visitors and authenticated customer accounts have neither schema access nor CRM function execution. RLS is default deny. No CRM browser bundle, public Next.js route, or large dashboard is added.

The dedicated `crm_agent` login can call only `crm.command(text,jsonb,text)` in that schema and has no direct table access. The CLI accepts only the approved target project and session pooler and always verifies the TLS certificate and hostname. Privileged website and database-admin credentials are not accepted by the agent interface.

The generated CRM credential belongs in ignored `.env.crm.local`, mode 0600. The template is `.env.crm.example`. The public CA certificate is in `supabase/certs/prod-ca-2021.crt`, downloaded from the authenticated dashboard's SSL Configuration link. Never log credentials or put them in documentation, source control, or browser code.

## Migration ownership and maintenance

Read [migration ownership](supabase-migrations.md). All target-project schema changes belong to this website repository. The four historical migrations retain their original names, versions, and bytes. Their SQL statements also match the live history after whitespace/comment normalization. The games repository retains an owner pointer, game application code, fixtures, and assets.

```sh
node scripts/db-admin.mjs history
node scripts/db-admin.mjs dry-run
# Initial activation only; already completed. This stops when no reviewed migration is pending.
# node scripts/db-admin.mjs apply
```

The product-service database and its independent migrations are outside this work. Do not reset the hosted database, replay old migrations, rewrite remote history, push git, or deploy the public website as part of these commands.

## Reproduce checks

```sh
npm run test:crm
npx tsc --noEmit --incremental false
# Uses a fresh disposable local PostgreSQL 15 container; requires Docker.
node scripts/crm-test-local.mjs
# Hosted workflow and authorization checks; all synthetic writes roll back.
node scripts/crm-test-hosted.mjs --verify
```

Initial activation and provisioning are complete. The existing `.env.crm.local` credential is active; provisioning deliberately refuses to reset or overwrite it. Do not rerun setup as a routine daily task. The hosted migration list contains all five canonical versions, and its dry run reports the database is up to date.

## Verification and practical limits

Thirty-four Node tests cover validation, target restrictions, TLS, parameterization, safe errors, duplicate/source reconciliation, deterministic import behavior, and Pacific date conversion, search filters, and pagination validation. Mocked provisioning tests verify file protection, privilege gates, mode 0600, rollback cleanup, and uncertain-commit recovery without accessing the hosted database. TypeScript compilation passes. `scripts/crm-workflow.sql` tests import/replay/conflicts, duplicate identities, append-only history, send/follow-up counting, automatic/human replies, inbox chronology, relationship roles, due reminders, and authorization. It also tests 105-record queue pagination, metadata/domain conflict rejection, and coverage of every sending channel/account. It ends in `ROLLBACK`, with zero synthetic contacts or receipts left behind. The actual 45-contact payload and exact retry also passed a local rollback transaction. Hosted workflow tests then passed against the real project, including actual `anon`/`authenticated` runtime denial and actual `crm_agent` command access with direct table/helper denial. All test fixtures rolled back; no test records remain. The real import was committed, its exact replay returned the same import ID, and every stable ID, person/alias, relationship, research entry, original source record and next action was compared with the frozen payload. Final totals are 45 contacts, 45 organizations, 19 public names/aliases, 90 evidence entries and 45 open review actions.

During readiness inspection, the dashboard warning was isolated to PostgREST; database, Auth, Storage, Realtime, and Edge Functions reported healthy. PostgREST logs show successful database connections and schema-cache loads without 4xx/5xx errors. After CRM application, direct game REST reads and Auth health returned 200. Requests for the private CRM through the public Data API returned 406/PGRST106, confirming the schema is not exposed. Strictly verified database TLS connects to writable PostgreSQL 15.8 with recovery disabled. The aggregate PostgREST health warning's root cause remains unconfirmed; infrastructure settings were not changed. CRM commands use direct PostgreSQL and do not depend on PostgREST.

This first interface preserves original interaction records. An incorrect logged send can be annotated with a correction note, but there is no metric-voiding operation yet. Record factual activity carefully. Backups are the existing Supabase database backups; private local source snapshots are not a substitute for hosted backups.
