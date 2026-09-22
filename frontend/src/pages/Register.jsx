import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'citizen', label: '👥 Citizen', desc: 'Submit societal challenges' },
  { value: 'university', label: '🎓 University', desc: 'Research & solve challenges' },
  { value: 'industry', label: '🏭 Industry / Startup', desc: 'Partner & deploy solutions' },
  { value: 'government', label: '🏛️ Government', desc: 'Monitor & oversee ecosystem' },
];

const jharkhandDistricts = [
  'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum',
  'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara',
  'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu',
  'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela-Kharsawan', 'Simdega',
  'West Singhbhum',
];

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: '',
    organization: '',
    phone: '',
    district: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    setError('');
  };

  const needsOrganization = ['university', 'industry', 'government'].includes(formData.role);

  const validate = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!formData.email) errors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format.';

    if (!formData.password) errors.password = 'Password is required.';
    else if (formData.password.length < 8) errors.password = 'Must be at least 8 characters.';
    else if (!/[A-Z]/.test(formData.password)) errors.password = 'Must contain an uppercase letter.';
    else if (!/[a-z]/.test(formData.password)) errors.password = 'Must contain a lowercase letter.';
    else if (!/\d/.test(formData.password)) errors.password = 'Must contain a number.';
    else if (!/[!@#$%^&*(),.?":{}|<>_+\-~=`[\]\\;/]/.test(formData.password)) errors.password = 'Must contain a special character.';

    if (formData.password !== formData.confirm_password)
      errors.confirm_password = 'Passwords do not match.';

    if (!formData.role) errors.role = 'Please select a role.';

    if (needsOrganization && !formData.organization.trim())
      errors.organization = 'Organization name is required for this role.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      const { confirm_password, ...submitData } = formData;
      const data = await register(submitData);
      if (data.success) {
        navigate(`/dashboard/${data.data.user.role}`, { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
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
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/logo.png" alt="SamadhanSetu Logo" className="auth-logo-image" />
          </div>
          <h1>Join SamadhanSetu</h1>
          <p>Register to start contributing to Jharkhand's innovation ecosystem</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Role Selection */}
          <div className="form-group">
            <label>Select Your Role</label>
            <div className="role-grid">
              {roles.map((r) => (
                <label
                  key={r.value}
                  className={`role-option ${formData.role === r.value ? 'role-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={formData.role === r.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="role-option-icon">{r.label.split(' ')[0]}</span>
                  <span className="role-option-label">{r.label.split(' ').slice(1).join(' ')}</span>
                  <span className="role-option-desc">{r.desc}</span>
                </label>
              ))}
            </div>
            {fieldErrors.role && (
              <span className="field-error">{fieldErrors.role}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={fieldErrors.full_name ? 'input-error' : ''}
              />
              {fieldErrors.full_name && (
                <span className="field-error">{fieldErrors.full_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={fieldErrors.email ? 'input-error' : ''}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 chars, upper, lower, number, special"
                className={fieldErrors.password ? 'input-error' : ''}
                autoComplete="new-password"
              />
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={fieldErrors.confirm_password ? 'input-error' : ''}
                autoComplete="new-password"
              />
              {fieldErrors.confirm_password && (
                <span className="field-error">{fieldErrors.confirm_password}</span>
              )}
            </div>
          </div>

          {needsOrganization && (
            <div className="form-group form-group-animate">
              <label htmlFor="organization">Organization / Institution Name</label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder={
                  formData.role === 'university'
                    ? 'e.g., BIT Mesra, Ranchi University'
                    : formData.role === 'industry'
                    ? 'e.g., Tata Steel, TCS, Startup Name'
                    : 'e.g., Department of Education, Ranchi DC Office'
                }
                className={fieldErrors.organization ? 'input-error' : ''}
              />
              {fieldErrors.organization && (
                <span className="field-error">{fieldErrors.organization}</span>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 9876543210"
                className={fieldErrors.phone ? 'input-error' : ''}
              />
              {fieldErrors.phone && (
                <span className="field-error">{fieldErrors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="district">District (Optional)</label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={fieldErrors.district ? 'input-error' : ''}
              >
                <option value="">Select district</option>
                {jharkhandDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {fieldErrors.district && (
                <span className="field-error">{fieldErrors.district}</span>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" /> Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
