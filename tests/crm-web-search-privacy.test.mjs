import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { NextRequest, NextResponse } from 'next/server.js';
import { validateWebRead, CrmReadError } from '../lib/crm/reader.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
// Execute the original TypeScript handler with explicit test-only Auth/data
// dependencies. No production source, user, session, table or route is altered.
function originalModule(relative, dependencies, globals = {}) {
  const file = path.join(ROOT, relative);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require(name) { if (Object.hasOwn(dependencies, name)) return dependencies[name]; throw Error(`Unexpected test dependency: ${name}`); },
    URL, URLSearchParams, Request, Response, Headers, ReadableStream, TextEncoder, TextDecoder, AbortController,
    setTimeout, clearTimeout, console: { log() { throw Error('Private route must not log'); }, error() { throw Error('Private route must not log'); } },
    ...globals,
  }, { filename: file });
  return module.exports;
}

function handler(access = 'allowed', readError = null) {
  const dataReads = [];
  let authChecks = 0;
  const response = originalModule('app/api/internal/crm/response.ts', {
    'next/server': { NextResponse },
    '@/lib/crm/auth': { async getCrmAccess() { authChecks += 1; return { status: access }; } },
  });
  const route = originalModule('app/api/internal/crm/relationships/route.ts', {
    'next/server': { NextRequest, NextResponse },
    '@/lib/crm/data': { async readCrmRelationships(args) {
      // The real data helper repeats reader validation before connecting.
      validateWebRead('relationships', args);
      dataReads.push(JSON.parse(JSON.stringify(args)));
      if (readError) throw readError;
      return { contacts: [], total: 0, limit: args.limit || 12, offset: args.offset || 0, next_offset: null, filter_options: { stages: [], relationship_types: [] } };
    } },
    '@/lib/crm/reader.mjs': { validateWebRead, CrmReadError },
    '../response': response,
  });
  return { route, dataReads, authChecks: () => authChecks };
}
const endpoint = 'http://fixture.invalid/api/internal/crm/relationships';
function post(body = '{}', headers = {}) {
  return new NextRequest(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
}
async function safeError(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('cache-control'), /private/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  const body = await response.text();
  assert.ok(!body.includes('sensitive-fixture'));
  assert.deepEqual(Object.keys(JSON.parse(body)), ['error']);
}

test('relationship search authorizes before inspecting any request body or query values', async () => {
  for (const [access, expected] of [['unauthenticated', 401], ['forbidden', 403], ['unconfigured', 503]]) {
    for (const method of ['GET', 'POST']) {
      const { route, dataReads, authChecks } = handler(access);
      const request = new Proxy({}, { get() { throw Error('Denied requests must not be inspected'); } });
      await safeError(await route[method](request), expected);
      assert.equal(authChecks(), 1);
      assert.equal(dataReads.length, 0);
    }
  }
});

test('authorized POST validates private search fields and forwards them only as read arguments', async () => {
  const { route, dataReads } = handler();
  const query = "sensitive-fixture@example.invalid'; SELECT unrelated --";
  const args = { query, relationship_type: 'pilot_prospect', stage: 'proposed', response_state: 'unknown', limit: 12, offset: 24 };
  const response = await route.POST(post(JSON.stringify(args)));
  assert.equal(response.status, 200);
  assert.deepEqual(dataReads, [args]);
  assert.ok(!(await response.text()).includes(query));
});

test('malformed, nonobject, unsupported and out-of-range search bodies fail before any data read', async () => {
  const invalid = ['{', 'null', '[]', '"sensitive-fixture"',
    JSON.stringify({ query: 'sensitive-fixture', actor: 'unsupported' }),
    JSON.stringify({ query: 'q'.repeat(501) }), JSON.stringify({ query: null }),
    JSON.stringify({ limit: 0 }), JSON.stringify({ limit: 101 }), JSON.stringify({ offset: -1 }),
    JSON.stringify({ relationship_type: 'admin' }), JSON.stringify({ response_state: 'no_reply' }),
    JSON.stringify({ query: 'sensitive-fixture\0' })];
  for (const body of invalid) {
    const { route, dataReads } = handler();
    await safeError(await route.POST(post(body)), 400);
    assert.equal(dataReads.length, 0);
  }
});

test('search rejects non-JSON media, oversized declared or streamed bodies and all POST URL parameters', async () => {
  const cases = [
    [post('{}', { 'Content-Type': 'text/plain' }), 415],
    [post('{}', { 'Content-Length': '8193' }), 413],
    [post(JSON.stringify({ query: 'é'.repeat(4100) })), 413],
    [new NextRequest(`${endpoint}?q=sensitive-fixture`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }), 400],
  ];
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('{"query":"'));
    controller.enqueue(new TextEncoder().encode('sensitive-fixture'.repeat(600)));
    controller.enqueue(new TextEncoder().encode('"}')); controller.close();
  } });
  cases.push([new NextRequest(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: stream, duplex: 'half' }), 413]);
  for (const [request, status] of cases) {
    const { route, dataReads } = handler();
    await safeError(await route.POST(request), status);
    assert.equal(dataReads.length, 0);
  }
});

