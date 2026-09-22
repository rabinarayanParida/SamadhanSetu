import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/industry')
      .then((res) => setDashData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading industry portal...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Industry & Corporate Innovation Portal</h1>
          <p className="dashboard-welcome">
            Welcome, <strong>{user.full_name}</strong>
            {user.organization && <span> — {user.organization}</span>}
          </p>
        </div>
        <div className="role-indicator">
          Industry Partner
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-block">
          <div className="stat-block-icon">🤝</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{dashData?.stats?.active_partnerships || 0}</span>
            <span className="stat-block-label">Active Partnerships</span>
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-icon">💰</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{dashData?.stats?.projects_funded || 0}</span>
            <span className="stat-block-label">Projects Funded</span>
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-icon">🚀</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{dashData?.stats?.prototypes_deployed || 0}</span>
            <span className="stat-block-label">Prototypes Deployed</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Partnership Opportunities</h2>
        <div className="feature-grid">
          {(dashData?.features || []).map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                {['🔍', '🎯', '🔧', '📡', '📈'][i] || '🔹'}
              </div>
              <p>{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
