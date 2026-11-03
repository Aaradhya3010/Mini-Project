import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { EventsListPage } from './pages/EventsListPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { AdminApprovalPage } from './pages/AdminApprovalPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/calendar" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/events" element={<EventsListPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/new"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <CreateEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/approvals"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminApprovalPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
