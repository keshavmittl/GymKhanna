import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { getWeightHistory, logWeight, setGoalWeight } from '../api';

const dateLabel = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

export default function BodyWeight() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getWeightHistory().then((response) => {
      if (active) setData(response.data.data);
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [attempt]);

  async function save(event, isGoal) {
    event.preventDefault();
    const form = event.currentTarget;
    const weight = Number(new FormData(form).get('weight'));
    setBusy(true);
    setError('');
    setMessage('');
    setLoadError(false);

    try {
      if (isGoal) {
        await setGoalWeight({ goalWeight: weight });
        setEditing(false);
        setMessage('Goal updated.');
      } else {
        await logWeight({ weight });
        form.reset();
        setMessage('Weight logged.');
      }
      setAttempt((value) => value + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your entry. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const { entries, goalWeight, progress } = data ?? {};
  const current = entries?.at(-1)?.weight;

  return (
    <div className="page">
      <header className="page-head"><div><h1>Body weight</h1><p className="muted">Log your weight and check in on your goal.</p></div></header>
      {loadError && (
        <div className="notice error with-action" role="status">
          <span>Could not load your weight history.</span>
          <button className="text-button" onClick={() => { setLoadError(false); setAttempt((value) => value + 1); }}>Retry</button>
        </div>
      )}
      {!data && !loadError && <p className="muted" role="status">Loading weight history…</p>}
      {data && (
        <div className="weight-layout">
          <div className="stack">
            <section className="panel widget stack">
              <h2><Scale size={19} aria-hidden="true" /> Weight goal</h2>
              <div className="weight-metrics">
                <div><span className="small muted">Current</span><strong>{current == null ? '—' : `${current} kg`}</strong></div>
                <div><span className="small muted">Target</span><strong>{goalWeight == null ? '—' : `${goalWeight} kg`}</strong></div>
              </div>
              {progress != null && (
                <>
                  <progress aria-label="Progress toward weight goal" value={progress} max="100" />
                  <p className="muted small">{progress}% of the way to your goal</p>
                </>
              )}
              {editing ? (
                <form className="inline-form" onSubmit={(event) => save(event, true)}>
                  <label className="field">Target (kg)<input name="weight" type="number" inputMode="decimal" min="0.01" step="any" defaultValue={goalWeight ?? ''} required /></label>
                  <button className="button primary" disabled={busy}>Save</button>
                  <button className="text-button" type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
                </form>
              ) : <button className="text-button" type="button" onClick={() => setEditing(true)}>{goalWeight == null ? 'Set a goal' : 'Edit goal'}</button>}
            </section>
            <section className="panel widget stack">
              <h2>Log today’s weight</h2>
              <form className="inline-form" onSubmit={(event) => save(event, false)}>
                <label className="field">Weight (kg)<input name="weight" type="number" inputMode="decimal" min="0.01" step="any" required /></label>
                <button className="button primary" disabled={busy}>Log weight</button>
              </form>
              {message && <p className="small" role="status">{message}</p>}
              {error && <p className="notice error" role="alert">{error}</p>}
            </section>
          </div>
          <section className="panel widget stack">
            <h2>Weight history</h2>
            {entries.length
              ? <ul className="plain-list">{[...entries].reverse().map((entry) => (
                <li key={entry._id}><time dateTime={entry.date}>{dateLabel.format(new Date(entry.date))}</time><strong>{entry.weight} kg</strong></li>
              ))}</ul>
              : <p className="muted">Your first weigh-in will appear here.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
