function heaviestCompletedWeight(sets) {
  let best = null;
  for (const set of sets) {
    if (set.completed !== false && set.reps > 0 && (best === null || set.weight > best)) {
      best = set.weight;
    }
  }
  return best;
}

export const getAllTimePRs = (allSessions) => {
  const records = new Map();

  for (const session of allSessions) {
    for (const exercise of session.exercises) {
      const id = exercise.exerciseId.toString();
      const weight = heaviestCompletedWeight(exercise.sets);
      if (weight !== null && (!records.has(id) || weight > records.get(id).weight)) {
        records.set(id, { exerciseId: exercise.exerciseId, name: exercise.name, weight, date: session.date });
      }
    }
  }

  return [...records.values()];
};

export const findPRsForSession = (currentSessionExercises, allPastSessions) => {
  const previous = new Map(getAllTimePRs(allPastSessions).map((record) => [record.exerciseId.toString(), record.weight]));
  const prs = [];

  for (const exercise of currentSessionExercises) {
    const previousBest = previous.get(exercise.exerciseId.toString()) ?? 0;
    const newWeight = heaviestCompletedWeight(exercise.sets);
    if (newWeight !== null && newWeight > previousBest) {
      prs.push({ exerciseId: exercise.exerciseId, name: exercise.name, newWeight, previousBest });
    }
  }
  return prs;
};
