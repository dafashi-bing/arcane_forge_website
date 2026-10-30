# Protected CRM website

The read-only CRM interface uses the existing Next.js website at `/internal/crm`. Its separate hosted reader is active and verified. Bing approved production configuration and a website deployment; the exact publication and live verification receipt is retained in ignored `.crm/web-completion.json`. Database activation, website publication and browser verification are separate outcomes.

## Pages and data boundaries

- `/internal/crm`: due review reminders, recorded human replies without outcomes, unscheduled reviews, source research batches, import provenance and lifetime response metrics.
- `/internal/crm/relationships`: organization, person, address and stable-ID search; relationship role, stage and response-state filters; bounded pagination.
- `/internal/crm/contacts/[id]`: organization and contacts, channel/account/timestamp interaction history, research sources, fit inference, uncertainty and next actions.
- `GET /api/internal/crm/today`, `/api/internal/crm/relationships` and `/api/internal/crm/contacts/[id]`: the same guarded reader. `POST /api/internal/crm/relationships` performs a read-only search using bounded JSON. There are no CRM mutation endpoints.

Every page and API checks the user returned by Supabase `auth.getUser()`. Every data read checks again. Authorization requires the exact configured UUID and verified email, the authenticated role/audience, and a nonanonymous account. Ordinary customer sign-in grants no internal access. User-editable metadata is not an authorization source. Missing configuration fails closed.

Internal responses, including error and unknown nested routes, carry private/no-store, noindex and no-referrer headers. Private links disable prefetch. Marketing analytics omits internal and authentication routes, including transitions from a public page. Titles and metadata are generic; no contact information is included in social metadata or public assets. This area uses dynamic rendering rather than static export.

Relationship search, filters and pagination stay in component memory and a read-only POST body. The interface does not place names or email searches in URLs, browser history, storage or application logs. GET reads reject search/filter parameters. Authorization runs before the POST body is inspected; streamed JSON has an 8 KiB limit, supported-field/type validation and the same guarded read function. Displayed results and filters are cleared when access is denied.

Private-route middleware and CRM identity checks use an eight-second Auth transport deadline. The actual request and response body are aborted on timeout, and verification fails closed with a generic non-retryable error. The page/data checks still verify identity independently; there is no timeout bypass or cached identity fallback. Other website Supabase clients retain their existing behavior.

## Confirmed website account

Bing explicitly selected `bing@bingai.studio` as the only allowed website account. Its verified UUID was read from the existing Auth service and independently matched in the Supabase dashboard. The UUID and email are configured as server-only Vercel Production secrets. No replacement user or broader domain allowlist was created.

The published website JavaScript confirms its existing Auth issuer is project `wdoiouwzfutdtmdsdgkr`. This is preserved. CRM records remain in the separate website database `nydmouxljprsfymcvqko`; no product database or Auth records were changed. The website repository's `.env` is target-specific maintainer configuration for the CRM database and is not evidence of the deployed website's Auth issuer. Local application configuration uses the verified public production Auth settings. The different account in the CRM project's Auth table grants no internal website access.

## Server configuration

Copy the safe variable names from `.env.crm-web.example`. None are public browser variables:

```sh
CRM_ALLOWED_USER_ID=
CRM_ALLOWED_USER_EMAIL=bing@bingai.studio
CRM_WEB_DATABASE_URL=
CRM_WEB_DATABASE_CA=
```

The database URL accepts only the dedicated `crm_web.nydmouxljprsfymcvqko` login at the existing session pooler, port 5432, database postgres. It rejects the agent login, maintainer login, product database and TLS-disabling options. Use `CRM_WEB_DATABASE_CA` containing the complete trusted CA PEM for deployment, avoiding a dependency on local filesystem paths. `CRM_WEB_DATABASE_CA_FILE` is also available locally. TLS always verifies the CA and hostname. Reads run in an explicit read-only transaction with connection/query timeouts.

The provisioner created an ignored mode-0600 `.env.crm-web.local` file. Next.js does not automatically load this custom filename. The local application has an ignored mode-0600 `.env.local` containing only the dedicated reader, trusted CA, verified allowlist and published public Auth configuration. Production stores exactly four CRM values as Production secrets in the existing Vercel project: `CRM_WEB_DATABASE_URL`, `CRM_WEB_DATABASE_CA`, `CRM_ALLOWED_USER_ID` and `CRM_ALLOWED_USER_EMAIL`. Existing environment settings were not replaced. Do not upload `.env`, `.env.crm.local`, `.crm` evidence or maintainer credentials.

## Applied additive database change

`supabase/migrations/20261030030000_private_crm_web_reader.sql` is applied with its reviewed bytes unchanged. It adds a private `crm.web_read(text,jsonb)` dispatcher and a `crm_web` role; the separate provisioner enabled only its scoped login. The role can execute this function only. It has no direct CRM table access, no internal-helper access and no `crm.command` execution. The fixed dispatcher accepts only Today, Relationships and Contact reads; it cannot forward a caller-supplied mutation operation to the agent command. The schema remains excluded from the public Data API and customer policies remain deny-by-default.

The reviewed SHA-256 is frozen under `crm_web_review` in `supabase/migration-ownership.json`. Applied migrations must not be edited or replayed. The one-time activation used `apply-web` to verify all historical/applied checksums and require exactly this one pending migration. These setup commands are historical; do not rerun activation or reset the existing credential:

```sh
node scripts/db-admin.mjs history
node scripts/db-admin.mjs dry-run
node scripts/crm-web-test-hosted.mjs --verify
node scripts/db-admin.mjs apply-web
node scripts/crm-web-provision.mjs --provision
```

