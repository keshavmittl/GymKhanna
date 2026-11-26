import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';

const DURATIONS = [45, 60, 90, 120, 180];

export default function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [deadline, setDeadline] = useState(null);
  const active = deadline !== null;
  const finished = remaining === 0;
  const paused = !active && !finished && remaining < duration;
  const time = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) setDeadline(null);
    }, 200);
    return () => clearInterval(timer);
  }, [deadline]);

  function reset(seconds = duration) {
    setDeadline(null);
    setRemaining(seconds);
  }

  function toggle() {
    if (active) {
      reset(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      return;
    }
    const seconds = finished ? duration : remaining;
    setRemaining(seconds);
    setDeadline(Date.now() + seconds * 1000);
  }

  return (
    <section className="rest-timer" aria-label="Rest timer">
      <div className="timer-heading">
        <Timer size={17} aria-hidden="true" />
        <span role="timer" aria-label="Remaining rest time">{time}</span>
      </div>
      <select aria-label="Rest duration" value={duration} disabled={active} onChange={(event) => {
        const seconds = Number(event.target.value);
        setDuration(seconds);
        reset(seconds);
      }}>
        {DURATIONS.map((seconds) => <option value={seconds} key={seconds}>{seconds} s</option>)}
      </select>
      <button className="button timer-action" type="button" onClick={toggle}>
        {active ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
        {active ? 'Pause rest' : paused ? 'Resume rest' : 'Start rest'}
      </button>
      {(active || remaining !== duration) && (
        <button className="icon-button timer-reset" type="button" aria-label="Reset rest timer" onClick={() => reset()}>
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      )}
      <span className={finished ? 'timer-complete' : 'sr-only'} role="status">{finished ? 'Rest complete' : ''}</span>
    </section>
  );
}
