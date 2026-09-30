/**
 * AuthContext.jsx
 *
 * Changes from the original:
 *  - Access token is stored in memory via setAccessToken() (not localStorage).
 *  - On mount we attempt a silent token refresh using the HttpOnly cookie
 *    instead of reading from localStorage.  Success → fetch /auth/me to
 *    hydrate the user object.  Failure → stay logged-out.
 *  - login / signup store the returned access token in memory.
 *  - logout calls POST /auth/logout to revoke the server-side refresh session,
 *    then clears in-memory token and user state.
 *  - A window 'auth:logout' event listener drives forced-logout when the API
 *    interceptor detects a failed refresh (avoids circular imports with
 *    client.js).
 */
import { createContext, useState, useEffect, useCallback } from 'react';
import client, { setAccessToken, clearAccessToken } from '../api/client';
import { login as loginApi, signup as signupApi, logout as logoutApi, getMe } from '../api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── forced logout from the interceptor ──────────────────────────────────────
  // client.js dispatches 'auth:logout' when a refresh fails so we can clear
  // React state without a circular import between client.js and AuthContext.
  const forceLogout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', forceLogout);
    return () => window.removeEventListener('auth:logout', forceLogout);
  }, [forceLogout]);

  // ── silent restore on page load ──────────────────────────────────────────────
  // POST /auth/refresh — the browser sends the HttpOnly cookie automatically
  // because client is created with withCredentials: true.
  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshRes = await client.post('/auth/refresh');
        const newToken = refreshRes.data?.data?.token;
        if (!newToken) throw new Error('No token in refresh response');

        setAccessToken(newToken);

        const meRes = await getMe();
        setUser(meRes.data.data.user);
      } catch {
        // No valid session — that is normal for a first visit / after expiry.
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // run once on mount

  // ── login ───────────────────────────────────────────────────────────────────
  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const { token, user: userData } = response.data.data;
    setAccessToken(token);
    setUser(userData);
  };

  // ── signup ──────────────────────────────────────────────────────────────────
  const signup = async (data) => {
    const response = await signupApi(data);
    const { token, user: userData } = response.data.data;
    setAccessToken(token);
    setUser(userData);
  };

  // ── logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await logoutApi(); // POST /auth/logout — revokes the refresh session on server
    } catch {
      // Even if the network call fails, clear client-side auth state
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}