Run the hosted rehearsal before application: it temporarily creates the pending role/function and synthetic workflow inside one outer rollback transaction. It checks real records and runtime denials, then confirms no role/function/fixture or CRM row-count changes remain. Once applied, that pending-migration rehearsal deliberately refuses to run again; use the scoped live reader to verify the deployed state instead. Never rerun provisioning to reset an existing credential.

Post-activation checks use `node scripts/crm-web-verify-live.mjs --verify`. Actual strict-TLS `crm_web` login reads passed for all three operations, with direct table/helper/agent-command denial. Actual agent login still runs the CLI and is denied the web function. Anonymous and authenticated customer database roles are denied. No test contacts, receipts or temporary role memberships remain; operational row counts were preserved.

The provisioner refuses broad effective PUBLIC writes, schema creation, privileged external functions, unexpected memberships or direct CRM/helper access. It does not repair unrelated grants as a side effect. The independent product database and migrations are outside the change.

## Validation completed and limits

The Node suites cover the original CRM/CLI/import workflow plus exact identity policy, invalid/expired session results, parameterized read dispatch, TLS/target restrictions, safe errors, provisioning recovery, migration review, analytics, redirects and search-body privacy. The release checks also exercise the original route and client callbacks for authorization before parsing, byte limits, generic errors, POST-only search and clearing results after access denial. Exact release totals and framework/audit results are recorded with the release receipt.

Local production builds use a synthetic build-only Stripe key; no payment calls are made. Without it, the existing checkout route's module-level Stripe initialization prevents local build completion. Existing production Stripe and Blob settings are preserved.

The release dependency review required replacing unsupported Next.js 14 with the patched Next.js 15.5.28 maintenance release, React/React DOM 19.3.1 and compatible theme/types packages. Async cookie access and route parameters were updated without changing the CRM authorization boundary. Blob 2 list calls explicitly use the existing Blob token to preserve their store selection, and the MDX package/lockfile are aligned. Narrow compatible dependency overrides address affected build/runtime dependencies. The framework version is supported by the maintainer's [Next.js support policy](https://nextjs.org/support-policy) and patched releases in its [image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) and [Server Actions advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r). The final audit result belongs to the release receipt.

An isolated PostgreSQL 15 rebuild of all six migrations and rollback-only SQL workflows passes. Tests cover fixed read dispatch, role/stage filters applying to the same relationship, literal search, pagination, missing records, default denials and preserved response semantics. Test containers are removed and synthetic records roll back.

The ignored local UI harness renders the original pages, API handlers and authorization/data guards with a fixture Supabase verifier and captured-data reader. Its identity checks cover allowed, ordinary customer, anonymous, invalid, expired, wrong-email, unverified and anonymous-identity cases; denied requests never call the reader. This is not an actual allowed-user session. Separately, the hosted reader and real data are now verified. Fresh reads recorded 45 contacts and organizations, 90 evidence entries, 22 actual sends across 22 stable IDs, no recorded human replies, 22 unknown reply states, no verified-no-reply records, 45 unscheduled actions and no due actions. The rate is 0% of 22 recorded outbound IDs. Counts are a verification snapshot, not an inbox check or permanent guarantee.

One 1440×900 desktop viewport was used for the initial browser review of Today, organization search and contact detail. The captured-data preview is clearly labeled fixture authentication; it is separate from release-browser verification. The final Next.js 15 build keeps every CRM route dynamic. All 82 Node tests pass, along with a clean dependency-install dry run and an audit reporting zero vulnerabilities. The browser-bundle scan passes for 54 browser files and 92 private markers without logging marker values. Eighteen loopback HTTP checks pass against the upgraded build with the verified production Auth namespace: anonymous and forged/expired-shaped cookies, read-only search POST denials, privacy headers, nested routes, HEAD and rejected mutation methods. Genuine live sessions and deployed browser interactions are recorded separately in the release receipt.

```sh
npm run test:crm
npm run test:crm:web
node scripts/crm-web-test-local.mjs
npm run test:crm:web:bundle
# Against the original local production server, with only a synthetic test UUID:
npm run test:crm:web:http
```

Hosted application and actual scoped-login testing are complete. Production website publication and real allowlisted-session checks must be confirmed from their own receipts; a local fixture test does not establish those outcomes.

## Existing sign-in hardening

Sign-in return paths now reject external/protocol-relative URLs, backslashes and encoded separator tricks. The existing IDE token handoff previously accepted arbitrary callback destinations; it now permits only the exact Arcane Forge extension authority/path, the local VS Code, VS Code Insiders or Cursor scheme, and a UUID v4 state. This preserves the verified desktop callback flow. Remote/web IDE HTTPS callback wrappers and other forks fail closed until explicitly supported. No CRM credential is passed through the IDE handoff.

## Publication workflow

The production workflow remains a push to the existing website repository followed by Vercel deployment. Bing explicitly authorized the reviewed hosted reader activation, Vercel configuration and the specific website deployment push. The production route is `https://www.arcaneforge.ai/internal/crm`. Check its deployment and live verification receipt before treating it as a working published result. No replacement Site was created.

An initial automatic approval rejection was resolved by Bing's explicit authorization; the hosted rehearsal subsequently passed and rolled back cleanly before activation. Vercel's existing-value reveal flow requested email verification; that reveal was canceled, the Auth issuer was confirmed from public website assets, and only new approved CRM secrets were added using the normal form. No verification email was sent and no account-security protection was weakened.

Before reporting a release complete, verify anonymous, customer, allowed and expired/invalid behavior at both page and API boundaries, inspect production cache headers and browser output, and check existing public pages and the CRM CLI. Use fixture and database-role results only for the paths they actually exercise. Do not impersonate customer accounts or create product Auth fixtures. No outreach, inbox connection, reply synchronization or scheduled follow-up is included.
