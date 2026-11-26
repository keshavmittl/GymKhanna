import { describe, expect, it } from 'vitest';
import { createDraftExercise, createRepeatDraft, nextSet } from '../workoutDraft';

const bench = { _id: 'bench', name: 'Bench Press' };
const previous = [{ weight: 100, reps: 5 }, { weight: 97.5, reps: 8 }];

describe('workout drafts', () => {
  it('prefills the first set and suggests the matching set as more are added', () => {
    const exercise = createDraftExercise(bench, previous);
    expect(exercise.sets[0]).toMatchObject({ weight: 100, reps: 5 });
    expect(nextSet(exercise.sets, previous)).toMatchObject({ weight: 97.5, reps: 8 });
    expect(nextSet([...exercise.sets, { weight: 99, reps: 7 }], previous))
      .toMatchObject({ weight: 99, reps: 7 });
  });

  it('leaves a new exercise blank and preserves zero-kilo bodyweight sets', () => {
    expect(createDraftExercise(bench).sets[0]).toMatchObject({ weight: '', reps: '' });
    expect(createDraftExercise(bench, [{ weight: 0, reps: 12 }]).sets[0])
      .toMatchObject({ weight: 0, reps: 12 });
  });

  it('copies a workout into a draft without sharing sets with the source', () => {
    const session = { name: 'Upper body', exercises: [{
      exerciseId: bench._id, name: bench.name,
      sets: [{ weight: 100, reps: 5, completed: false }],
    }] };
    const draft = createRepeatDraft(session);
    expect(draft.name).toBe('Upper body');
    expect(draft.exercises[0].sets[0]).toMatchObject({ weight: 100, reps: 5, completed: true });
    draft.exercises[0].sets[0].weight = 105;
    expect(session.exercises[0].sets[0].weight).toBe(100);
  });
});
