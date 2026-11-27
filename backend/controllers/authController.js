import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getAccessTokenSecret } from '../services/accessTokenSecret.js';
import RefreshToken from '../models/RefreshToken.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Generate a cryptographically-random opaque refresh-token string. */
const generateRawRefreshToken = () => crypto.randomBytes(64).toString('hex');

/** SHA-256 hash of the raw token — what we persist in the DB. */
const hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

/** Sign a short-lived JWT access token. */
const signAccessToken = (userId) =>
  jwt.sign({ userId }, getAccessTokenSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });

/** Cookie options for the refresh-token HttpOnly cookie. */
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: parseDurationMs(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'),
  path: '/',           // accessible across all paths
});

/** Parse a duration string like "7d", "15m", "1h" into milliseconds. */
function parseDurationMs(str) {
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = String(str).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86_400_000; // default 7 days
  return Number(match[1]) * map[match[2]];
}

/**
 * Create a new RefreshToken record in the DB.
 * Returns { raw, doc } — raw is sent to the client, doc is the DB record.
 */
const createRefreshSession = async (userId) => {
  const raw = generateRawRefreshToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(
    Date.now() + parseDurationMs(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'),
  );
  const doc = await RefreshToken.create({ userId, tokenHash, expiresAt });
  return { raw, doc };
};

/** Set the refresh-token HttpOnly cookie on the response. */
const setRefreshCookie = (res, rawToken) => {
  res.cookie('refreshToken', rawToken, refreshCookieOptions());
};

/** Clear the refresh-token cookie. */
const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

// ─── signup ───────────────────────────────────────────────────────────────────

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Name, email and password are required',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    // Issue tokens
    const accessToken = signAccessToken(user._id);
    const { raw: rawRefresh } = await createRefreshSession(user._id);
    setRefreshCookie(res, rawRefresh);

    return res.status(201).json({
      success: true,
      data: {
        token: accessToken,                                   // ← same key as before
        user: { id: user._id, name: user.name, email: user.email },
      },
      message: 'Account created successfully',
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

// ─── login ────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password',
      });
    }

    // Issue tokens
    const accessToken = signAccessToken(user._id);
    const { raw: rawRefresh } = await createRefreshSession(user._id);
    setRefreshCookie(res, rawRefresh);

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,                                   // ← same key as before
        user: { id: user._id, name: user.name, email: user.email },
      },
      message: 'Login successful',
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

// ─── refresh ──────────────────────────────────────────────────────────────────

export const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'No refresh token provided',
      });
    }

    const tokenHash = hashToken(rawToken);
    const session = await RefreshToken.findOne({ tokenHash });

    // ── reuse detection ──────────────────────────────────────────────────────
    // If the token hash exists but is already revoked, it means the raw token
    // has been reused after rotation — indicative of token theft.
    // Revoke the entire chain for this user as a security measure.
    if (session && session.revokedAt) {
      await RefreshToken.updateMany(
        { userId: session.userId, revokedAt: null },
        { revokedAt: new Date() },
      );
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Refresh token reuse detected — all sessions revoked. Please log in again.',
      });
    }

    if (!session || session.expiresAt <= new Date()) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Refresh token expired or invalid',
      });
    }

    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        data: null,
        message: 'User no longer exists',
      });
    }

    // ── rotate: revoke old, issue new ────────────────────────────────────────
    const newAccessToken = signAccessToken(user._id);
    const { raw: newRawRefresh, doc: newSession } = await createRefreshSession(user._id);

    // Mark old session as revoked and link to successor
    session.revokedAt = new Date();
    session.replacedById = newSession._id;
    await session.save();

    setRefreshCookie(res, newRawRefresh);

    return res.status(200).json({
      success: true,
      data: { token: newAccessToken },
      message: 'Token refreshed',
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

// ─── logout ───────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash, revokedAt: null },
        { revokedAt: new Date() },
      );
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Logged out successfully',
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};
