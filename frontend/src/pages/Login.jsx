import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSafeRedirect } from '../utils/roles';

const USER_TYPES = [
  { id: 'people', label: 'People', icon: '👥' },
  { id: 'university', label: 'University', icon: '🎓' },
  { id: 'admin', label: 'Admin', icon: '🏛️' },
  { id: 'industry', label: 'Industry', icon: '💼' },
];

export default function Login() {
  const [userType, setUserType] = useState('people');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    setError('');
  };

  const validate = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email address.';
    if (!formData.password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await login(formData.email, formData.password, userType);
      if (data.success) {
        const targetUrl = getSafeRedirect(rawFrom, data.data.user.role);
        navigate(targetUrl, { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      if (err.response?.data?.errors) {
        const mapped = {};
        err.response.data.errors.forEach((e) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/logo.png" alt="SamadhanSetu Logo" className="auth-logo-image" />
          </div>
          <h1>Sign In to SamadhanSetu</h1>
          <p>Access your account to track or manage societal challenges across Jharkhand</p>
        </div>

        {/* User-Type Selector */}
        <div className="login-user-type-container">
          <div className="login-user-type-title">Who are you logging in as?</div>
          <div className="login-user-type-tabs" role="tablist" aria-label="Who are you logging in as?">
            {USER_TYPES.map((t) => {
              const isSelected = userType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`login-user-type-tab ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setUserType(t.id);
                    setError('');
                  }}
                >
                  <span className="tab-icon">{t.icon}</span>
                  <span className="tab-text">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.org"
              className={fieldErrors.email ? 'input-error' : ''}
              autoComplete="email"
              autoFocus
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter account password"
              className={fieldErrors.password ? 'input-error' : ''}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className="btn btn-submit" disabled={isLoading} style={{ marginTop: '6px' }}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Do not have an account?{' '}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
