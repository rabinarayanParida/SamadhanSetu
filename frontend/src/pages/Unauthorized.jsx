import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon">🚫</div>
        <h1>403 — Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p className="error-sub">
          This page is restricted to specific user roles. If you believe this is
          an error, please contact the administrator.
        </p>
        <Link to="/" className="btn btn-submit">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
