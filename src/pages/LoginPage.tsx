import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CalendarCheck, AlertCircle, Loader2, UserCheck, Shield, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid username or password. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Smart Campus Portal
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Sign in to manage event schedules, campus venues, and equipment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="e.g. admin or prof_smith"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Sign-in Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Quick Demo Access
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'adminpassword')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-center text-center"
              >
                <Shield className="w-4 h-4 text-slate-700 mb-1" />
                <span className="text-[11px] font-semibold text-slate-900">Admin</span>
                <span className="text-[10px] text-slate-500">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('prof_smith', 'facultypassword')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-center text-center"
              >
                <Briefcase className="w-4 h-4 text-slate-700 mb-1" />
                <span className="text-[11px] font-semibold text-slate-900">Faculty</span>
                <span className="text-[10px] text-slate-500">Book Halls</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('student_alice', 'studentpassword')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-center text-center"
              >
                <GraduationCap className="w-4 h-4 text-slate-700 mb-1" />
                <span className="text-[11px] font-semibold text-slate-900">Student</span>
                <span className="text-[10px] text-slate-500">Register</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
