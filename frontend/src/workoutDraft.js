let nextSetId = 0;

function draftSet(set) {
  return { id: ++nextSetId, weight: set?.weight ?? '', reps: set?.reps ?? '', completed: set?.reps !== 0 };
}

export function createDraftExercise(exercise, previous = []) {
  return {
    exerciseId: exercise._id,
    name: exercise.name,
    sets: [draftSet(previous[0])],
  };
}

export function nextSet(sets, previous = []) {
  return draftSet(previous[sets.length] ?? sets.at(-1));
}

export function createRepeatDraft(session) {
  return {
    name: session.name,
    exercises: session.exercises.map((exercise) => {
      const { exerciseId, name, sets } = exercise;
      return { exerciseId, name, sets: sets.length ? sets.map(draftSet) : [draftSet()] };
    }),
  };
}
