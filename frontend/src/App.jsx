import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import NewSession from './pages/NewSession';
import SessionDetail from './pages/SessionDetail';
import BodyWeight from './pages/BodyWeight';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

const Progress = lazy(() => import('./pages/Progress'));

function AppLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <p className="screen-status" role="status">Opening GymKhanna…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<p className="screen-status" role="status">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="new-session" element={<NewSession />} />
              <Route path="history" element={<History />} />
              <Route path="session/:id" element={<SessionDetail />} />
              <Route path="bodyweight" element={<BodyWeight />} />
              <Route path="progress" element={<Progress />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
