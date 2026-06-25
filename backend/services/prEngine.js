export const findPRsForSession = (currentSessionExercises, allPastSessions) => {
  const prs = [];

  for (const exercise of currentSessionExercises) {
    let previousBest = 0;

    for (const pastSession of allPastSessions) {
      for (const pastExercise of pastSession.exercises) {
        if (pastExercise.exerciseId.toString() === exercise.exerciseId.toString()) {
          for (const set of pastExercise.sets) {
            if (set.weight > previousBest) {
              previousBest = set.weight;
            }
          }
        }
      }
    }

    const heaviestInCurrentSession = Math.max(...exercise.sets.map((s) => s.weight));

    if (heaviestInCurrentSession > previousBest) {
      prs.push({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        newWeight: heaviestInCurrentSession,
        previousBest,
      });
    }
  }
  return prs;
  };

  export const getAllTimePRs = (allSessions) => {
  const recordsByExercise = {};

  for (const session of allSessions) {
    for (const exercise of session.exercises) {
      const id = exercise.exerciseId.toString();
      const heaviestInThisSession = Math.max(...exercise.sets.map((s) => s.weight));

      if (!recordsByExercise[id] || heaviestInThisSession > recordsByExercise[id].weight) {
        recordsByExercise[id] = {
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          weight: heaviestInThisSession,
          date: session.date,
        };
      }
    }
  }

  return Object.values(recordsByExercise);
};
