import { useEffect, useState } from 'react';
import { ArrowLeft, Repeat2, Trash2 } from 'lucide-react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { getSessionById, deleteSession } from '../api';

const dateLabel = new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' });
const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export default function SessionDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let active = true;
    setSession(null);
    setLoadError('');
    getSessionById(id).then((response) => {
      if (active) setSession(response.data.data.session);
    }).catch((error) => {
      if (active) setLoadError(error.response?.status === 404 ? 'Workout not found.' : 'Could not open this workout.');
    });
    return () => { active = false; };
  }, [id]);

  async function remove() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteSession(id);
      navigate('/history', { replace: true });
    } catch {
      setDeleteError('Could not delete this workout. Try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <Link className="text-button back-link" to="/history"><ArrowLeft size={18} aria-hidden="true" /> Workout history</Link>
      {loadError ? <p className="notice error" role="alert">{loadError}</p>
        : !session ? <p className="muted" role="status">Loading workout…</p>
        : (
          <>
            <header className="page-head">
              <div><h1>{session.name}</h1><p className="muted">{dateLabel.format(new Date(session.date))}</p></div>
              <Link to="/new-session" state={{ repeatId: session._id }} className="button primary"><Repeat2 size={18} aria-hidden="true" /> Repeat workout</Link>
            </header>
            {state?.saved && <p className="notice" role="status">Workout saved.</p>}
            <div className="detail-summary panel">
              <div><span className="muted small">Exercises</span><strong>{session.exercises.length}</strong></div>
              <div><span className="muted small">Total volume</span><strong>{number.format(session.totalVolume)} kg</strong></div>
              <div><span className="muted small">PRs hit</span><strong>{session.prs.length}</strong></div>
            </div>
            <div className="stack">
              {session.exercises.map((exercise) => (
                <section className="panel lift-card" key={exercise._id}>
                  <div className="section-head">
                    <h2>{exercise.name}</h2>
                    <span className="small muted">
                      {number.format(exercise.sets.reduce((sum, set) =>
                        set.completed === false ? sum : sum + set.reps * set.weight, 0))} kg volume
                    </span>
                  </div>
                  <table className="set-table">
                    <thead><tr><th scope="col">Set</th><th scope="col">Weight</th><th scope="col">Reps</th><th scope="col">Status</th></tr></thead>
                    <tbody>
                      {exercise.sets.map((set, index) => (
                        <tr key={set._id}>
                          <td>{index + 1}</td><td>{set.weight} kg</td><td>{set.reps}</td><td>{set.completed === false ? 'Incomplete' : 'Done'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
            <div className="delete-area">
              {confirming ? (
                <div className="notice error stack">
                  <p>Delete this workout from your history?</p>
                  {deleteError && <p role="alert">{deleteError}</p>}
                  <div className="actions">
                    <button type="button" className="button danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete workout'}</button>
                    <button type="button" className="button" disabled={deleting} onClick={() => { setConfirming(false); setDeleteError(''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="text-button danger-text" type="button" onClick={() => setConfirming(true)}>
                  <Trash2 size={17} aria-hidden="true" /> Delete workout
                </button>
              )}
            </div>
          </>
        )}
    </div>
  );
}