test('GET search cannot accept private query or filter values; safe pagination remains bounded', async () => {
  for (const suffix of ['?q=sensitive-fixture', '?query=sensitive-fixture', '?stage=sensitive-fixture', '?role=partner', '?response=unknown', '?limit=101', '?offset=-1']) {
    const { route, dataReads } = handler();
    await safeError(await route.GET(new NextRequest(`${endpoint}${suffix}`)), 400);
    assert.equal(dataReads.length, 0);
  }
  const { route, dataReads } = handler();
  assert.equal((await route.GET(new NextRequest(`${endpoint}?limit=12&offset=12`))).status, 200);
  assert.deepEqual(dataReads, [{ limit: 12, offset: 12 }]);
});

test('underlying search errors never expose private query text or driver details', async () => {
  const { route } = handler('allowed', Error('sensitive-fixture: private database driver detail'));
  await safeError(await route.POST(post(JSON.stringify({ query: 'sensitive-fixture' }))), 503);
});

const fixtureData = {
  contacts: [{ contact_id: 'FIXTURE-CONTACT', organization: 'Sensitive Fixture Organization', person: null,
    channel: 'email', address: 'sensitive-fixture@example.invalid', response_state: 'unknown', relationships: [], last_sent_at: null }],
  total: 25, limit: 12, offset: 0, next_offset: 12,
  filter_options: { stages: ['proposed'], relationship_types: ['pilot_prospect'] },
};
const jsx = (type, props) => ({ type, props: props || {} });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: 'fragment' };
const ui = { label: value => value, timestamp: value => value, contactPath: value => `/internal/crm/contacts/${value}`,
  Empty: 'Empty', PrivateLink: 'PrivateLink', Status: 'Status', CrmGate: 'CrmGate', CrmShell: 'CrmShell', CrmUnavailable: 'CrmUnavailable', PageHeading: 'PageHeading' };
function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
function browser(responseStatus = 200) {
  const hooks = [], calls = [];
  let cursor = 0, forbiddenBrowserEffects = 0;
  const forbidden = () => { forbiddenBrowserEffects += 1; throw Error('Private search must not write URL/history/storage'); };
  const stateHook = initial => {
    const index = cursor++;
    if (!(index in hooks)) hooks[index] = initial;
    return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
  };
  const react = {
    useState: stateHook,
    useRef: initial => { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; },
    useEffect: () => { cursor++; },
  };
  const component = originalModule('components/crm/RelationshipsBrowser.tsx', {
    react, 'react/jsx-runtime': jsxRuntime, './ui': ui,
  }, {
    window: { history: { pushState: forbidden, replaceState: forbidden }, localStorage: new Proxy({}, { get: () => forbidden }), sessionStorage: new Proxy({}, { get: () => forbidden }) },
    localStorage: new Proxy({}, { get: () => forbidden }), sessionStorage: new Proxy({}, { get: () => forbidden }),
    history: { pushState: forbidden, replaceState: forbidden },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const args = JSON.parse(options.body);
      return { status: responseStatus, ok: responseStatus === 200, async json() { return { ...fixtureData, offset: args.offset, next_offset: args.offset === 0 ? 12 : 24 }; } };
    },
  }).default;
  return {
    calls, forbiddenEffects: () => forbiddenBrowserEffects,
    render() { cursor = 0; return component({ initialData: fixtureData }); },
    async settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); },
  };
}

