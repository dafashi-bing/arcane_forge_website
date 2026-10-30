import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHttpTestConfig, sessionCookie } from '../scripts/crm-web-test-http.mjs';

test('HTTP verification defaults to loopback with the confirmed website Auth namespace', () => {
  const config = resolveHttpTestConfig(['--verify'], {});
  assert.equal(config.base.origin, 'http://127.0.0.1:3040');
  assert.equal(config.authProject, 'wdoiouwzfutdtmdsdgkr');
  assert.equal(config.mode, 'loopback');
  assert.equal(resolveHttpTestConfig(['--verify'], { CRM_HTTP_TEST_URL: 'http://localhost:4040', CRM_HTTP_TEST_AUTH_PROJECT_REF: 'nydmouxljprsfymcvqko' }).authProject, 'nydmouxljprsfymcvqko');
});

test('default verification cannot target a remote origin or carry URL credentials or query data', () => {
  for (const target of ['https://www.arcaneforge.ai', 'http://outside.invalid', 'http://localhost:3040/path',
    'http://user:secret@localhost:3040', 'http://localhost:3040?token=private', 'http://localhost:3040#private']) {
    assert.throws(() => resolveHttpTestConfig(['--verify'], { CRM_HTTP_TEST_URL: target }));
  }
  for (const args of [[], ['--verify', 'extra'], ['--url'], ['--verify-production', 'extra']]) assert.throws(() => resolveHttpTestConfig(args, {}));
});

test('production verification accepts only the exact approved HTTPS origin and real Auth project', () => {
  const config = resolveHttpTestConfig(['--verify-production'], {});
  assert.equal(config.base.origin, 'https://www.arcaneforge.ai');
  assert.equal(config.authProject, 'wdoiouwzfutdtmdsdgkr');
  assert.equal(config.mode, 'production');
  for (const target of ['http://www.arcaneforge.ai', 'https://arcaneforge.ai', 'https://www.arcaneforge.ai.outside.invalid',
    'https://outside.invalid', 'http://127.0.0.1:3040', 'https://www.arcaneforge.ai:444', 'https://www.arcaneforge.ai/path']) {
    assert.throws(() => resolveHttpTestConfig(['--verify-production'], { CRM_HTTP_TEST_URL: target }));
  }
  assert.throws(() => resolveHttpTestConfig(['--verify-production'], { CRM_HTTP_TEST_AUTH_PROJECT_REF: 'nydmouxljprsfymcvqko' }));
});

test('fixture cookies use the configured namespace and remain deliberately forged or expired', () => {
  for (const expired of [false, true]) {
    const cookie = sessionCookie('wdoiouwzfutdtmdsdgkr', expired);
    assert.ok(cookie.startsWith('sb-wdoiouwzfutdtmdsdgkr-auth-token=base64-'));
    const stored = JSON.parse(Buffer.from(cookie.split('=base64-')[1], 'base64url').toString('utf8'));
    const [header, payload, signature] = stored.access_token.split('.');
    assert.equal(signature, 'invalid-fixture-signature');
    assert.equal(stored.refresh_token, 'invalid-fixture-refresh-token');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    assert.equal(claims.sub, '83470b31-9624-4d49-8b9e-78c430f63001');
    assert.equal(claims.email, 'owner@example.invalid');
    assert.equal(expired ? claims.exp === 1 : claims.exp > Date.now() / 1000, true);
  }
  for (const ref of ['', 'arbitrary', 'wdoiouwzfutdtmdsdgkr;other-cookie=bad']) assert.throws(() => sessionCookie(ref));
});
