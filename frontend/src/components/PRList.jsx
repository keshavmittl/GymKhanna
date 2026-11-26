import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { getPRs } from '../api';

export default function PRList() {
  const [prs, setPrs] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getPRs().then((response) => {
      if (active) setPrs(response.data.data.prs);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <section className="panel widget stack">
      <h2><Trophy size={18} aria-hidden="true" /> Personal records</h2>
      {error ? (
        <div className="with-action small" role="status">
          <span>Could not load records.</span>
          <button className="text-button" onClick={() => { setError(false); setAttempt((value) => value + 1); }}>Retry</button>
        </div>
      ) : !prs ? <p className="muted small" role="status">Loading records…</p>
        : !prs.length ? <p className="muted small">Your heaviest lifts will appear here.</p>
        : (
          <ul className="plain-list">
            {prs.map((pr) => <li key={pr.exerciseId}><span>{pr.name}</span><strong>{pr.weight} kg</strong></li>)}
          </ul>
        )}
    </section>
  );
}
