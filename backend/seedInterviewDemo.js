import { randomBytes } from 'node:crypto';
import { buildInterviewHistory, demoExerciseLibrary } from './interviewDemoData.js';

const env = process.env;
const name = env.DEMO_NAME?.trim() || 'Interview Demo';
const email = env.DEMO_EMAIL?.trim() || `gymkhanna-demo-${randomBytes(4).toString('hex')}@example.test`;
const password = env.DEMO_PASSWORD || `Journal-${randomBytes(8).toString('base64url')}`;

async function seedInterviewDemo() {
  const target = new URL(env.DEMO_API_URL || 'http://localhost:5001/api');
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
  if ((!loopback && target.protocol !== 'https:') || target.username || target.password || target.search || target.hash) {
    throw new Error('Use a local API URL or an HTTPS demo API URL without credentials.');
  }
  const base = target.href.replace(/\/$/, '');

  async function request(route, { method = 'GET', data, token } = {}) {
    const response = await fetch(base + route, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: {
        ...(data && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      if (route === '/auth/signup' && response.status === 400) {
        throw new Error('The demo sign-up was rejected. Check the credentials or choose a fresh demo email.');
      }
      throw new Error(`${method} ${route} returned HTTP ${response.status}`);
    }

    return (await response.json()).data;
  }

  await request('/health');
  const { token } = await request('/auth/signup', { method: 'POST', data: { name, email, password } });
  console.log(`Created demo account: ${name} <${email}>`);
  if (!env.DEMO_PASSWORD) console.log(`Generated demo password: ${password}`);

  const { exercises } = await request('/exercises', { token });
  const library = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  const usedExercises = new Map();
  for (const [key, data] of Object.entries(demoExerciseLibrary)) {
    const exercise = library.get(data.name) ??
      (await request('/exercises', { token, method: 'POST', data })).exercise;
    usedExercises.set(key, exercise);
  }

  const { workouts, weighIns, weeklyGoal, goalWeight, waterToday } = buildInterviewHistory();
  await request('/goals', { token, method: 'PUT', data: { weeklyGoal } });
  await request('/bodyweight/goal', { token, method: 'PUT', data: { goalWeight } });

  for (const { name, date, exercises: lifts } of workouts) {
    const workout = {
      name,
      date,
      exercises: lifts.map(({ lift, sets }) => {
        const exercise = usedExercises.get(lift);
        return { exerciseId: exercise._id, name: exercise.name, sets };
      }),
    };
    await request('/sessions', { token, method: 'POST', data: workout });
  }

  for (const data of weighIns) await request('/bodyweight', { token, method: 'POST', data });
  await request('/water', { token, method: 'POST', data: { amount: waterToday } });

  const stats = await request('/sessions/stats', { token });
  const weight = await request('/bodyweight', { token });
  if (stats.totalSessions !== workouts.length || weight.entries.length !== weighIns.length) {
    throw new Error('The demo history did not match the expected record counts.');
  }
  console.log(`Interview demo ready with ${stats.totalSessions} workouts, ${weight.entries.length} weigh-ins, and ${stats.totalPRs} personal record entries.`);
}

seedInterviewDemo().catch((error) => {
  console.error(`Interview demo stopped. ${error.message}`);
  process.exitCode = 1;
});
