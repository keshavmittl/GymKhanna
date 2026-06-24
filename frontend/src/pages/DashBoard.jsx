import { useAuth } from '../hooks/useAuth';
import WaterWidget from '../components/WaterWidget';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-[#e0322f] text-xs font-bold tracking-[0.2em] uppercase mb-1">Dashboard</p>
        <h1 className="text-3xl font-bold mb-8">
          {user ? `Welcome back, ${user.name}` : 'Welcome back'}
        </h1>

        <WaterWidget />
      </div>
    </div>
  );
}