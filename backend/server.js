import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import exerciseRoutes from './routes/exercises.js';
import progressRoutes from './routes/progress.js';
import bodyWeightRoutes from './routes/bodyweight.js';
import waterRoutes from './routes/water.js';
import goalRoutes from './routes/goals.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (Render, AWS ALB, Cloudflare, etc.)
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
// credentials: true is required so the browser sends the HttpOnly refresh-
// token cookie on /auth/refresh requests.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ── body + cookie parsing ─────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser()); // parses req.cookies

// ── root & health check ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GymKhanna API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: '' });
});

// ── routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/bodyweight', bodyWeightRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/goals', goalRoutes);

// ── DB + start ────────────────────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is not defined.');
  console.error('Please configure MONGODB_URI in Render dashboard -> Environment tab.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    if (err.message && err.message.includes('querySrv ENOTFOUND')) {
      console.error('\n--- MongoDB Atlas SRV Resolution Troubleshooting ---');
      console.error('1. Check if your MongoDB Atlas cluster is paused or deleted (log into cloud.mongodb.com).');
      console.error('2. Ensure the cluster domain in MONGODB_URI is correct (get fresh connection string from Atlas).');
      console.error('3. Check Network Access in Atlas: Ensure 0.0.0.0/0 (Allow access from anywhere) is configured.');
      console.error('---------------------------------------------------\n');
    }
    process.exit(1);
  });