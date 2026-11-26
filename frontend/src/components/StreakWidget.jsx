import { useEffect, useState } from 'react';
import { CalendarDays, Flame } from 'lucide-react';
import { getGoalStatus, setWeeklyGoal } from '../api';

export default function StreakWidget() {
  const [goalData, setGoalData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getGoalStatus().then((response) => {
      if (active) setGoalData(response.data.data);
    }).catch(() => { if (active) setError('Could not load your weekly goal.'); });
    return () => { active = false; };
  }, [attempt]);

  async function changeGoal(event) {
    event.preventDefault();
    const weeklyGoal = Number(new FormData(event.currentTarget).get('weeklyGoal'));
    setError('');
    setSaving(true);
    try {
      await setWeeklyGoal({ weeklyGoal });
      setGoalData((data) => ({ ...data, weeklyGoal }));
      setEditing(false);
    } catch {
      setError('Could not update your weekly goal.');
    } finally {
      setSaving(false);
    }
  }

  const { weeklyGoal, sessionsThisWeek, currentStreak } = goalData ?? {};
  const remaining = Math.max(0, weeklyGoal - sessionsThisWeek);

  return (
    <section className="week-panel">
      <div className="section-head">
        <h2><CalendarDays size={19} aria-hidden="true" /> This week</h2>
        {goalData && <span className="streak"><Flame size={16} aria-hidden="true" /> {currentStreak ? `${currentStreak}-week streak` : 'No active streak'}</span>}
      </div>
      {goalData && (
        <>
          <p className="week-stat"><strong>{sessionsThisWeek}</strong> <span>/ {weeklyGoal} workouts</span></p>
          <progress aria-label="Weekly workout goal" value={Math.min(weeklyGoal, sessionsThisWeek)} max={Math.max(1, weeklyGoal)} />
          <p className="week-note">{remaining ? `${remaining} more to reach your weekly goal` : 'Weekly goal reached'}</p>
          {editing ? (
            <form className="inline-form" onSubmit={changeGoal}>
              <label className="field small">Workouts per week
                <input type="number" name="weeklyGoal" min="1" step="1" defaultValue={weeklyGoal} required />
              </label>
              <button className="button" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button className="text-button" type="button" disabled={saving} onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
            </form>
          ) : <button className="text-button" type="button" onClick={() => setEditing(true)}>Edit goal</button>}
        </>
      )}
      {error ? (
        <div className="week-note with-action" role="status">
          <span>{error}</span>
          {!goalData && <button className="text-button" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</button>}
        </div>
      ) : !goalData && <p className="week-note" role="status">Loading your goal…</p>}
    </section>
  );
}
