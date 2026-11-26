import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Plus, Repeat2, Trophy, Weight } from 'lucide-react';
import { getDashboardStats } from '../api';
import WaterWidget from '../components/WaterWidget';
import StreakWidget from '../components/StreakWidget';
import PRList from '../components/PRList';
import SessionList from '../components/SessionList';

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getDashboardStats().then((response) => {
      if (active) setStats(response.data.data);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);

  const metrics = [
    { label: 'Workouts logged', value: stats?.totalSessions, icon: Dumbbell },
    { label: 'Total volume', value: stats && `${number.format(stats.totalVolume)} kg`, icon: Weight },
    { label: 'PRs hit', value: stats?.totalPRs, icon: Trophy },
  ];
  const latest = stats?.recentSessions[0];

  return (
    <div className="page">
      <header className="page-head journal-head">
        <div>
          <p className="eyebrow">{today.format(new Date())}</p>
          <h1>Training journal</h1>
        </div>
        <div className="actions">
          {latest && <Link className="button" to="/new-session" state={{ repeatId: latest._id }}><Repeat2 size={18} aria-hidden="true" /> Repeat last</Link>}
          <Link to="/new-session" className="button primary"><Plus size={19} aria-hidden="true" /> Log workout</Link>
        </div>
      </header>

      <div className="dashboard-top">
        <StreakWidget />
        <section aria-label="Training totals" className="metric-grid">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div className="metric" key={label}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <p className="muted small">{label}</p>
              <strong>{value ?? '—'}</strong>
            </div>
          ))}
        </section>
      </div>

      {failed && (
        <div className="notice error with-action" role="status">
          <span>Could not load your workout summary.</span>
          <button className="text-button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Retry</button>
        </div>
      )}

      <div className="dashboard-body">
        <section className="panel recent-workouts">
          <div className="section-head">
            <h2>Recent workouts</h2>
            <Link className="text-button" to="/history">View history <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {latest ? <SessionList sessions={stats.recentSessions} />
            : failed ? <p className="empty muted">Recent workouts are unavailable.</p>
            : !stats ? <p className="empty muted" role="status">Loading workouts…</p>
            : (
              <div className="empty">
                <p className="muted">You haven’t logged a workout yet.</p>
                <Link className="text-button" to="/new-session">Log your first workout <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            )}
        </section>
        <div className="stack">
          <WaterWidget />
          <PRList />
        </div>
      </div>
    </div>
  );
}
