import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatients from './pages/DoctorPatients';
import DoctorReports from './pages/DoctorReports';
import DoctorAnalytics from './pages/DoctorAnalytics';
import LiveExercisePage from './pages/LiveExercisePage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'patient' | 'doctor' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            {user?.role === 'patient' ? <PatientDashboard /> : <DoctorDashboard />}
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={
        <ProtectedRoute requiredRole="patient">
          <Layout>
            <PatientDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/patient/exercise/:exerciseId" element={
        <ProtectedRoute requiredRole="patient">
          <Layout>
            <LiveExercisePage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/patient/progress" element={
        <ProtectedRoute requiredRole="patient">
          <Layout>
            <ProgressPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={
        <ProtectedRoute requiredRole="doctor">
          <Layout>
            <DoctorDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/patients" element={
        <ProtectedRoute requiredRole="doctor">
          <Layout>
            <DoctorPatients />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/reports" element={
        <ProtectedRoute requiredRole="doctor">
          <Layout>
            <DoctorReports />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/analytics" element={
        <ProtectedRoute requiredRole="doctor">
          <Layout>
            <DoctorAnalytics />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Common Routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
