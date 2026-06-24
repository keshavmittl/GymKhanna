import { useState, useEffect } from 'react';
import { logWater, getTodayWater } from '../api';
const QUICK_AMOUNTS = [250, 500, 1000];

export default function WaterWidget() {
  const [totalToday, setTotalToday] = useState(0);
  const [goal, setGoal] = useState(3000);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  const fetchToday = async () => {
    try {
      const response = await getTodayWater();
      const { totalToday, goal } = response.data.data;
      setTotalToday(totalToday);
      setGoal(goal);
    } catch (error) {
      console.error('Failed to load water data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleQuickAdd = async (amount) => {
    setLogging(true);
    try {
      await logWater({ amount });
      await fetchToday();
    } catch (error) {
      console.error('Failed to log water:', error);
    } finally {
      setLogging(false);
    }
  };

  const percentage = Math.min(100, Math.round((totalToday / goal) * 100));

  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 text-[#666] text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-[#666] text-xs uppercase tracking-wide font-semibold">Water Today</p>
        <p className="text-sm text-[#666]">
          <span className="text-[#f5f5f5] font-bold">{(totalToday / 1000).toFixed(2)}L</span> / {(goal / 1000).toFixed(1)}L
        </p>
      </div>

      <div className="h-2 bg-[#1f1f1f] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#3b9ee0] rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickAdd(amount)}
            disabled={logging}
            className="flex-1 bg-[#1c1c1c] hover:bg-[#222] disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            +{amount}ml
          </button>
        ))}
      </div>
    </div>
  );
}