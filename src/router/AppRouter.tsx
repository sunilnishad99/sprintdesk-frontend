import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { useBootstrapSession } from '../features/auth/useAuth';

// Route-level code splitting (Task 06 requirement)
const LoginPage = lazy(() => import('../pages/LoginPage'));
const AppLayout = lazy(() => import('../layouts/AppLayout'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const BoardPage = lazy(() => import('../pages/BoardPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));

export function AppRouter() {
  const { isInitializing } = useBootstrapSession();

  // Full-screen loader while we validate the refresh token on boot
  if (isInitializing) return <FullScreenLoader />;

  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
