// Opt-in server Auth transport. One deadline covers headers, body and any
// subsequent request from this client. Native fetch is actually aborted.
export function createDeadlineFetch(timeoutMs, fetchImpl = globalThis.fetch) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new RangeError('Invalid Auth verification timeout.');
  const deadline = Date.now() + timeoutMs;
  const unavailable = () => new Response(JSON.stringify({ message: 'Auth verification is temporarily unavailable.', code: 'auth_verification_unavailable' }), {
    status: 408, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  return async (input, init = {}) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return unavailable();
    const controller = new AbortController();
    const originalSignal = init.signal !== undefined ? init.signal : (input instanceof Request ? input.signal : undefined);
    const abortFromCaller = () => controller.abort(originalSignal.reason);
    if (originalSignal?.aborted) abortFromCaller();
    else originalSignal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => controller.abort(new DOMException('Auth verification timed out.', 'TimeoutError')), remaining);
    try {
      const response = await fetchImpl(input, { ...init, cache: 'no-store', signal: controller.signal });
      // Reading the small Auth response here keeps the real network abort active
      // through JSON delivery; clearing the timer at headers would leave a hang.
      const body = await response.arrayBuffer();
      if (controller.signal.aborted || [404, 502, 503, 504].includes(response.status)) return unavailable();
      const headers = new Headers(response.headers);
      headers.delete('content-encoding'); headers.delete('content-length');
      headers.set('Cache-Control', 'no-store');
      return new Response([204, 205, 304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers });
    } catch {
      // Auth-js retries thrown fetch errors and 502/503/504 for up to 30 seconds.
      // A generic non-retryable error response makes verification fail closed at
      // this deadline without exposing upstream errors or retaining network work.
      return unavailable();
    } finally {
      clearTimeout(timer);
      originalSignal?.removeEventListener('abort', abortFromCaller);
    }
  };
}
