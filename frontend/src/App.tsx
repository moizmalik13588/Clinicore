import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ui/auth/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Layout from './components/ui/layout/Layout';
import Login from './pages/Login';
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from './components/ui/Skeleton';
import Spinner from './components/ui/Spinner';


const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const PatientCRM = lazy(() => import('./pages/PatientCRM'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Calls = lazy(() => import('./pages/Calls'));
const MoodAnalytics = lazy(() => import('./pages/MoodAnalytics'));
const Setup = lazy(() => import('./pages/Setup'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Register = lazy(() => import('./pages/Register'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={
                    <ErrorBoundary>
                      <Suspense fallback={<DashboardSkeleton />}>
                        <Dashboard />
                      </Suspense>
                    </ErrorBoundary>
                  } />
                  <Route path="/patients" element={<ErrorBoundary><Patients /></ErrorBoundary>} />
                  <Route path="/doctors" element={<ErrorBoundary><Doctors /></ErrorBoundary>} />
                  <Route path="/patients/:id" element={<ErrorBoundary><PatientCRM /></ErrorBoundary>} />
                  <Route path="/appointments" element={<ErrorBoundary><Appointments /></ErrorBoundary>} />
                  <Route path="/calls" element={<ErrorBoundary><Calls /></ErrorBoundary>} />
                  <Route path="/mood" element={<ErrorBoundary><MoodAnalytics /></ErrorBoundary>} />
                  <Route path="/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
                  <Route path="/setup" element={<ErrorBoundary><Setup /></ErrorBoundary>} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}