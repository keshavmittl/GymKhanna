import { useState } from 'react';
import { Expand, Shrink } from 'lucide-react';

function numericValue(value) {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value)
    : null;
}

function sliderBounds(anchor, minimum, weight, wide) {
  if (!weight) return [minimum, Math.max(25, Math.ceil((anchor + 5) / 5) * 5)];
  if (wide) return [0, Math.max(250, Math.ceil((anchor + 50) / 50) * 50)];
  if (anchor === null) return [0, 80];

  return [
    Math.max(0, Math.floor((anchor - 20) / 5) * 5),
    Math.max(40, Math.ceil((anchor + 20) / 5) * 5),
  ];
}

export default function SetSlider({ label, value, onChange, minimum = 0, weight = false }) {
  const [anchor, setAnchor] = useState(() => numericValue(value));
  const [wide, setWide] = useState(false);
  const [editing, setEditing] = useState(false);
  const [min, max] = sliderBounds(anchor, minimum, weight, wide);
  const numeric = numericValue(value);
  const thumb = Math.min(max, Math.max(min, numeric ?? min));
  const percent = max > min ? (thumb - min) / (max - min) * 100 : 0;
  const unit = weight ? 'kg' : 'reps';
  const display = value === '' ? '—' : value;

  function finishEditing() {
    if (numeric !== null && (numeric < min || numeric > max)) setAnchor(numeric);
    setEditing(false);
  }

  function toggleRange() {
    setAnchor(numeric);
    setWide(!wide);
  }

  return (
    <div className="set-slider">
      <div className="set-slider-heading">
        <span>{weight ? 'Weight' : 'Reps'}</span>
        {weight && (
          <button type="button" className="slider-range-button" aria-label={`${wide ? 'Narrow' : 'Widen'} weight range for ${label}`} onClick={toggleRange}>
            {wide ? <Shrink size={14} aria-hidden="true" /> : <Expand size={14} aria-hidden="true" />}
            {wide ? 'Narrow' : 'Widen'}
          </button>
        )}
      </div>

      <div className="slider-readout">
        {editing ? (
          <input
            type="number"
            aria-label={`Exact ${label}`}
            autoFocus
            min={minimum}
            step={weight ? 'any' : 1}
            inputMode={weight ? 'decimal' : 'numeric'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={finishEditing}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        ) : (
          <button type="button" aria-label={`${display}, enter exact ${label}`} title="Enter an exact value" onClick={() => setEditing(true)}>
            {display}
          </button>
        )}
        <span>{unit}</span>
      </div>

      <input
        type="range"
        className="set-range"
        aria-label={label}
        aria-valuetext={numeric === null ? `Unset, ${thumb} ${unit}` : `${numeric} ${unit}`}
        min={min}
        max={max}
        step={1}
        value={thumb}
        style={{ '--range-progress': `${percent}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={(event) => {
          if (value === '') onChange(Number(event.currentTarget.value));
        }}
      />
      <div className="slider-endpoints" aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}
