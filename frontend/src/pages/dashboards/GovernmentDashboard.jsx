import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function GovernmentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard/stats')
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error('Gov stats error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading government oversight dashboard...</p>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const districts = stats?.districts || [];
  const categories = stats?.categories || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>State Government Oversight</h1>
          <p className="dashboard-welcome">
            Welcome, <strong>{user.full_name}</strong>
            {user.organization && <span> — {user.organization}</span>}
          </p>
        </div>
        <Link to="/admin/challenges" className="btn btn-primary-action">
          Review Queue ({overview.submitted || 0} Pending)
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Link to="/admin/challenges" className="stat-block">
          <div className="stat-block-icon">📊</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.total_challenges || 0}</span>
            <span className="stat-block-label">Total Challenges</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=VALIDATED" className="stat-block">
          <div className="stat-block-icon">✅</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.validated || 0}</span>
            <span className="stat-block-label">Validated Issues</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=UNDER_REVIEW" className="stat-block">
          <div className="stat-block-icon">⏳</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.under_review || 0}</span>
            <span className="stat-block-label">Under Investigation</span>
          </div>
        </Link>

        <div className="stat-block">
          <div className="stat-block-icon">🗺️</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{districts.length || 0} / 24</span>
            <span className="stat-block-label">Active Districts</span>
          </div>
        </div>
      </div>

      {/* Oversight Actions */}
      <div className="dashboard-section">
        <h2>Departmental Workflows</h2>
        <div className="action-grid">
          <Link to="/admin/challenges" className="action-card action-card-active">
            <span className="action-icon">📋</span>
            <span style={{ fontWeight: 600 }}>Challenge Inspection</span>
            <span className="action-badge-primary">Review Queue →</span>
          </Link>
          <Link to="/admin/challenges?status=SUBMITTED" className="action-card action-card-active">
            <span className="action-icon">📥</span>
            <span style={{ fontWeight: 600 }}>New Submissions</span>
            <span className="action-badge-secondary">{overview.submitted || 0} pending review</span>
          </Link>
          <Link to="/admin/challenges?status=VALIDATED" className="action-card action-card-active">
            <span className="action-icon">🎯</span>
            <span style={{ fontWeight: 600 }}>Validated For HEIs</span>
            <span className="action-badge-primary">{overview.validated || 0} ready for academic match</span>
          </Link>
        </div>
      </div>

      {/* District & Domain Distribution */}
      <div className="detail-grid">
        <div className="detail-section">
          <h2>🗺️ District Submissions Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {districts.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
              >
                <span>📍 {d.district}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.count} challenges</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h2>📊 Sector Distribution</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {categories.slice(0, 8).map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
              >
                <span>{c.icon} {c.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
