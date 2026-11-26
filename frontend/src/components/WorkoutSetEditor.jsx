import { Copy, Plus, Trash2, X } from 'lucide-react';
import SetSlider from './SetSlider';

export default function WorkoutSetEditor({ exercise, previous, update, onAddSet, onRemoveSet, onRemove }) {
  const { name, sets } = exercise;
  const lastSet = sets.at(-1);
  return (
    <section className="panel lift-card" aria-label={name}>
      <div className="section-head">
        <div>
          <h2>{name}</h2>
          {previous.length > 0 && (
            <p className="muted lift-previous">
              Last time{' '}
              {previous.map(({ weight, reps }, index) => (
                <span className="previous-set" key={index}>{weight} kg × {reps}{index < previous.length - 1 && ' ·'}</span>
              ))}
            </p>
          )}
        </div>
        <button type="button" className="icon-button" aria-label={`Remove ${name}`} onClick={onRemove}>
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="lift-sets">
        {sets.map((set, index) => {
          const label = `${name} set ${index + 1}`;
          return (
            <div className="lift-set" key={set.id}>
              <div className="lift-set-header">
                <span className="set-number">Set {index + 1}</span>
                <div className="lift-set-actions">
                  <label className="set-done">
                    <input className="set-check" type="checkbox" aria-label={`${label} completed`} checked={set.completed}
                      onChange={(event) => {
                        if (event.target.checked && set.reps !== '' && Number(set.reps) === 0) update(set.id, 'reps', 1);
                        update(set.id, 'completed', event.target.checked);
                      }}
                    />
                    Done
                  </label>
                  {sets.length > 1 && (
                    <button className="icon-button remove-set" type="button" aria-label={`Remove ${label}`} onClick={() => onRemoveSet(set.id)}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div className="lift-set-inputs">
                <SetSlider label={`${label} weight`} weight value={set.weight} onChange={(value) => update(set.id, 'weight', value)} />
                <SetSlider label={`${label} reps`} minimum={set.completed ? 1 : 0} value={set.reps} onChange={(value) => update(set.id, 'reps', value)} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="actions lift-set-footer">
        <button className="button" type="button" onClick={() => onAddSet(false)}><Plus size={17} aria-hidden="true" /> Add set</button>
        <button className="button" type="button" onClick={() => onAddSet(true)} disabled={lastSet.weight === '' || lastSet.reps === ''}>
          <Copy size={16} aria-hidden="true" /> Copy last set
        </button>
      </div>
    </section>
  );
}
