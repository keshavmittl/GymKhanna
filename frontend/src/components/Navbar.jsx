import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/new-session', label: 'New Session' },
  { to: '/bodyweight', label: 'Weight' },
  { to: '/progress', label: 'Progress' },
];

export default function Navbar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-[#0a0a0a] border-b border-[#1f1f1f] px-6 py-4">
      <div className="max-w-2xl mx-auto flex justify-between items-center">
        <div className="flex gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to ? 'text-[#e0322f]' : 'text-[#888] hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button onClick={logout} className="text-[#555] hover:text-[#e0322f] text-sm transition-colors">
          Logout
        </button>
      </div>
    </nav>
  );
}