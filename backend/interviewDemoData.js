export const demoExerciseLibrary = {
  bench: { name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  incline: { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  pushdown: { name: 'Cable Tricep Pushdown', muscleGroup: 'Arms', equipment: 'Cable' },
  pulldown: { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Machine' },
  row: { name: 'Cable Row', muscleGroup: 'Back', equipment: 'Cable' },
  curl: { name: 'Dumbbell Hammer Curl', muscleGroup: 'Arms', equipment: 'Dumbbell' },
  squat: { name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  legPress: { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine' },
  lunges: { name: 'Dumbbell Lunges', muscleGroup: 'Legs', equipment: 'Dumbbell' },
};

const routines = [
  { name: 'Push day', day: 0, lifts: [
    { lift: 'bench', loads: [47.5, 50, 52.5, 55, 55, 57.5, 60], reps: [8, 8, 7] },
    { lift: 'incline', loads: [14, 14, 16, 16, 16, 18, 18], reps: [10, 10, 9] },
    { lift: 'pushdown', loads: [15, 15, 17.5, 17.5, 20, 20, 22.5], reps: [12, 12, 10] },
  ] },
  { name: 'Pull day', day: 2, lifts: [
    { lift: 'pulldown', loads: [35, 37.5, 40, 40, 42.5, 45, 45], reps: [10, 10, 8] },
    { lift: 'row', loads: [32.5, 35, 35, 37.5, 40, 40, 42.5], reps: [10, 10, 9] },
    { lift: 'curl', loads: [8, 8, 10, 10, 10, 10, 12], reps: [12, 10, 10] },
  ] },
  { name: 'Leg day', day: 4, lifts: [
    { lift: 'squat', loads: [52.5, 55, 57.5, 60, 60, 65], reps: [8, 8, 6] },
    { lift: 'legPress', loads: [90, 90, 100, 105, 110, 120], reps: [12, 10, 10] },
    { lift: 'lunges', loads: [10, 10, 12, 12, 12, 14], reps: [10, 10, 8] },
  ] },
];

const weighInSamples = [
  [42, 79.2], [39, 78.9], [35, 79], [31, 78.7], [27, 78.4], [23, 78.5],
  [19, 78], [15, 77.8], [11, 77.6], [7, 77.4], [3, 77.5], [0, 77],
];

function offsetDate(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function buildInterviewHistory(now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = offsetDate(today, -dayOfWeek);
  const completedWeeks = 6;
  const workouts = [];

  for (let week = 0; week <= completedWeeks; week++) {
    for (const { name, day, lifts } of routines) {
      // Leave one workout to demonstrate reaching the current week's goal.
      if (week === completedWeeks && (day > dayOfWeek || day === 4)) continue;

      workouts.push({
        name,
        date: offsetDate(monday, (week - completedWeeks) * 7 + day),
        exercises: lifts.map(({ lift, loads, reps }) => ({
          lift,
          sets: reps.map((count) => ({ weight: loads[week], reps: count })),
        })),
      });
    }
  }

  return {
    workouts,
    weighIns: weighInSamples.map(([daysAgo, weight]) => ({ date: offsetDate(today, -daysAgo), weight })),
    weeklyGoal: 3,
    goalWeight: 76,
    waterToday: 1750,
  };
}
