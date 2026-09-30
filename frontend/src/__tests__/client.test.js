/**
 * client.test.js
 *
 * Tests for the single-flight refresh interceptor in api/client.js.
 *
 * Strategy: We use the real axios + real interceptors, but stub the HTTP
 * adapter so no real network calls happen.  This lets us exercise the actual
 * interceptor logic faithfully.
 *
 * Coverage:
 *  - valid access token → request passes through
 *  - expired access token (TOKEN_EXPIRED) → refresh → retry → success
 *  - invalid token (TOKEN_INVALID) → no refresh, error propagated
 *  - failed refresh → auth:logout event dispatched, error propagated
 *  - multiple simultaneous 401s → only ONE refresh call made
 *  - no infinite refresh loop (already-retried request not retried again)
 *  - /auth/refresh itself returning 401 → no recursive refresh
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── shared state accessible by the adapter ──────────────────────────────────
// We use a simple queue: each call to the fake adapter pops from handlers[].
let handlers = [];
const pushHandler = (fn) => handlers.push(fn);
const clearHandlers = () => { handlers = []; };

// ─── mock axios ──────────────────────────────────────────────────────────────
// We mock the axios module so that axios.create() returns an instance that
// uses our handler queue as its adapter.
vi.mock('axios', async (importOriginal) => {
  const actualAxios = await importOriginal();

  // Factory that builds an axios instance with a custom adapter
  const create = (defaults) => {
    const instance = actualAxios.create({
      ...defaults,
      adapter: async (config) => {
        const handler = handlers.shift();
        if (!handler) throw new Error(`No handler registered for ${config.url}`);
        const result = await handler(config);
        if (result instanceof Error || result?.isAxiosError) throw result;
        return result;
      },
    });
    return instance;
  };

  return { default: { ...actualAxios, create } };
});

// ─── helper: create an AxiosError-like rejection ─────────────────────────────
function makeAxiosError(status, data, config = {}) {
  const err = new Error('Request failed with status code ' + status);
  err.isAxiosError = true;
  err.response = { status, data, config };
  err.config = config;
  return err;
}

// ─── test constants ───────────────────────────────────────────────────────────
const SUCCESS_DATA = { success: true, data: { sessions: [] } };
const NEW_TOKEN = 'new_access_token_xyz';
const REFRESH_SUCCESS = { status: 200, data: { success: true, data: { token: NEW_TOKEN } } };

// ─── module under test ────────────────────────────────────────────────────────
let client;
let setAccessToken;
let clearAccessToken;
let getAccessToken;

beforeEach(async () => {
  vi.resetModules();
  clearHandlers();

  const mod = await import('../api/client.js');
  client = mod.default;
  setAccessToken = mod.setAccessToken;
  clearAccessToken = mod.clearAccessToken;
  getAccessToken = mod.getAccessToken;
});

afterEach(() => {
  clearAccessToken();
  clearHandlers();
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
describe('Request interceptor', () => {
  it('attaches Bearer token when access token is set', async () => {
    setAccessToken('my_token');

    let capturedConfig;
    pushHandler((cfg) => { capturedConfig = cfg; return { status: 200, data: SUCCESS_DATA }; });

    await client.get('/sessions');
    expect(capturedConfig.headers.Authorization).toBe('Bearer my_token');
  });

  it('omits Authorization header when no token is set', async () => {
    clearAccessToken();
    let capturedConfig;
    pushHandler((cfg) => { capturedConfig = cfg; return { status: 200, data: SUCCESS_DATA }; });

    await client.get('/sessions');
    expect(capturedConfig.headers?.Authorization).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('Response interceptor — 401 handling', () => {
  it('passes non-401 errors through without refreshing', async () => {
    pushHandler((cfg) => makeAxiosError(500, { message: 'Server error' }, cfg));

    await expect(client.get('/sessions')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('does NOT refresh on TOKEN_INVALID — propagates error', async () => {
    pushHandler((cfg) =>
      makeAxiosError(401, { code: 'TOKEN_INVALID', message: 'Bad token' }, cfg),
    );

    await expect(client.get('/sessions')).rejects.toMatchObject({
      response: { status: 401 },
    });
    // handlers should be empty — no refresh call was made
    expect(handlers.length).toBe(0);
  });

  it('refreshes on TOKEN_EXPIRED, updates token, retries original request', async () => {
    setAccessToken('old_token');

    // 1st call → 401 TOKEN_EXPIRED
    pushHandler((cfg) =>
      makeAxiosError(401, { code: 'TOKEN_EXPIRED', message: 'Expired' }, cfg),
    );
    // refresh endpoint
    pushHandler(() => REFRESH_SUCCESS);
    // retry of original request
    pushHandler(() => ({ status: 200, data: SUCCESS_DATA }));

    const result = await client.get('/sessions');
    expect(result.status).toBe(200);
    expect(getAccessToken()).toBe(NEW_TOKEN);
  });

  it('does NOT retry a request already marked _retried', async () => {
    // Simulate a request that has already been retried
    pushHandler((cfg) =>
      makeAxiosError(401, { code: 'TOKEN_EXPIRED', message: 'Expired' }, cfg),
    );

    await expect(
      client.get('/sessions', { _retried: true }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    // No extra handler consumed = no refresh attempted
    expect(handlers.length).toBe(0);
  });

  it('does NOT refresh when the failing request is /auth/refresh', async () => {
    pushHandler((cfg) =>
      makeAxiosError(401, { code: 'TOKEN_EXPIRED', message: 'Expired' }, cfg),
    );

    await expect(client.post('/auth/refresh')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(handlers.length).toBe(0);
  });

  it('dispatches auth:logout event and clears token when refresh fails', async () => {
    const events = [];
    const listener = () => events.push('auth:logout');
    window.addEventListener('auth:logout', listener);

    setAccessToken('some_token');

    // Original request → expired
    pushHandler((cfg) =>
      makeAxiosError(401, { code: 'TOKEN_EXPIRED', message: 'Expired' }, cfg),
    );
    // Refresh itself fails
    pushHandler((cfg) =>
      makeAxiosError(401, { code: 'TOKEN_INVALID', message: 'Bad refresh' }, cfg),
    );

    await expect(client.get('/sessions')).rejects.toBeDefined();
    await new Promise((r) => setTimeout(r, 0)); // flush microtasks

    expect(events).toContain('auth:logout');
    expect(getAccessToken()).toBeNull();

    window.removeEventListener('auth:logout', listener);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('Single-flight refresh — concurrent 401s', () => {
  it('issues only ONE refresh request when multiple 401s arrive simultaneously', async () => {
    let refreshCount = 0;

    // We start all 3 requests "simultaneously".
    // Each will immediately get a 401 TOKEN_EXPIRED from the adapter.
    // Then ONE refresh call should happen, then each retry resolves.

    // Queue 3 expired errors for the initial requests
    const expiredHandler = (cfg) =>
      makeAxiosError(401, { code: 'TOKEN_EXPIRED', message: 'Expired' }, cfg);
    pushHandler(expiredHandler);
    pushHandler(expiredHandler);
    pushHandler(expiredHandler);

    // Queue 1 refresh success (with a tiny delay to allow all three retries to queue up)
    pushHandler(() => {
      refreshCount++;
      return new Promise((resolve) => setTimeout(() => resolve(REFRESH_SUCCESS), 20));
    });

    // Queue 3 retry successes
    pushHandler(() => ({ status: 200, data: { which: 'A' } }));
    pushHandler(() => ({ status: 200, data: { which: 'B' } }));
    pushHandler(() => ({ status: 200, data: { which: 'C' } }));

    const [r1, r2, r3] = await Promise.all([
      client.get('/sessions'),
      client.get('/exercises'),
      client.get('/goals'),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);
    expect(refreshCount).toBe(1); // single-flight: only one refresh
  });
});
