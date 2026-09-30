# GymKhanna — Authentication Documentation

## Overview

GymKhanna uses a **dual-token JWT authentication system**:

| Token | Type | Lifetime | Storage | Purpose |
|---|---|---|---|---|
| Access token | JWT (signed) | 15 minutes | In-memory (JS module variable) | Authenticate API requests |
| Refresh token | Random 128-byte hex | 7 days | `HttpOnly` cookie (`SameSite=Lax`) | Obtain new access tokens |

---

## Login Flow

```
POST /api/auth/login  { email, password }
          ↓
  validate credentials
          ↓
  create RefreshToken record in DB (hashed)
          ↓
  sign short-lived access JWT
          ↓
  Response body: { success, data: { token, user } }
  Set-Cookie: refreshToken=<raw>; HttpOnly; SameSite=Lax; Path=/
```

The frontend `AuthContext`:
1. Calls `POST /api/auth/login`.
2. Stores the returned `token` (access token) in a **module-level in-memory variable** — never in `localStorage`.
3. Sets the `user` object in React state.

---

## Token Lifetimes

| Variable | Default | Description |
|---|---|---|
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh token lifetime |

---

## Refresh Endpoint

```http
POST /api/auth/refresh
```

- No request body required.
- The `HttpOnly` `refreshToken` cookie is sent automatically by the browser.
- Returns `{ success, data: { token } }` — a new access token.
- **Rotates** the refresh token: the old cookie value is revoked in the DB and a new one is set.
- Returns `401` if the refresh token is missing, expired, revoked, or if reuse is detected.

---

## Token Storage Strategy

| Token | Storage | Rationale |
|---|---|---|
| Access token | **JS module variable** (in-memory) | Invisible to `localStorage`-reading XSS; lost on page reload (recovered via silent refresh) |
| Refresh token | **`HttpOnly` cookie** | Not accessible to JavaScript at all; `SameSite=Lax` prevents CSRF on cross-site navigations |

> **Why not `localStorage` for the refresh token?**
> `localStorage` is readable by any JavaScript running on the page. An XSS vulnerability could silently steal a long-lived token. An `HttpOnly` cookie is invisible to JS entirely.

---

## CORS

`credentials: true` is set on the backend CORS config and `withCredentials: true` on the frontend Axios instance so the browser includes the `HttpOnly` cookie on cross-origin requests to `/api/auth/refresh`.

The allowed origin is controlled by `CLIENT_URL` in `.env`.  
`Access-Control-Allow-Origin: *` is **not** used with credentialed requests.

---

## Rotation & Revocation

Each refresh generates a new DB record (`RefreshToken` model) and revokes the old one:

```
RefreshToken document
─────────────────────
userId          ObjectId
tokenHash       SHA-256(raw token)   ← raw token is NEVER stored
expiresAt       Date (TTL index — auto-purge)
revokedAt       Date | null
replacedById    ObjectId | null      ← chain pointer for rotation
createdAt / updatedAt   (timestamps)
```

### Reuse detection

If a refresh token that has already been rotated (i.e., `revokedAt` is set) is presented again, the server:
1. Assumes token theft has occurred.
2. **Revokes all active sessions** for that user.
3. Returns `401`.

---

## Logout Flow

```
POST /api/auth/logout
          ↓
  read refreshToken cookie
          ↓
  mark RefreshToken record as revokedAt = now
          ↓
  clearCookie('refreshToken')
          ↓
  Response: { success: true, message: 'Logged out successfully' }
```

Frontend `AuthContext.logout()`:
1. Calls `POST /api/auth/logout` (server revokes session).
2. Calls `clearAccessToken()` — wipes the in-memory access token.
3. Clears `user` from React state.
4. `Navbar` navigates to `/login`.

---

## Frontend Retry Behavior

The Axios interceptor in [`api/client.js`](./frontend/src/api/client.js):

```
API request
    ↓
401 response?
    ↓
code === 'TOKEN_EXPIRED'?
 ┌──YES─────────────────┐ NO → propagate error (no refresh)
 ↓                      ↓
already retried?    TOKEN_INVALID / permission error
 ┌─YES──┐
 ↓      ↓ NO
propagate  single-flight POST /auth/refresh
error           ↓
           new access token stored
                ↓
           retry original request once
                ↓
           return result to caller
```

**Single-flight guarantee:** If multiple requests receive `401` simultaneously, only **one** `POST /auth/refresh` call is made. All other waiters share the same promise.

---

## Error Code Reference

The backend `protect` middleware sets a machine-readable `code` field on 401 responses:

| `code` | Meaning | Client action |
|---|---|---|
| `TOKEN_EXPIRED` | JWT `exp` claim has passed | Attempt refresh |
| `TOKEN_INVALID` | Bad signature / tampered / missing | Propagate; do not refresh |

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5001
MONGODB_URI=<mongodb connection string>

# Auth secrets — use separate random values in production
ACCESS_TOKEN_SECRET=<random 64-byte hex>
ACCESS_TOKEN_EXPIRES_IN=15m

REFRESH_TOKEN_SECRET=<random 64-byte hex>   # reserved for future HMAC refresh tokens
REFRESH_TOKEN_EXPIRES_IN=7d

# Legacy — kept for compatibility, not used by new auth code
JWT_SECRET=<original secret>

CLIENT_URL=http://localhost:5173   # must match frontend origin
NODE_ENV=development               # set to 'production' in prod (enables Secure cookie flag)
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001/api
```

---

## Local Development Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas URI (or local MongoDB)

### Backend

```bash
cd backend
cp .env.example .env     # edit secrets
npm install
npm run dev              # nodemon server.js on port 5001
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # vite dev server on port 5173
```

### Run Tests

```bash
# Backend (Jest + mongodb-memory-server, no real DB needed)
cd backend && npm test

# Frontend (Vitest + jsdom)
cd frontend && npm test
```

---

## Silent Session Restore (Page Reload)

On app mount, `AuthContext` immediately calls `POST /api/auth/refresh`.  
If a valid `HttpOnly` refresh cookie exists, a new access token is issued silently and the user is kept logged in without re-entering credentials.  
If the cookie is absent or expired, the user is sent to `/login`.

---

## Security Notes

1. **Refresh tokens are hashed** (SHA-256) before being stored in MongoDB. A DB compromise does not expose usable tokens.
2. **`HttpOnly` + `SameSite=Lax`** cookie prevents both XSS theft and most CSRF scenarios for a same-site SPA.
3. **`Secure` flag** is enabled automatically in `NODE_ENV=production` — require HTTPS in production.
4. **Reuse detection** provides a canary against token theft: reusing a rotated token triggers total session revocation for that user.
5. **MongoDB TTL index** on `expiresAt` auto-purges expired refresh-token documents — no manual cleanup needed.
6. Access tokens contain only `{ userId }` — no sensitive data in the JWT payload.
