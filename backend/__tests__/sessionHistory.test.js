import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import Session from '../models/Session.js';
import User from '../models/User.js';
import sessionRoutes from '../routes/sessions.js';

let mongo;
const app = express();
app.use(express.json());
app.use('/api/sessions', sessionRoutes);

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = 'session-history-test';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

test('returns the latest completed sets for each exercise and only for the signed-in user', async () => {
  const user = await User.create({ name: 'Athlete', email: 'athlete@example.test', password: 'password123' });
  const bench = new mongoose.Types.ObjectId();
  const chinup = new mongoose.Types.ObjectId();
  const exercise = (exerciseId, sets) => ({ exerciseId, name: 'Lift', sets });
  await Session.create([
    {
      name: 'Old workout', userId: user._id, date: '2026-10-02',
      exercises: [exercise(bench, [{ weight: 90, reps: 5 }]), exercise(chinup, [{ weight: 0, reps: 12 }])],
    },
    {
      name: 'Latest completed', userId: user._id, date: '2026-10-03',
      exercises: [exercise(bench, [{ weight: 100, reps: 5 }, { weight: 110, reps: 2, completed: false }])],
    },
    {
      name: 'Failed set', userId: user._id, date: '2026-10-04',
      exercises: [exercise(bench, [{ weight: 115, reps: 2, completed: false }])],
    },
    {
      name: 'Another athlete', userId: new mongoose.Types.ObjectId(), date: '2026-10-05',
      exercises: [exercise(bench, [{ weight: 150, reps: 5 }])],
    },
  ]);
  const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET);
  await request(app).get('/api/sessions/last-sets').expect(401);
  const response = await request(app)
    .get('/api/sessions/last-sets')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  expect(response.body.data).toEqual({ lastSets: {
    [bench.toString()]: [{ weight: 100, reps: 5 }],
    [chinup.toString()]: [{ weight: 0, reps: 12 }],
  } });
});

test('a missed set contributes neither volume nor a personal record', async () => {
  const user = await User.create({ name: 'Lifter', email: 'lifter@example.test', password: 'password123' });
  const bench = new mongoose.Types.ObjectId();
  const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET);
  const response = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Bench',
      exercises: [{ exerciseId: bench, name: 'Bench press', sets: [
        { weight: 100, reps: 5, completed: true },
        { weight: 105, reps: 5, completed: false },
      ] }],
    }).expect(201);

  expect(response.body.data.session.totalVolume).toBe(500);
  expect(response.body.data.session.prs.map((pr) => pr.newWeight)).toEqual([100]);
  const records = await request(app).get('/api/sessions/prs').set('Authorization', `Bearer ${token}`).expect(200);
  expect(records.body.data.prs.map((pr) => pr.weight)).toEqual([100]);
});

test('journal stats support existing workouts saved before the PR field was added', async () => {
  const user = await User.create({ name: 'Legacy', email: 'legacy@example.test', password: 'password123' });
  await Session.collection.insertOne({
    userId: user._id, name: 'Early workout', date: new Date('2026-10-01'), exercises: [], totalVolume: 0,
  });
  const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET);
  const response = await request(app).get('/api/sessions/stats').set('Authorization', `Bearer ${token}`).expect(200);
  expect(response.body.data.totalPRs).toBe(0);
  expect(response.body.data.recentSessions[0].prs).toEqual([]);
});

test('workout totals and records use the numeric weights and completed flags MongoDB stores', async () => {
  const user = await User.create({ name: 'Cast', email: 'cast@example.test', password: 'password123' });
  const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET);
  const response = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Bench',
      exercises: [{
        exerciseId: new mongoose.Types.ObjectId(), name: 'Bench press',
        sets: [{ weight: '80', reps: '5' }, { weight: '100', reps: '5' }, { weight: '110', reps: '5', completed: 'false' }],
      }],
    }).expect(201);
  expect(response.body.data.session.totalVolume).toBe(900);
  expect(response.body.data.session.prs[0].newWeight).toBe(100);
});
