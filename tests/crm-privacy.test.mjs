import test from 'node:test';
import assert from 'node:assert/strict';
import { safeLocalPath, approvedIdeCallback, isPrivateWebsiteUrl, publicAnalyticsEvent } from '../lib/site-privacy.mjs';

test('sign-in returns to a same-origin CRM path and preserves its query', () => {
  assert.equal(safeLocalPath('/internal/crm/relationships?q=Elsewhere&stage=proposed'),
    '/internal/crm/relationships?q=Elsewhere&stage=proposed');
  assert.equal(safeLocalPath('/auth/ide-complete?state=some-state'), '/auth/ide-complete?state=some-state');
});

test('sign-in return rejects URL parser tricks and encoded external separators', () => {
  for (const value of [
    'https://outside.invalid/', '//outside.invalid/', '/\\outside.invalid/',
    '/%5coutside.invalid/', '/%2foutside.invalid/', '/%255coutside.invalid/',
    '/\n/outside.invalid/', '/%0a/outside.invalid/', '/%250a/outside.invalid/',
    '/%00', '/%', 'javascript:alert(1)', null, undefined,
  ]) assert.equal(safeLocalPath(value), '/', String(value));
});

const IDE_STATE = 'd5de86e3-4222-4376-9c12-744c2176c924';
test('desktop IDE callbacks preserve the existing exact extension route and random UUID state', () => {
  for (const scheme of ['vscode', 'vscode-insiders', 'cursor']) {
    const value = `${scheme}://ArcaneForgeAI.arcane-forge-vscode-extension/auth/callback`;
    const url = approvedIdeCallback(value, IDE_STATE);
    assert.ok(url, scheme);
    url.searchParams.set('access_token', 'fixture-token-never-valid');
    url.searchParams.set('state', IDE_STATE);
    assert.equal(url.searchParams.get('state'), IDE_STATE);
    assert.equal(url.searchParams.get('access_token'), 'fixture-token-never-valid');
  }
});

test('IDE callbacks reject arbitrary destinations before any session token is read', () => {
  for (const value of [
    'https://outside.invalid/callback', 'javascript:alert(1)',
    'https://vscode.dev/redirect?url=https://outside.invalid',
    'vscode://other.extension/auth/callback',
    'vscode://arcaneforgeai.arcane-forge-vscode-extension.outside.invalid/auth/callback',
    'vscode://arcaneforgeai.arcane-forge-vscode-extension/other',
    'vscode://arcaneforgeai.arcane-forge-vscode-extension/auth/callback?redirect=https://outside.invalid',
    'vscode://arcaneforgeai.arcane-forge-vscode-extension/auth/callback#private',
    'vscode://user@arcaneforgeai.arcane-forge-vscode-extension/auth/callback',
    'vscode://arcaneforgeai.arcane-forge-vscode-extension:42/auth/callback',
    'vscode://arcaneforgeai.arcane-forge-vscode-extension/auth/../auth/callback',
  ]) assert.equal(approvedIdeCallback(value, IDE_STATE), null, value);
  const valid = 'vscode://arcaneforgeai.arcane-forge-vscode-extension/auth/callback';
  for (const state of ['', null, 'attacker-chosen-state', '00000000-0000-0000-0000-000000000000']) {
    assert.equal(approvedIdeCallback(valid, state), null);
  }
});

test('analytics omits internal, nested, API and authentication locations', () => {
  for (const path of ['/internal', '/internal/crm', '/internal/crm/contacts/CONTACT',
    '/api/internal/crm/relationships?q=private', '/login?next=%2Finternal%2Fcrm',
    '/auth/callback?code=private', '/%69nternal/crm', '/INTERNAL/crm', '/%invalid']) {
    assert.equal(isPrivateWebsiteUrl(path), true, path);
    assert.equal(publicAnalyticsEvent({ type: 'pageview', url: path }, 'https://www.arcaneforge.ai/'), null, path);
  }
  assert.equal(isPrivateWebsiteUrl('/internality'), false);
  assert.equal(isPrivateWebsiteUrl('/ai-services'), false);
});

test('persistent analytics filter blocks route transition races in both directions', () => {
  const privateUrl = 'https://www.arcaneforge.ai/internal/crm/relationships?q=person%40example.invalid';
  const publicUrl = 'https://www.arcaneforge.ai/ai-services';
  assert.equal(publicAnalyticsEvent({ type: 'pageview', url: publicUrl }, privateUrl), null);
  assert.equal(publicAnalyticsEvent({ type: 'pageview', url: privateUrl }, publicUrl), null);
  assert.equal(publicAnalyticsEvent({ type: 'event', url: publicUrl }, privateUrl), null);
});

test('public analytics never includes query strings, hashes, custom data, or off-origin URLs', () => {
  const currentUrl = 'https://www.arcaneforge.ai/ai-services?email=private#private';
  assert.deepEqual(publicAnalyticsEvent({ type: 'pageview', url: currentUrl }, currentUrl),
    { type: 'pageview', url: 'https://www.arcaneforge.ai/ai-services' });
  assert.equal(publicAnalyticsEvent({ type: 'event', url: currentUrl, data: { email: 'private' } }, currentUrl), null);
  assert.equal(publicAnalyticsEvent({ type: 'pageview', url: 'https://outside.invalid/' }, currentUrl), null);
  assert.equal(publicAnalyticsEvent({ type: 'pageview', url: currentUrl }, null), null);
});
