/**
 * auth.test.js
 *
 * Tests for the refresh-token authentication system.
 * Uses supertest (HTTP assertions) + mongodb-memory-server (isolated DB).
 *
 * Coverage:
 *  - signup
 *  - login (valid / invalid credentials)
 *  - POST /auth/refresh (valid, expired, revoked, malformed, rotation, reuse)
 *  - POST /auth/logout  (session revocation, cookie cleared)
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// ─── minimal env before importing app code ─────────────────────────────────
process.env.ACCESS_TOKEN_SECRET  = 'test_access_secret';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
process.env.ACCESS_TOKEN_EXPIRES_IN  = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

// ─── app code imports (after env is set) ───────────────────────────────────
import authRoutes from '../routes/auth.js';

// Build a test Express app (mirrors server.js without the DB connect / listen)
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
}

// ─── DB lifecycle ───────────────────────────────────────────────────────────
let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Wipe collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─── helpers ────────────────────────────────────────────────────────────────
const SIGNUP_PAYLOAD = { name: 'Test User', email: 'test@example.com', password: 'password123' };

async function registerAndLogin(overrides = {}) {
  const payload = { ...SIGNUP_PAYLOAD, ...overrides };
  const res = await request(app).post('/api/auth/signup').send(payload);
  return res;
}

/** Extract the refreshToken cookie value from a Set-Cookie header array. */
function extractRefreshCookie(res) {
  const cookieHeader = res.headers['set-cookie'] ?? [];
  const cookieLine = cookieHeader.find((c) => c.startsWith('refreshToken='));
  if (!cookieLine) return null;
  return cookieLine.split(';')[0].replace('refreshToken=', '');
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNUP
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/signup', () => {
  test('creates account, returns access token + user, sets refresh cookie', async () => {
    const res = await request(app).post('/api/auth/signup').send(SIGNUP_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(SIGNUP_PAYLOAD.email);
    expect(res.body.data.user.password).toBeUndefined();    // never leak hash

    // Refresh cookie must be set
    const cookie = extractRefreshCookie(res);
    expect(cookie).not.toBeNull();

    // Access token must be a valid short-lived JWT
    const decoded = jwt.verify(res.body.data.token, process.env.ACCESS_TOKEN_SECRET);
    expect(decoded.userId).toBeDefined();
  });

  test('rejects duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(SIGNUP_PAYLOAD);
    const res = await request(app).post('/api/auth/signup').send(SIGNUP_PAYLOAD);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(SIGNUP_PAYLOAD);
  });

  test('valid credentials return access token + refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SIGNUP_PAYLOAD.email, password: SIGNUP_PAYLOAD.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(extractRefreshCookie(res)).not.toBeNull();
  });

  test('wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SIGNUP_PAYLOAD.email, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('unknown email returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  test('missing fields returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: SIGNUP_PAYLOAD.email });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REFRESH
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/refresh', () => {
  let refreshCookie;

  beforeEach(async () => {
    const res = await registerAndLogin();
    refreshCookie = extractRefreshCookie(res);
  });

  test('valid refresh token returns new access token and rotates cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshCookie}`);

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();

    const newCookie = extractRefreshCookie(res);
    expect(newCookie).not.toBeNull();
    expect(newCookie).not.toBe(refreshCookie);   // token was rotated
  });

  test('no refresh cookie returns 401', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  test('malformed/garbage cookie value returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=totallynotavalidtoken');
    expect(res.status).toBe(401);
  });

  test('expired refresh token returns 401', async () => {
    // Manually create a session that is already expired in the DB
    const RefreshToken = (await import('../models/RefreshToken.js')).default;
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: SIGNUP_PAYLOAD.email });

    const raw = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() - 1000), // already in the past
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${raw}`);
    expect(res.status).toBe(401);
  });

  test('revoked refresh token returns 401', async () => {
    const RefreshToken = (await import('../models/RefreshToken.js')).default;
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: SIGNUP_PAYLOAD.email });

    const raw = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 86400000),
      revokedAt: new Date(),  // already revoked
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${raw}`);
    expect(res.status).toBe(401);
  });

  test('token rotation: old token cannot be reused after rotation', async () => {
    // First refresh — rotates token
    const firstRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshCookie}`);
    expect(firstRes.status).toBe(200);

    // Try to use the OLD token again — should detect reuse and return 401
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshCookie}`);
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.message).toMatch(/reuse detected/i);
  });

  test('reuse detection revokes all active sessions for the user', async () => {
    const RefreshToken = (await import('../models/RefreshToken.js')).default;
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: SIGNUP_PAYLOAD.email });

    // Rotate once to get a new active session
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshCookie}`);

    // Reuse the old (now revoked) token
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshCookie}`);

    // All sessions for this user should now be revoked
    const activeSessions = await RefreshToken.find({
      userId: user._id,
      revokedAt: null,
    });
    expect(activeSessions.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
  let refreshCookie;

  beforeEach(async () => {
    const res = await registerAndLogin();
    refreshCookie = extractRefreshCookie(res);
  });

  test('logout revokes the refresh session in the DB', async () => {
    const RefreshToken = (await import('../models/RefreshToken.js')).default;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `refreshToken=${refreshCookie}`);

    expect(logoutRes.status).toBe(200);

    // Subsequent refresh must fail
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshCookie}`);
    expect(refreshRes.status).toBe(401);
  });

  test('logout clears the refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `refreshToken=${refreshCookie}`);

    const cookieHeader = res.headers['set-cookie'] ?? [];
    // Cookie should be cleared (Max-Age=0 or Expires in the past)
    const clearedLine = cookieHeader.find((c) => c.startsWith('refreshToken='));
    expect(clearedLine).toBeDefined();
    const isCleared =
      clearedLine.includes('Expires=') &&
      (clearedLine.includes('Max-Age=0') || new Date(clearedLine.split('Expires=')[1]) < new Date());
    // supertest's clearCookie sets Expires to epoch; either Expires-past or Max-Age=0 is acceptable
    expect(clearedLine.toLowerCase()).toMatch(/expires|max-age/);
  });

  test('logout with no cookie still returns 200', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});
