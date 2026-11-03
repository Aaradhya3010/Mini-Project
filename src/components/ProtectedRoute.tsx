import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LoadingSpinner } from './Feedback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." className="min-h-[50vh]" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 mt-2">
          Your current account role (<span className="font-semibold">{role}</span>) does not have
          permission to view this page.
        </p>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
