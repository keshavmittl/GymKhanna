import { buildInterviewHistory } from '../interviewDemoData.js';
import { getWeekIdentifier } from '../services/streakEngine.js';

test('builds six full training weeks and two current workouts on a Friday', () => {
  const now = new Date(2026, 10, 27, 9);
  const { workouts, weighIns } = buildInterviewHistory(now);
  const currentWeek = getWeekIdentifier(now);
  const counts = new Map();

  for (const { date } of workouts) {
    const week = getWeekIdentifier(date);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  expect(workouts).toHaveLength(20);
  expect(counts.get(currentWeek)).toBe(2);
  expect([...counts.values()].slice(0, -1)).toEqual([3, 3, 3, 3, 3, 3]);
  expect(workouts.every(({ date }) => date <= now)).toBe(true);
  expect(weighIns.every(({ date }) => date <= now)).toBe(true);

  const push = workouts.filter(({ name }) => name === 'Push day');
  expect(push[0].exercises[0].sets[0]).toMatchObject({ weight: 47.5, reps: 8 });
  expect(push.at(-1).exercises[0].sets[0]).toMatchObject({ weight: 60, reps: 8 });
  expect(weighIns).toHaveLength(12);
});

test('keeps the current week accurate when seeded early on a Monday', () => {
  const now = new Date(2026, 10, 23, 1);
  const { workouts } = buildInterviewHistory(now);
  expect(workouts).toHaveLength(19);
  expect(workouts.at(-1).date.getDate()).toBe(23);
  expect(workouts.at(-1).date <= now).toBe(true);
});
