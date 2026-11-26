import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSessions } from '../api';
import SessionList from '../components/SessionList';

export default function History() {
  const [sessions, setSessions] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getSessions().then((response) => {
      if (active) setSessions(response.data.data.sessions);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [attempt]);

  const search = query.trim().toLowerCase();
  const matches = sessions?.filter(({ name, exercises }) =>
    name.toLowerCase().includes(search) ||
    exercises.some((exercise) => exercise.name.toLowerCase().includes(search)),
  );

  return (
    <div className="page">
      <header className="page-head">
        <div><h1>Workout history</h1><p className="muted">Find a past workout to review or repeat.</p></div>
        <Link className="button primary" to="/new-session"><Plus size={18} aria-hidden="true" /> Log workout</Link>
      </header>
      <section className="panel">
        <label className="search-field history-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search workout history</span>
          <input type="search" placeholder="Search by workout or exercise" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {error ? (
          <div className="notice error with-action" role="status">
            <span>Could not load your workouts.</span>
            <button className="text-button" onClick={() => { setError(false); setAttempt((value) => value + 1); }}>Retry</button>
          </div>
        ) : !matches ? <p className="empty muted" role="status">Loading workouts…</p>
          : matches.length ? <SessionList sessions={matches} />
          : <p className="empty muted" role="status">{search ? 'No workouts match your search.' : 'Your logged workouts will appear here.'}</p>}
      </section>
    </div>
  );
}
