import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut } from "lucide-react";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/new-session", label: "New Session" },
  { to: "/bodyweight", label: "Weight" },
  { to: "/progress", label: "Progress" },
];

const handleLogout = () => {
  const confirmed = window.confirm("Are you sure you want to log out?");
  if (confirmed) {
    logout();
  }
};
export default function Navbar() {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      logout();
    }
  };

  return (
 <nav className="bg-[#0a0a0a] border-b border-[#1f1f1f] px-4 py-4">
  <div className="max-w-6xl mx-auto flex items-center">
    <div className="flex-1 flex justify-center">
      <div className="flex gap-2 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-[#e0322f]"
                  : "text-[#888] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[#555] hover:text-[#e0322f] text-sm transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
