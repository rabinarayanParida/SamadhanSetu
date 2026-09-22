import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true, state: {} });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <img src="/logo.png" alt="SamadhanSetu Logo" className="logo-image" />
          </div>
          <span className="navbar-title">SamadhanSetu</span>
          <span className="navbar-subtitle">Jharkhand</span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to={`/dashboard/${user.role}`} className="navbar-link">
                Dashboard
              </Link>
              {user.role === 'citizen' && (
                <>
                  <Link to="/citizen/challenges" className="navbar-link">
                    My Challenges
                  </Link>
                  <Link to="/citizen/challenges/new" className="btn btn-primary-nav btn-sm">
                    + Report Challenge
                  </Link>
                </>
              )}
              {(user.role === 'admin' || user.role === 'government') && (
                <Link to="/admin/challenges" className="navbar-link">
                  Review Queue
                </Link>
              )}
              <div className="navbar-user">
                <span className="role-indicator">
                  {user.role}
                </span>
                <span className="user-name">{user.full_name}</span>
                <button onClick={handleLogout} className="btn btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary-nav">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
