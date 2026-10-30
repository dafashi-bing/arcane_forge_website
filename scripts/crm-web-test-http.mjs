#!/usr/bin/env node
// Exercise the original built Next server. This never creates users or changes data.
import { containsPrivateMarker, privateMarkers } from './crm-web-scan-client.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function check(condition, message) { if (!condition) throw Error(message); }

export function resolveHttpTestConfig(argv = process.argv.slice(2), env = process.env) {
  check(argv.length === 1 && ['--verify', '--verify-production'].includes(argv[0]), 'Explicit verification mode required');
  const production = argv[0] === '--verify-production';
  const base = new URL(env.CRM_HTTP_TEST_URL || (production ? 'https://www.arcaneforge.ai' : 'http://127.0.0.1:3040'));
  check(base.pathname === '/' && !base.search && !base.hash && !base.username && !base.password, 'Only a plain verification origin is accepted');
  if (production) check(base.origin === 'https://www.arcaneforge.ai', 'Production verification accepts only the exact approved HTTPS origin');
  else check(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Default verification accepts only a loopback test server');
  const authProject = env.CRM_HTTP_TEST_AUTH_PROJECT_REF || 'wdoiouwzfutdtmdsdgkr';
  check(['wdoiouwzfutdtmdsdgkr', 'nydmouxljprsfymcvqko'].includes(authProject), 'Only an explicitly reviewed Auth project is accepted');
  if (production) check(authProject === 'wdoiouwzfutdtmdsdgkr', 'Production verification requires the confirmed website Auth project');
  return { base, authProject, mode: production ? 'production' : 'loopback' };
}

export function sessionCookie(authProject, expired = false) {
  check(['wdoiouwzfutdtmdsdgkr', 'nydmouxljprsfymcvqko'].includes(authProject), 'Unreviewed fixture cookie namespace');
  const json64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  // Deliberately forged, invalid signature. No real session or user credential.
  const jwt = `${json64({ alg: 'HS256', typ: 'JWT' })}.${json64({
    sub: '83470b31-9624-4d49-8b9e-78c430f63001', email: 'owner@example.invalid',
    role: 'authenticated', aud: 'authenticated', exp: expired ? 1 : now + 3600,
  })}.invalid-fixture-signature`;
  const value = { access_token: jwt, refresh_token: 'invalid-fixture-refresh-token', token_type: 'bearer', expires_in: expired ? 1 : 3600, expires_at: expired ? 1 : now + 3600 };
  return `sb-${authProject}-auth-token=base64-${json64(value)}`;
}

export async function runHttpVerification() {
const results = [];
let activeCheck = 'configuration';
let activeStatus = null;
const started = performance.now();
let activeStarted = started;
try {
  const { base, authProject, mode } = resolveHttpTestConfig();
  const markers = privateMarkers();
  async function request(name, pathname, { cookie, method = 'GET', status, gate = false, body: requestBody } = {}) {
    activeCheck = name;
    activeStarted = performance.now(); activeStatus = null;
    const response = await fetch(new URL(pathname, base), {
      method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(requestBody === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(requestBody === undefined ? {} : { body: requestBody }), redirect: 'manual', signal: AbortSignal.timeout(25000),
    });
    activeStatus = response.status;
    const body = await response.text();
    check(response.status === status, `${name}: unexpected HTTP status`);
    check(/private/.test(response.headers.get('cache-control') || '') && /no-store/.test(response.headers.get('cache-control') || ''), `${name}: missing cache protection`);
    check(/noindex/.test(response.headers.get('x-robots-tag') || ''), `${name}: missing indexing protection`);
    check(response.headers.get('referrer-policy') === 'no-referrer', `${name}: missing referrer protection`);
    check(!containsPrivateMarker(body, markers), `${name}: private marker in denied output`);
    check(!body.includes('crm_web.nydmouxljprsfymcvqko') && !body.includes('crm_agent.nydmouxljprsfymcvqko'), `${name}: database identity exposed`);
    if (gate) check(body.includes('Sign in to your workspace') && !body.includes('crm-stat-grid'), `${name}: missing signed-out gate`);
    if (status === 401 && method !== 'HEAD') check(JSON.parse(body).error === 'Sign-in required', `${name}: unexpected denial payload`);
    results.push({ name, status: response.status, duration_ms: Math.round(performance.now() - activeStarted), private_headers: true, private_markers_absent: true });
  }
  for (const [name, pathname] of [
    ['today', '/internal/crm'], ['relationships', '/internal/crm/relationships?q=fixture-private-query'],
    ['nested_contact', '/internal/crm/contacts/TEST-NOT-A-RECORD'],
  ]) await request(`anonymous_${name}`, pathname, { status: 200, gate: true });
  for (const [name, pathname] of [
    ['today_api', '/api/internal/crm/today'], ['relationships_api', '/api/internal/crm/relationships?q=%27%3BSELECT'],
    ['nested_contact_api', '/api/internal/crm/contacts/TEST-NOT-A-RECORD'],
  ]) await request(`anonymous_${name}`, pathname, { status: 401 });
  for (const [name, body] of [['valid', '{"query":"synthetic-private-search"}'], ['malformed', '{'], ['oversize', 'x'.repeat(9000)]]) {
    await request(`anonymous_search_post_${name}`, '/api/internal/crm/relationships', { method: 'POST', body, status: 401 });
  }
  await request('anonymous_head_api', '/api/internal/crm/today', { method: 'HEAD', status: 401 });
  await request('write_method_rejected', '/api/internal/crm/today', { method: 'POST', status: 405 });
  await request('unknown_nested_route', '/internal/crm/unknown.svg', { status: 404 });
  for (const [name, cookie] of [['invalid_session', sessionCookie(authProject)], ['expired_session', sessionCookie(authProject, true)]]) {
    await request(`${name}_page`, '/internal/crm', { cookie, status: 200, gate: true });
    await request(`${name}_api`, '/api/internal/crm/today', { cookie, status: 401 });
    await request(`${name}_search_post`, '/api/internal/crm/relationships', { cookie, method: 'POST', body: '{"query":"synthetic-private-search"}', status: 401 });
  }
  console.log(JSON.stringify({ status: 'passed', mode, auth_project_ref: authProject, duration_ms: Math.round(performance.now() - started), checks: results }));
} catch {
  // Responses and auth/network errors can include private values. Log only the
  // number of completed checks, never response bodies, cookies, tokens or URLs.
  console.error(JSON.stringify({ status: 'failed', check: activeCheck, http_status: activeStatus, duration_ms: Math.round(performance.now() - activeStarted), checks_completed: results.length, checks: results, message: 'HTTP verification stopped; inspect the server without logging response bodies or credentials.' }));
  process.exitCode = 1;
}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runHttpVerification();
