import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isRoleAllowed } from '../utils/roles';
import AppShell from './AppShell';

/**
 * ProtectedRoute — guards routes by auth status and role,
 * and renders authenticated views inside the global AppShell.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} [props.allowedRoles] - Roles permitted to access this route
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading SamadhanSetu...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !isRoleAllowed(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <AppShell>{children}</AppShell>;
}