test('original search UI keeps private filters and pagination out of fetch URLs, links, history and storage', async () => {
  const client = browser();
  let tree = client.render();
  const filters = { 'crm-search': 'sensitive-fixture@example.invalid', 'crm-role': 'pilot_prospect', 'crm-stage': 'proposed', 'crm-response': 'unknown' };
  for (const [id, value] of Object.entries(filters)) {
    nodes(tree, node => node.props?.id === id)[0].props.onChange({ target: { value } });
    tree = client.render();
  }
  const form = nodes(tree, node => node.type === 'form')[0];
  assert.equal(form.props.method, 'post');
  assert.equal(form.props.action, '/internal/crm/relationships');
  let prevented = false;
  form.props.onSubmit({ preventDefault() { prevented = true; } });
  await client.settle(); tree = client.render();
  assert.equal(prevented, true);
  nodes(tree, node => node.type === 'button' && node.props.children === 'Next →')[0].props.onClick();
  await client.settle(); tree = client.render();
  assert.equal(client.calls.length, 2);
  for (let index = 0; index < client.calls.length; index++) {
    const { url, options } = client.calls[index];
    assert.equal(url, '/api/internal/crm/relationships');
    assert.equal(options.method, 'POST');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { query: filters['crm-search'], relationship_type: 'pilot_prospect', stage: 'proposed', response_state: 'unknown', limit: 12, offset: index * 12 });
  }
  for (const node of nodes(tree, node => node.props?.href || node.props?.action)) {
    const url = node.props.href || node.props.action;
    assert.ok(!url.includes('sensitive-fixture') && !url.includes('query=') && !url.includes('q='));
  }
  assert.equal(client.forbiddenEffects(), 0);
});

test('original search UI removes displayed contacts and private filters on a later authorization denial', async () => {
  for (const status of [401, 403]) {
    const client = browser(status);
    let tree = client.render();
    assert.ok(JSON.stringify(tree).includes('sensitive-fixture@example.invalid'));
    nodes(tree, node => node.props?.id === 'crm-search')[0].props.onChange({ target: { value: 'sensitive-fixture search' } });
    tree = client.render();
    nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    await client.settle(); tree = client.render();
    const displayed = JSON.stringify(tree);
    assert.ok(!displayed.includes('sensitive-fixture') && !displayed.includes('Sensitive Fixture Organization'));
    assert.ok(displayed.includes(status === 401 ? 'Sign in to continue' : 'Internal access required'));
    assert.equal(client.forbiddenEffects(), 0);
  }
});

test('original SSR Relationships page ignores incoming private query strings and guards its initial read', async () => {
  for (const access of ['allowed', 'unauthenticated', 'forbidden']) {
    const reads = [];
    const page = originalModule('app/internal/crm/relationships/page.tsx', {
      'react/jsx-runtime': jsxRuntime,
      '@/lib/crm/auth': { async getCrmAccess() { return { status: access }; } },
      '@/lib/crm/data': { async readCrmRelationships(args) { reads.push(JSON.parse(JSON.stringify(args))); return fixtureData; } },
      '@/components/crm/RelationshipsBrowser': { __esModule: true, default: 'RelationshipsBrowser' },
      '@/components/crm/ui': ui,
    }).default;
    await page(new Proxy({}, { get() { throw Error('SSR must not inspect or reflect old search URL parameters'); } }));
    assert.deepEqual(reads, access === 'allowed' ? [{ limit: 12, offset: 0 }] : []);
  }
});
