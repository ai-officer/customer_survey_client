import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SurveyList from './components/SurveyList';
import SurveyForm from './components/SurveyForm';
import SurveyResponse from './components/SurveyResponse';
import DetailedAnalytics from './components/DetailedAnalytics';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import AuditLogs from './components/AuditLogs';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/s/:id" element={<SurveyResponse />} />

      {/* Protected admin routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/surveys" element={<SurveyList />} />
              <Route path="/surveys/new" element={<SurveyForm />} />
              <Route path="/surveys/edit/:id" element={<SurveyForm />} />
              <Route path="/analytics" element={<Dashboard />} />
              <Route path="/analytics/:id" element={<DetailedAnalytics />} />
              <Route path="/settings" element={
                <div className="p-8 bg-white rounded-2xl border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Settings</h2>
                  <p className="text-gray-500">Configure your Customer Survey System preferences.</p>
                </div>
              } />
              <Route path="/settings/users" element={
                <AdminRoute><UserManagement /></AdminRoute>
              } />
              <Route path="/settings/audit" element={
                <AdminRoute><AuditLogs /></AdminRoute>
              } />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
