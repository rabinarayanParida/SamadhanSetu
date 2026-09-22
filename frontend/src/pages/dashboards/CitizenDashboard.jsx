import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    total_submitted: 0,
    drafts: 0,
    submitted: 0,
    under_review: 0,
    resolved: 0,
  });
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    Promise.allSettled([
      API.get('/challenges/stats'),
      API.get('/challenges/my?limit=6'),
    ]).then(([statsRes, myRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data || {});
      if (myRes.status === 'fulfilled') setRecentChallenges(myRes.value.data.data?.challenges || []);
      setLoading(false);
    });
  }, []);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading citizen portal...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Top Section */}
      <div className="dashboard-header">
        <div>
          <h1>{getGreeting()}, {user?.full_name}</h1>
          <p className="dashboard-welcome">
            Track community challenges and contribute to solving problems in your area.
            {user?.district && <span> · 📍 {user.district}, Jharkhand</span>}
          </p>
        </div>
        <Link to="/citizen/challenges/new" className="btn btn-primary-action">
          + Report a Challenge
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-block">
          <div className="stat-block-icon">📋</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{stats.total || 0}</span>
            <span className="stat-block-label">Total Challenges</span>
          </div>
        </div>

        <div className="stat-block">
          <div className="stat-block-icon">📤</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{stats.submitted || 0}</span>
            <span className="stat-block-label">Submitted</span>
          </div>
        </div>

        <div className="stat-block">
          <div className="stat-block-icon">⏳</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{stats.under_review || 0}</span>
            <span className="stat-block-label">Under Review</span>
          </div>
        </div>

        <div className="stat-block">
          <div className="stat-block-icon">📝</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{stats.drafts || 0}</span>
            <span className="stat-block-label">Drafts</span>
          </div>
        </div>
      </div>

      {/* Secondary Content: My Challenges Table/List */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2>My Challenges</h2>
          {recentChallenges.length > 0 && (
            <Link to="/citizen/challenges" style={{ color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600 }}>
              View all ({stats.total || recentChallenges.length}) →
            </Link>
          )}
        </div>

        {recentChallenges.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No challenges reported yet"
            message="You have not submitted any societal challenges yet. Help report issues affecting your village, block, or district."
            actionLabel="Report a Challenge"
            actionTo="/citizen/challenges/new"
          />
        ) : (
          <div className="queue-table-container">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentChallenges.map((ch) => (
                  <tr key={ch.id} className="queue-row">
                    <td className="queue-title-cell">
                      <Link to={`/citizen/challenges/${ch.id}`} className="queue-title-link">
                        {ch.title}
                      </Link>
                      <div className="queue-subtext">
                        <span className="queue-id-badge">{ch.challenge_id}</span>
                        {ch.media_count > 0 && <span> · 📎 {ch.media_count} files</span>}
                      </div>
                    </td>
                    <td>
                      {ch.category_name ? (
                        <span className="meta-tag">
                          {ch.category_icon} {ch.category_name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {ch.loc_district || ch.location?.district ? (
                        <span>📍 {ch.loc_district || ch.location?.district}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ch.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(ch.submitted_at || ch.created_at)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link to={`/citizen/challenges/${ch.id}`} className="btn btn-secondary btn-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
