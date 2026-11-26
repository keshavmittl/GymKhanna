let nextSetId = 0;

function draftSet(set) {
  const reps = set?.reps ?? '';
  return { id: ++nextSetId, weight: set?.weight ?? '', reps, completed: reps === '' || Number(reps) !== 0 };
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

export function copySet(set) {
  return { ...draftSet(set), completed: set.completed };
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

export function readWorkoutDraft(key) {
  if (!key) return null;
  try {
    const draft = JSON.parse(sessionStorage.getItem(key));
    if (typeof draft?.name !== 'string' || !Array.isArray(draft.exercises)) return null;
    const exercises = draft.exercises.map((exercise) => {
      if (typeof exercise.exerciseId !== 'string' || typeof exercise.name !== 'string' || !Array.isArray(exercise.sets) || !exercise.sets.length) {
        throw new Error('Invalid workout draft');
      }
      const sets = exercise.sets.map((set) => {
        const validNumbers = [set.weight, set.reps].every((value) =>
          value === '' || (['number', 'string'].includes(typeof value) && Number.isFinite(Number(value))),
        );
        if (!validNumbers) throw new Error('Invalid workout set');
        return { ...draftSet(set), completed: set.completed !== false };
      });
      return { exerciseId: exercise.exerciseId, name: exercise.name, sets };
    });
    return { name: draft.name, exercises };
  } catch {
    return null;
  }
}

function serializeWorkoutDraft({ name, exercises }) {
  return JSON.stringify({
    name,
    exercises: exercises.map(({ exerciseId, name, sets }) => ({
      exerciseId, name,
      sets: sets.map(({ weight, reps, completed }) => ({ weight, reps, completed })),
    })),
  });
}

export function storeWorkoutDraft(key, draft) {
  if (!key) return;
  try {
    if (draft.name || draft.exercises.length) sessionStorage.setItem(key, serializeWorkoutDraft(draft));
    else sessionStorage.removeItem(key);
  } catch {
    // A blocked or full browser store should leave logging available.
  }
}

export function clearSubmittedWorkoutDraft(key, draft) {
  if (!key) return;
  try {
    // A different composer may have saved newer edits during the request.
    if (sessionStorage.getItem(key) === serializeWorkoutDraft(draft)) sessionStorage.removeItem(key);
  } catch {
    // The workout is already saved, even if browser storage is blocked.
  }
}
