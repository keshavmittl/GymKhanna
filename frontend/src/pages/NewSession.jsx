import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Dumbbell, Plus, X } from 'lucide-react';
import { getExercises, getLastSets, getSessionById, createSession } from '../api';
import ExercisePicker from '../components/ExercisePicker';
import RestTimer from '../components/RestTimer';
import { useAuth } from '../hooks/useAuth';
import WorkoutSetEditor from '../components/WorkoutSetEditor';
import {
  clearSubmittedWorkoutDraft, copySet, createDraftExercise, createRepeatDraft, nextSet,
  readWorkoutDraft, storeWorkoutDraft,
} from '../workoutDraft';

const volumeFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export default function NewSession() {
  const { state } = useLocation();
  const { user } = useAuth();
  const repeatId = typeof state?.repeatId === 'string' ? state.repeatId : null;
  const userId = user?.id ?? user?._id;
  const draftKey = userId ? `gymkhanna:workout-draft:v1:${userId}:${repeatId ?? 'new'}` : null;
  return <WorkoutComposer key={draftKey ?? repeatId ?? 'new'} repeatId={repeatId} draftKey={draftKey} />;
}

function WorkoutComposer({ repeatId, draftKey }) {
  const navigate = useNavigate();
  const addButton = useRef(null);
  const saving = useRef(false);
  const mounted = useRef(false);
  const [restored] = useState(() => readWorkoutDraft(draftKey));
  const [draft, setDraft] = useState(() => restored ?? { name: '', exercises: [] });
  const [repeatStatus, setRepeatStatus] = useState(repeatId && !restored ? 'loading' : 'ready');
  const [library, setLibrary] = useState([]);
  const [previous, setPrevious] = useState({});
  const [loading, setLoading] = useState(true);
  const [libraryProblem, setLibraryProblem] = useState(false);
  const [historyStatus, setHistoryStatus] = useState('loading');
  const [enterManually, setEnterManually] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [picking, setPicking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getExercises().then((response) => {
      if (active) {
        setLibrary(response.data.data.exercises);
        setLibraryProblem(false);
      }
    }).catch(() => {
      if (active) setLibraryProblem(true);
    }).finally(() => {
      if (active) setLoading(false);
    });

    getLastSets().then((response) => {
      if (active) {
        setPrevious(response.data.data.lastSets);
        setHistoryStatus('ready');
      }
    }).catch(() => {
      if (active) setHistoryStatus('error');
    });

    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (!repeatId || restored) return;
    let active = true;
    getSessionById(repeatId).then((response) => {
      if (active) {
        setDraft(createRepeatDraft(response.data.data.session));
        setRepeatStatus('ready');
      }
    }).catch(() => {
      if (active) setRepeatStatus('error');
    });
    return () => { active = false; };
  }, [repeatId, restored]);

  useEffect(() => {
    if (repeatStatus === 'ready') storeWorkoutDraft(draftKey, draft);
  }, [draft, draftKey, repeatStatus]);

  const waitingForSets = historyStatus === 'loading' && !enterManually;
  const selected = new Set(draft.exercises.map((exercise) => exercise.exerciseId));
  const count = draft.exercises.length;
  const sets = draft.exercises.flatMap((exercise) => exercise.sets);
  const setCount = sets.length;
  const volume = sets.reduce((sum, set) => {
    const weight = Number(set.weight);
    const reps = Number(set.reps);
    return set.completed && weight >= 0 && reps >= 0 ? sum + weight * reps : sum;
  }, 0);

  function retry() {
    setLoading(true);
    setHistoryStatus('loading');
    setAttempt((value) => value + 1);
  }

  function closePicker() {
    setPicking(false);
    addButton.current?.focus();
  }

  function addExercise(exercise) {
    const newExercise = createDraftExercise(exercise, previous[exercise._id]);
    if (exercise.equipment === 'Bodyweight' && newExercise.sets[0].weight === '') {
      newExercise.sets[0].weight = 0;
    }
    setDraft((current) => ({ ...current, exercises: [...current.exercises, newExercise] }));
    setError('');
    closePicker();
  }

  function updateExercise(exerciseId, update) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? update(exercise) : exercise),
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    if (!count) {
      setError('Add an exercise before saving your workout.');
      return;
    }

    const invalid = draft.exercises.find(({ sets }) => sets.some(({ reps, weight, completed }) =>
      reps === '' || !Number.isInteger(Number(reps)) || Number(reps) < (completed ? 1 : 0) ||
      weight === '' || !Number.isFinite(Number(weight)) || Number(weight) < 0,
    ));
    if (invalid) {
      setError(`Check the weight and reps for ${invalid.name}. A completed set needs at least one rep.`);
      return;
    }

    const exercises = draft.exercises.map(({ exerciseId, name, sets }) => ({
      exerciseId, name,
      sets: sets.map(({ weight, reps, completed }) => ({ weight: Number(weight), reps: Number(reps), completed })),
    }));

    setError('');
    saving.current = true;
    setSubmitting(true);
    try {
      const response = await createSession({ name: draft.name.trim() || 'Workout', exercises });
      clearSubmittedWorkoutDraft(draftKey, draft);
      if (mounted.current) {
        navigate(`/session/${response.data.data.session._id}`, { replace: true, state: { saved: true } });
      }
    } catch (err) {
      if (mounted.current) setError(err.response?.data?.message || 'Could not save this workout. Your entries are still here.');
    } finally {
      saving.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }

  if (repeatStatus !== 'ready') {
    return (
      <div className="page">
        <header className="page-head"><h1>Log workout</h1></header>
        {repeatStatus === 'loading' ? <p className="muted" role="status">Opening your workout…</p> : (
          <div className="notice error with-action">
            <p role="alert">Could not open that workout.</p>
            <Link to="/new-session" replace className="text-button">Start a blank workout</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head workout-heading">
        <div><h1>Log workout</h1>{restored && <p className="muted small">Draft restored</p>}</div>
        <RestTimer />
      </header>

      <div className="workout-toolbar">
        <button
          className="button primary" type="button" ref={addButton}
          disabled={loading || libraryProblem || submitting}
          aria-expanded={picking} aria-controls={picking ? 'exercise-picker' : undefined}
          onClick={() => setPicking(!picking)}
        >
          {picking ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
          {picking ? 'Close library' : 'Add exercise'}
        </button>
        <span className="muted small" aria-live="polite">
          {loading ? 'Loading exercise library…' : `${count} exercise${count === 1 ? '' : 's'} · ${setCount} set${setCount === 1 ? '' : 's'}`}
        </span>
      </div>

      {(libraryProblem || historyStatus === 'error') && (
        <div className="notice with-action">
          <span role="status">{libraryProblem ? 'Could not load the exercise library.' : 'Previous sets are unavailable. You can enter values manually.'}</span>
          <button className="text-button" type="button" disabled={loading} onClick={retry}>Retry</button>
        </div>
      )}
      {!loading && !libraryProblem && waitingForSets && (
        <div className="notice with-action">
          <span role="status">Loading previous sets…</span>
          <button className="text-button" type="button" onClick={() => setEnterManually(true)}>Enter sets manually</button>
        </div>
      )}

      <div className={picking ? 'composer picker-open' : 'composer'}>
        {picking && (
          <aside className="composer-picker">
            <ExercisePicker exercises={library} selected={selected} waitingForSets={waitingForSets} onSelect={addExercise} onCreate={(exercise) => {
              setLibrary((current) => [...current, exercise]);
              addExercise(exercise);
            }} />
          </aside>
        )}
        <form className="composer-main" onSubmit={save} noValidate>
          <fieldset className="stack" disabled={submitting}>
            <label className="field workout-name">
              Workout name <span className="muted small">(optional)</span>
              <input value={draft.name} maxLength={100} placeholder="e.g. Upper body" onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            {count === 0 && (
              <div className="panel empty composer-empty">
                <Dumbbell size={25} aria-hidden="true" />
                <h2>No exercises yet</h2>
                <p className="muted">Pick an exercise to start logging your sets.</p>
              </div>
            )}
            {draft.exercises.map((exercise) => {
              const id = exercise.exerciseId;
              const lastSets = previous[id] ?? [];
              return (
                <WorkoutSetEditor key={id} exercise={exercise} previous={lastSets}
                  update={(setId, field, value) => updateExercise(id, (current) => ({
                    ...current,
                    sets: current.sets.map((set) => set.id === setId ? { ...set, [field]: value } : set),
                  }))}
                  onAddSet={(copyLast) => {
                    const set = copyLast ? copySet(exercise.sets.at(-1)) : nextSet(exercise.sets, lastSets);
                    updateExercise(id, (current) => ({ ...current, sets: [...current.sets, set] }));
                  }}
                  onRemoveSet={(setId) => updateExercise(id, (current) => ({
                    ...current, sets: current.sets.filter((set) => set.id !== setId),
                  }))}
                  onRemove={() => setDraft((current) => ({
                    ...current, exercises: current.exercises.filter((item) => item.exerciseId !== id),
                  }))}
                />
              );
            })}
          </fieldset>
          <footer className="workout-save">
            {error && <p className="notice error" role="alert">{error}</p>}
            <div className="workout-save-row">
              <div className="workout-volume">
                <span className="muted small">Completed volume</span>
                <strong>{volumeFormat.format(volume)} kg</strong>
              </div>
              <button className="button primary" type="submit" disabled={submitting || !count}>
                <Check size={18} aria-hidden="true" /> {submitting ? 'Saving…' : 'Save workout'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
