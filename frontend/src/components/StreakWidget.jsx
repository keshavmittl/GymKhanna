import { useState, useEffect } from 'react';
import { getGoalStatus, setWeeklyGoal } from '../api';

export default function StreakWidget() {
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  const fetchStatus = async () => {
    try {
      const response = await getGoalStatus();
      setGoalData(response.data.data);
    } catch (error) {
      console.error('Failed to load goal status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSetGoal = async (e) => {
    e.preventDefault();
    if (!newGoal) return;

    try {
      await setWeeklyGoal({ weeklyGoal: Number(newGoal) });
      setEditingGoal(false);
      setNewGoal('');
      await fetchStatus();
    } catch (error) {
      alert('Failed to update goal');
    }
  };

  if (loading || !goalData) {
    return (
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 text-[#666] text-sm">
        Loading…
      </div>
    );
  }

  const { weeklyGoal, sessionsThisWeek, currentStreak } = goalData;
  const sessionsLeft = Math.max(0, weeklyGoal - sessionsThisWeek);

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">This Week</p>
          <p className="text-2xl font-bold">
            {sessionsThisWeek} <span className="text-[#666] text-base font-normal">/ {weeklyGoal} sessions</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">Streak</p>
          <p className="text-2xl font-bold text-[#e0322f]">
            {currentStreak} <span className="text-base">🔥</span>
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: weeklyGoal }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < sessionsThisWeek ? 'bg-[#e0322f]' : 'bg-[#1f1f1f]'}`}
          />
        ))}
      </div>

      {sessionsLeft > 0 ? (
        <p className="text-[#888] text-sm">
          {sessionsLeft} more session{sessionsLeft > 1 ? 's' : ''} to keep your streak going
        </p>
      ) : (
        <p className="text-[#4ade80] text-sm font-medium">Goal hit — streak secured this week</p>
      )}

      {editingGoal ? (
        <form onSubmit={handleSetGoal} className="flex gap-2 mt-3">
          <input
            type="number"
            autoFocus
            placeholder="sessions/week"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="bg-[#1c1c1c] rounded-md px-3 py-1.5 text-sm flex-1 outline-none focus:ring-1 focus:ring-[#e0322f]"
          />
          <button type="submit" className="text-[#e0322f] text-xs font-semibold">Save</button>
        </form>
      ) : (
        <button
          onClick={() => setEditingGoal(true)}
          className="text-[#555] hover:text-[#e0322f] text-xs mt-3 transition-colors"
        >
          Change weekly goal
        </button>
      )}
    </div>
  );
}