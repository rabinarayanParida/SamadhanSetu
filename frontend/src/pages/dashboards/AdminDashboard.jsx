import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
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
      .catch((err) => console.error('Admin stats error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading administrative dashboard...</p>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const categories = stats?.categories || [];
  const recent = stats?.recent_activity || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Administration & Moderation Overview</h1>
          <p className="dashboard-welcome">
            Welcome, <strong>{user.full_name}</strong> — State Portal Administrator
          </p>
        </div>
        <Link to="/admin/challenges" className="btn btn-primary-action">
          Review Queue ({overview.submitted || 0} Pending)
        </Link>
      </div>

      {/* Real Metrics Grid */}
      <div className="stats-grid">
        <Link to="/admin/challenges" className="stat-block">
          <div className="stat-block-icon">📋</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.total_challenges || 0}</span>
            <span className="stat-block-label">Total Challenges</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=SUBMITTED" className="stat-block">
          <div className="stat-block-icon">📥</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.submitted || 0}</span>
            <span className="stat-block-label">Pending Intake</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=UNDER_REVIEW" className="stat-block">
          <div className="stat-block-icon">⏳</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.under_review || 0}</span>
            <span className="stat-block-label">Under Active Review</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=VALIDATED" className="stat-block">
          <div className="stat-block-icon">✅</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.validated || 0}</span>
            <span className="stat-block-label">Validated Issues</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=NEEDS_INFORMATION" className="stat-block">
          <div className="stat-block-icon">💬</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.needs_information || 0}</span>
            <span className="stat-block-label">Needs Information</span>
          </div>
        </Link>

        <Link to="/admin/challenges?status=REJECTED" className="stat-block">
          <div className="stat-block-icon">✕</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{overview.rejected || 0}</span>
            <span className="stat-block-label">Rejected Issues</span>
          </div>
        </Link>
      </div>

      {/* Quick Action Navigation */}
      <div className="dashboard-section">
        <h2>Moderation Workflows</h2>
        <div className="action-grid">
          <Link to="/admin/challenges" className="action-card action-card-active">
            <span className="action-icon">🔍</span>
            <span style={{ fontWeight: 600 }}>Review Queue</span>
            <span className="action-badge-primary">Open Queue →</span>
          </Link>
          <Link to="/admin/challenges?status=SUBMITTED" className="action-card action-card-active">
            <span className="action-icon">📥</span>
            <span style={{ fontWeight: 600 }}>New Submissions</span>
            <span className="action-badge-secondary">{overview.submitted || 0} waiting evaluation</span>
          </Link>
          <Link to="/admin/challenges?status=VALIDATED" className="action-card action-card-active">
            <span className="action-icon">🎓</span>
            <span style={{ fontWeight: 600 }}>Validated For HEIs</span>
            <span className="action-badge-primary">Ready for University Matching →</span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Recent Moderation Timeline & Category Distribution */}
      <div className="detail-grid">
        {/* Recent Reviews Activity */}
        <div className="detail-section">
          <h2>🕒 Recent Moderation Activity</h2>
          {recent.length > 0 ? (
            <div className="status-timeline">
              {recent.map((a, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <Link to={`/admin/challenges/${a.challenge_id}`} style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {a.challenge_code}: {a.challenge_title}
                      </Link>
                      <span className="timeline-date">
                        {new Date(a.changed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status transitioned to:</span>
                      <StatusBadge status={a.to_status} />
                    </div>
                    {a.comment && <p className="timeline-comment">"{a.comment}"</p>}
                    <span className="timeline-user">Updated by {a.changed_by_name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No recent moderation activity recorded.</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="detail-section">
          <h2>📂 Domain & Sector Distribution</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
