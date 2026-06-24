import { useState, useEffect } from 'react';
import { getWeightHistory, logWeight, setGoalWeight } from '../api';

export default function BodyWeight() {
  const [entries, setEntries] = useState([]);
  const [goalWeight, setGoalWeightState] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newWeight, setNewWeight] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await getWeightHistory();
      const { entries, goalWeight, progress } = response.data.data;
      setEntries(entries);
      setGoalWeightState(goalWeight);
      setProgress(progress);
    } catch (error) {
      console.error('Failed to load weight history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : null;

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;

    setSubmitting(true);
    try {
      await logWeight({ weight: Number(newWeight) });
      setNewWeight('');
      await fetchHistory();
    } catch (error) {
      alert('Failed to log weight');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetGoal = async (e) => {
    e.preventDefault();
    if (!newGoal) return;

    setSubmitting(true);
    try {
      await setGoalWeight({ goalWeight: Number(newGoal) });
      setEditingGoal(false);
      setNewGoal('');
      await fetchHistory();
    } catch (error) {
      alert('Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#666] flex items-center justify-center font-sans">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-[#e0322f] text-xs font-bold tracking-[0.2em] uppercase mb-2">Body Weight</p>
        <h1 className="text-3xl font-bold mb-8">Track your progress</h1>

        {/* Progress card */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">Current</p>
              <p className="text-3xl font-bold">
                {currentWeight !== null ? `${currentWeight} kg` : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">Goal</p>
              {editingGoal ? (
                <form onSubmit={handleSetGoal} className="flex gap-2 items-center">
                  <input
                    type="number"
                    autoFocus
                    placeholder="kg"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="bg-[#1c1c1c] rounded-md px-2 py-1 text-sm w-20 outline-none focus:ring-1 focus:ring-[#e0322f]"
                  />
                  <button type="submit" className="text-[#e0322f] text-xs font-semibold">Save</button>
                </form>
              ) : (
                <button onClick={() => setEditingGoal(true)} className="text-2xl font-bold hover:text-[#e0322f] transition-colors">
                  {goalWeight !== null ? `${goalWeight} kg` : 'Set goal'}
                </button>
              )}
            </div>
          </div>

          {progress !== null && (
            <div>
              <div className="h-2 bg-[#1f1f1f] rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-[#e0322f] rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[#666] text-xs">{progress}% to goal</p>
            </div>
          )}
        </div>

        {/* Log new weight */}
        <form onSubmit={handleLogWeight} className="flex gap-3 mb-8">
          <input
            type="number"
            placeholder="Log today's weight (kg)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#1f1f1f] rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-[#e0322f]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#e0322f] hover:bg-[#c92825] disabled:opacity-50 text-white font-semibold px-5 rounded-lg transition-colors"
          >
            Log
          </button>
        </form>

        {/* History */}
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#666] mb-3">History</h2>
        {entries.length === 0 ? (
          <p className="text-[#555] text-sm">No entries yet.</p>
        ) : (
          <div className="space-y-1.5">
            {[...entries].reverse().map((entry) => (
              <div
                key={entry._id}
                className="flex justify-between items-center bg-[#141414] rounded-lg px-4 py-2.5 text-sm"
              >
                <span className="text-[#888]">
                  {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="font-semibold">{entry.weight} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}