# Supabase migration ownership

The website repository owns all schema changes for project `nydmouxljprsfymcvqko` (arcane-forge-website). The service database is independent and excluded.

## Transfer verified before CRM

The four historical SQL files were copied byte-for-byte with unchanged names and versions. SHA-256 values are recorded in `supabase/migration-ownership.json`. The hosted versions match all four, and their recorded SQL statements match the files after whitespace/comment normalization. A website-owned `supabase db push --dry-run` reported **Remote database is up to date**. All four rebuilt successfully in an isolated PostgreSQL 15 container with Supabase API roles stubbed. This verifies SQL compatibility, not a complete local Auth/Storage deployment.

The transferred config uses local project ID `arcane_forge_website`; local automatic seeds are disabled. Game fixtures and application code stay in the games repository. Its active migrations, CLI config, and local active project link were retired after this verification.

## Deployment rules

Run schema commands from `/Users/binggan/new_start/arcane_forge_website`. Use the project-specific database password through a secure environment loader; never paste it into logs or documents. Verify target and history, run dry-run, inspect only intended new migrations, then apply additive migrations. Never reset the hosted database or repair/rewrite history without investigation. Website application deployment and schema deployment are separate. No git push or public deployment is part of this transfer.

Commands are provided by `scripts/db-admin.mjs`: `node scripts/db-admin.mjs history`, `node scripts/db-admin.mjs dry-run`, and `node scripts/db-admin.mjs apply`.

## Hosted CRM application

Migration `20261030020000_private_crm.sql` was applied after explicit user approval of the scoped CRM login. Its reviewed SHA-256 is recorded in `supabase/migration-ownership.json`. All five local and remote versions align, and the post-application dry run reports the database is up to date. The scoped login, hosted rollback-only workflow/authorization checks, real 45-contact import and exact idempotent replay are verified. Supabase is now the operational master identified by the outreach workspace pointer.

## Readiness

The sixth additive migration, `20261030030000_private_crm_web_reader.sql`, is **applied** with the reviewed bytes unchanged. Its checksum and hosted verification are recorded separately as `crm_web_review`. `apply-web` required exactly this pending file after validating all historical and applied hashes. The separate scoped web login, actual role reads/denials, preserved CLI and zero fixture/membership residue are verified. See [Protected CRM website](crm-web.md). Applied migrations must not be replayed; use `node scripts/crm-web-verify-live.mjs --verify` for post-activation checks.

Hosted migration reads, public game REST reads, and Auth health return successfully. The inspected dashboard aggregate warning was isolated to PostgREST; no infrastructure settings were changed. Detailed readiness investigation is recorded in docs/crm.html. The warning is isolated to PostgREST; direct database access works with certificate verification and does not depend on the Data API.
