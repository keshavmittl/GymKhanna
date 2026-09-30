/**
 * api/client.js
 *
 * Central Axios instance with:
 *  - Automatic Bearer-token attachment from in-memory store
 *  - Single-flight refresh on 401 TOKEN_EXPIRED responses
 *  - Retry of the original request after a successful refresh
 *  - Logout + redirect when the refresh itself fails
 *
 * IMPORTANT: the access token is kept in memory (module-level variable),
 * NOT in localStorage, to reduce XSS exposure.  The HttpOnly refresh-token
 * cookie is sent automatically by the browser on /auth/refresh requests
 * thanks to `withCredentials: true`.
 */
import axios from 'axios';

// ─── in-memory access token ───────────────────────────────────────────────────
// Exported so AuthContext can set/clear it without going through localStorage.
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;
export const clearAccessToken = () => { _accessToken = null; };

// ─── axios instance ───────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,    // sends the HttpOnly refresh-token cookie
});

// ─── single-flight refresh state ─────────────────────────────────────────────
// If multiple requests receive 401 simultaneously, only ONE refresh call is
// made.  Other callers wait for the same promise to resolve.
let _refreshPromise = null;

const doRefresh = () => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = client
    .post('/auth/refresh')
    .then((res) => {
      const newToken = res.data?.data?.token;
      if (!newToken) throw new Error('No token in refresh response');
      setAccessToken(newToken);
      return newToken;
    })
    .catch((err) => {
      // Refresh failed → clear everything and send user to login.
      clearAccessToken();
      // Dispatch a custom event so AuthContext can clear user state without
      // a circular import.
      window.dispatchEvent(new Event('auth:logout'));
      throw err;
    })
    .finally(() => {
      _refreshPromise = null;   // reset so the next expiry triggers a fresh call
    });

  return _refreshPromise;
};

// ─── request interceptor — attach access token ───────────────────────────────
client.interceptors.request.use((config) => {
  const token = _accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── response interceptor — handle 401 ───────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 responses with a TOKEN_EXPIRED code.
    // Do NOT refresh on:
    //   - TOKEN_INVALID  (bad/tampered token — logging in again is correct)
    //   - /auth/refresh itself (avoid infinite loop)
    //   - requests that have already been retried once
    const isExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED';

    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
    const alreadyRetried = originalRequest._retried;

    if (!isExpired || isRefreshEndpoint || alreadyRetried) {
      return Promise.reject(error);
    }

    // Mark so we don't retry twice.
    originalRequest._retried = true;

    try {
      const newToken = await doRefresh();
      // Update the Authorization header on the original request and retry.
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return client(originalRequest);
    } catch {
      // doRefresh already dispatched auth:logout — just propagate the error.
      return Promise.reject(error);
    }
  },
);

export default client;