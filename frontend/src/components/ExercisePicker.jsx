import { useEffect, useRef, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { createExercise } from '../api';

const GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable'];

export default function ExercisePicker({ exercises, selected, waitingForSets, onSelect, onCreate }) {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    (custom ? nameRef : searchRef).current?.focus();
  }, [custom]);

  const search = query.trim().toLowerCase();
  const matches = exercises.filter(({ name, muscleGroup, equipment }) =>
    [name, muscleGroup, equipment].some((label) => label.toLowerCase().includes(search)),
  );

  async function handleCreate(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = values.get('name').trim();
    if (!name) {
      setError('Enter an exercise name.');
      return;
    }

    setAdding(true);
    setError('');
    try {
      const response = await createExercise({
        name, muscleGroup: values.get('muscleGroup'), equipment: values.get('equipment'),
      });
      onCreate(response.data.data.exercise);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the exercise. Try again.');
    } finally {
      setAdding(false);
    }
  }

  if (custom) {
    return (
      <form className="panel picker stack" id="exercise-picker" onSubmit={handleCreate}>
        <h2>Custom exercise</h2>
        <label className="field">Name<input ref={nameRef} name="name" maxLength={100} required /></label>
        <div className="form-cols">
          <label className="field">Muscle group
            <select name="muscleGroup">{GROUPS.map((group) => <option key={group}>{group}</option>)}</select>
          </label>
          <label className="field">Equipment
            <select name="equipment">{EQUIPMENT.map((name) => <option key={name}>{name}</option>)}</select>
          </label>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="actions">
          <button className="button primary" disabled={adding}>{adding ? 'Creating…' : 'Create and add'}</button>
          <button className="button" type="button" disabled={adding} onClick={() => setCustom(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <section className="panel picker stack" id="exercise-picker" aria-label="Exercise library">
      <div className="section-head">
        <h2>Exercise library</h2>
        <button type="button" className="text-button" onClick={() => { setError(''); setCustom(true); }}>New custom</button>
      </div>
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search exercises</span>
        <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an exercise" />
      </label>
      <div className="picker-results">
        {matches.length === 0 && <p className="muted empty">No matching exercises.</p>}
        {matches.map((exercise) => {
          const alreadyAdded = selected.has(exercise._id);
          return (
            <button key={exercise._id} className="picker-option" type="button" disabled={alreadyAdded || waitingForSets} onClick={() => onSelect(exercise)}>
              <span><strong>{exercise.name}</strong><small>{exercise.muscleGroup} · {exercise.equipment}</small></span>
              {alreadyAdded ? <Check size={18} aria-label="Added" /> : <Plus size={18} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
