import { Minus, Plus, Trash2, X } from 'lucide-react';

function NumberStepper({ label, value, onChange, minimum, integer }) {
  const step = (delta) => {
    const number = value === '' ? 0 : Number(value);
    onChange(Math.max(minimum, Number((number + delta).toFixed(3))));
  };

  return (
    <div className="stepper">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value === '' || Number(value) <= minimum} onClick={() => step(-1)}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        type="number"
        aria-label={label}
        value={value}
        min={minimum}
        step={integer ? 1 : 'any'}
        inputMode={integer ? 'numeric' : 'decimal'}
        placeholder="—"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          step(event.key === 'ArrowUp' ? 1 : -1);
        }}
      />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => step(1)}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function WorkoutSetEditor({ exercise, previous, update, onAddSet, onRemoveSet, onRemove }) {
  const { name, sets } = exercise;
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
      <div className="set-grid set-labels" aria-hidden="true">
        <span>Set</span><span>Weight (kg)</span><span>Reps</span><span>Done</span><span />
      </div>
      {sets.map((set, index) => {
        const label = `${name} set ${index + 1}`;
        return (
          <div className="set-grid set-row" key={set.id}>
            <span className="set-number">{index + 1}</span>
            <NumberStepper label={`${label} weight`} minimum={0} value={set.weight} onChange={(value) => update(set.id, 'weight', value)} />
            <NumberStepper label={`${label} reps`} minimum={set.completed ? 1 : 0} integer value={set.reps} onChange={(value) => update(set.id, 'reps', value)} />
            <input className="set-check" type="checkbox" aria-label={`${label} completed`} checked={set.completed} onChange={(event) => update(set.id, 'completed', event.target.checked)} />
            <button className="icon-button remove-set" type="button" aria-label={`Remove ${label}`} disabled={sets.length === 1} onClick={() => onRemoveSet(set.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button className="button add-set" type="button" onClick={onAddSet}><Plus size={17} aria-hidden="true" /> Add set</button>
    </section>
  );
}
