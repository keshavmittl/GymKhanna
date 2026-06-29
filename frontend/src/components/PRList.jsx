import { useState, useEffect } from 'react';
import { getPRs } from '../api';

export default function PRList() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        const response = await getPRs();
        setPrs(response.data.data.prs);
      } catch (error) {
        console.error('Failed to load PRs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPRs();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 text-[#666] text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
      <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-3">Personal Records</p>

      {prs.length === 0 ? (
        <p className="text-[#555] text-sm">Log a few sessions to start setting records.</p>
      ) : (
        <div className="space-y-2">
          {prs.map((pr) => (
            <div key={pr.exerciseId} className="flex justify-between items-center text-sm">
              <span className="text-[#ccc]">{pr.name}</span>
              <span className="font-bold text-[#e0322f]">{pr.weight} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}