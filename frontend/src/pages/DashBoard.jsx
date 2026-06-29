import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats } from '../api';
import WaterWidget from '../components/WaterWidget';
import StreakWidget from '../components/StreakWidget';
import PRList from '../components/PRList';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-[#e0322f] text-xs font-bold tracking-[0.2em] uppercase mb-1">Dashboard</p>
        <h1 className="text-3xl font-bold mb-8">
          {user ? `Welcome back, ${user.name}` : 'Welcome back'}
        </h1>

        {!loading && stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">Volume</p>
              <p className="text-2xl font-bold">{(stats.totalVolume / 1000).toFixed(1)}t</p>
            </div>
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">PRs Hit</p>
              <p className="text-2xl font-bold text-[#e0322f]">{stats.totalPRs}</p>
            </div>
          </div>
        )}

        <div className="space-y-5 mb-8">
          <StreakWidget />
          <WaterWidget />
          <PRList />
        </div>

        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#666] mb-3">Recent Sessions</h2>
        {!loading && stats && stats.recentSessions.length === 0 && (
          <p className="text-[#555] text-sm">No sessions yet — log your first workout.</p>
        )}
        {!loading && stats && stats.recentSessions.length > 0 && (
          <div className="space-y-2">
            {stats.recentSessions.map((session) => (
              <Link
                key={session._id}
                to={`/session/${session._id}`}
                className="flex justify-between items-center bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-xl px-4 py-3 transition-colors"
              >
                <div>
                  <p className="font-medium">{session.name}</p>
                  <p className="text-[#666] text-xs">
                    {new Date(session.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{session.totalVolume.toLocaleString()} kg</p>
                  {session.prs.length > 0 && (
                    <p className="text-[#e0322f] text-xs">{session.prs.length} PR{session.prs.length > 1 ? 's' : ''}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}