// Shared browser/Edge helpers. Never import database configuration here.
const LOCAL_ORIGIN = 'https://local.invalid';

/** Accept only an ordinary same-origin path for the website sign-in return. */
export function safeLocalPath(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  let decoded = value;
  try {
    // Reject encoded variants as well as literal URL-parser separators.
    for (let pass = 0; pass < 3; pass += 1) {
      if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith('//')) return fallback;
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith('//')) return fallback;
    const url = new URL(value, LOCAL_ORIGIN);
    return url.origin === LOCAL_ORIGIN ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}

/**
 * Matches the checked Arcane Forge extension's desktop UriHandler. HTTPS
 * redirects and web/remote wrappers require a reviewed code-exchange flow.
 */
export function approvedIdeCallback(value, state) {
  if (typeof value !== 'string' || !/^(?:vscode|vscode-insiders|cursor):\/\/arcaneforgeai\.arcane-forge-vscode-extension\/auth\/callback$/i.test(value) ||
      typeof state !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(state)) return null;
  try {
    const url = new URL(value);
    if (!['vscode:', 'vscode-insiders:', 'cursor:'].includes(url.protocol) ||
        url.hostname.toLowerCase() !== 'arcaneforgeai.arcane-forge-vscode-extension' ||
        url.pathname !== '/auth/callback' || url.username || url.password || url.port || url.search || url.hash) return null;
    return url;
  } catch { return null; }
}

/** Internal content and all authentication URLs stay out of marketing analytics. */
export function isPrivateWebsiteUrl(value) {
  try {
    const url = new URL(value, LOCAL_ORIGIN);
    let pathname = decodeURIComponent(url.pathname).replace(/\\/g, '/').toLowerCase();
    return ['/internal', '/api/internal', '/login', '/auth'].some(prefix =>
      pathname === prefix || pathname.startsWith(`${prefix}/`));
  } catch { return true; }
}

/**
 * The current location check also protects SPA transitions after the analytics
 * script was loaded on a public page. Query strings and hashes are never sent.
 */
export function publicAnalyticsEvent(event, currentUrl) {
  try {
    if (!currentUrl || isPrivateWebsiteUrl(currentUrl) || !event || event.type !== 'pageview' ||
        isPrivateWebsiteUrl(event.url)) return null;
    const current = new URL(currentUrl);
    const url = new URL(event.url, current);
    if (url.origin !== current.origin) return null;
    return { type: event.type, url: `${url.origin}${url.pathname}` };
  } catch { return null; }
}

export const PRIVATE_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};
