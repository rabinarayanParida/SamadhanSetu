import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { normalizeRole } from './utils/roles';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import CitizenDashboard from './pages/dashboards/CitizenDashboard';
import UniversityDashboard from './pages/dashboards/UniversityDashboard';
import IndustryDashboard from './pages/dashboards/IndustryDashboard';
import GovernmentDashboard from './pages/dashboards/GovernmentDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ChallengeForm from './pages/citizen/ChallengeForm';
import MyChallenges from './pages/citizen/MyChallenges';
import ChallengeDetail from './pages/citizen/ChallengeDetail';
import ChallengeReviewQueue from './pages/admin/ChallengeReviewQueue';
import ChallengeReviewDetail from './pages/admin/ChallengeReviewDetail';
import UniversityProfile from './pages/admin/UniversityProfile';

function DashboardRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading portal...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = normalizeRole(user?.role);
  return <Navigate to={`/dashboard/${role}`} replace />;
}

function PublicLayout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages with Public Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="*"
          element={
            <div className="error-page">
              <div className="error-card">
                <div className="error-icon">🔍</div>
                <h1>404 — Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" className="btn btn-submit">← Back to Home</a>
              </div>
            </div>
          }
        />
      </Route>

      {/* Dashboard Redirects */}
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/citizen/dashboard" element={<Navigate to="/dashboard/citizen" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/government/dashboard" element={<Navigate to="/dashboard/government" replace />} />
      <Route path="/university/dashboard" element={<Navigate to="/dashboard/university" replace />} />
      <Route path="/industry/dashboard" element={<Navigate to="/dashboard/industry" replace />} />

      {/* Protected Routes (Wrapped by ProtectedRoute -> AppShell with Topbar + Sidebar) */}
      <Route
        path="/admin/challenges"
        element={
          <ProtectedRoute allowedRoles={['admin', 'government']}>
            <ChallengeReviewQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/challenges/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'government']}>
            <ChallengeReviewDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/universities/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'government', 'university']}>
            <UniversityProfile />
          </ProtectedRoute>
        }
      />

      {/* Challenge Detail Routes (Accessible by Citizen owner, matched/assigned University, and Admin/Gov) */}
      <Route
        path="/challenges/:id"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'university', 'admin', 'government']}>
            <ChallengeDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/challenges/:id"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'university', 'admin', 'government']}>
            <ChallengeDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/challenges/:id"
        element={
          <ProtectedRoute allowedRoles={['university', 'admin', 'government']}>
            <ChallengeDetail />
          </ProtectedRoute>
        }
      />

      {/* Citizen Challenge Management Routes */}
      <Route
        path="/citizen/challenges"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MyChallenges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/challenges/new"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <ChallengeForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/challenges/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <ChallengeForm />
          </ProtectedRoute>
        }
      />

      {/* Protected Role-Based Dashboard Routes */}
      <Route
        path="/dashboard/citizen"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/university"
        element={
          <ProtectedRoute allowedRoles={['university']}>
            <UniversityDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/industry"
        element={
          <ProtectedRoute allowedRoles={['industry']}>
            <IndustryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/government"
        element={
          <ProtectedRoute allowedRoles={['government']}>
            <GovernmentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
