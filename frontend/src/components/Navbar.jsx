import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChartNoAxesCombined, Dumbbell, History, House, LogOut, Plus, Scale } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LINKS = [
  { to: '/', label: 'Journal', icon: House },
  { to: '/new-session', label: 'Log workout', compactLabel: 'Log', icon: Plus },
  { to: '/history', label: 'History', icon: History },
  { to: '/progress', label: 'Progress', icon: ChartNoAxesCombined },
  { to: '/bodyweight', label: 'Weight', icon: Scale },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="brand"><span className="brand-mark"><Dumbbell size={19} aria-hidden="true" /></span>GymKhanna</Link>
      <nav className="nav-list" aria-label="Main navigation">
        {LINKS.map(({ to, label, compactLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            aria-label={label}
            className={({ isActive }) => isActive || (to === '/history' && pathname.startsWith('/session/'))
              ? 'nav-link active' : 'nav-link'}
          >
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
            <span className={compactLabel ? 'nav-label-wide' : undefined} aria-hidden="true">{label}</span>
            {compactLabel && <span className="nav-label-compact" aria-hidden="true">{compactLabel}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-account">
        <span className="account-avatar" aria-hidden="true">{initials || 'G'}</span>
        <span className="account-name">{user?.name}</span>
        <button type="button" className="icon-button" title="Log out" aria-label="Log out" onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
