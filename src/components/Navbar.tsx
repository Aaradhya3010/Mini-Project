import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
      isActive
        ? 'text-slate-900 border-b-2 border-slate-900 pb-1'
        : 'text-slate-600 hover:text-slate-900 pb-1'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight whitespace-nowrap shrink-0 hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span>Smart Campus</span>
        </Link>

        {/* Zone 2: 4–5 single-line nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
          <NavLink to="/calendar" className={linkClass}>
            Calendar
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Events
          </NavLink>
          {isAuthenticated && (role === 'FACULTY' || role === 'ADMIN') && (
            <NavLink to="/events/new" className={linkClass}>
              Book Hall
            </NavLink>
          )}
          {isAuthenticated && role === 'ADMIN' && (
            <NavLink to="/admin/approvals" className={linkClass}>
              Approvals
            </NavLink>
          )}
        </nav>

        {/* Zone 3: Account / Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              <NotificationDropdown />
              <div className="h-5 w-px bg-slate-200 mx-1" aria-hidden="true" />
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {role === 'ADMIN' ? 'Administrator' : role === 'FACULTY' ? 'Faculty' : 'Student'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
