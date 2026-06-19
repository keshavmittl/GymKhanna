import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
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
//middleware
app.use(cors({origin: process.env.CLIENT_URL ||'http://localhost:3000'}));
app.use(express.json());

//routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/bodyweight', bodyWeightRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/goals', goalRoutes);
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: '' });
});
//db connection , connects first and then listens to the request
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });