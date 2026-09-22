import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const STATUS_OPTIONS = [
  { key: '', label: 'All Challenges' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'NEEDS_INFORMATION', label: 'Needs Information' },
  { key: 'VALIDATED', label: 'Validated' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function MyChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetchChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);

      const { data } = await API.get(`/challenges/my?${params}`);
      if (data.success) {
        setChallenges(data.data.challenges);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (err) {
      setError('Failed to load challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [page, statusFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this draft challenge?')) return;
    try {
      await API.delete(`/challenges/${id}`);
      fetchChallenges();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete challenge.');
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Reported Challenges</h1>
          <p className="dashboard-welcome">
            {total} challenge{total !== 1 ? 's' : ''} submitted from your citizen account
          </p>
        </div>
        <Link to="/citizen/challenges/new" className="btn btn-primary-action">
          + Report New Challenge
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="challenges-filter-bar">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`filter-btn ${statusFilter === opt.key ? 'filter-active' : ''}`}
            onClick={() => { setStatusFilter(opt.key); setPage(1); }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-error"><span>⚠️</span> {error}</div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '30vh' }}>
          <div className="loading-spinner" />
          <p>Loading your challenges...</p>
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No challenges found"
          message={
            statusFilter
              ? `You currently have no challenges with status "${statusFilter}".`
              : 'You have not submitted any societal challenges yet. Help report issues in your community.'
          }
          actionLabel="Report a Challenge"
          actionTo="/citizen/challenges/new"
        />
      ) : (
        <>
          <div className="queue-table-container">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c.id} className="queue-row">
                    <td className="queue-title-cell">
                      <Link to={`/citizen/challenges/${c.id}`} className="queue-title-link">
                        {c.title}
                      </Link>
                      <div className="queue-subtext">
                        <span className="queue-id-badge">{c.challenge_id}</span>
                        {c.severity && (
                          <span> · Severity: <strong style={{ textTransform: 'capitalize' }}>{c.severity}</strong></span>
                        )}
                        {c.media_count > 0 && <span> · 📎 {c.media_count} files</span>}
                      </div>
                    </td>
                    <td>
                      {c.category_name ? (
                        <span className="meta-tag">
                          {c.category_icon} {c.category_name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {c.loc_district ? (
                        <span>📍 {c.loc_district}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(c.submitted_at || c.created_at)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link to={`/citizen/challenges/${c.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                        {(c.status === 'DRAFT' || c.status === 'NEEDS_INFORMATION') && (
                          <Link
                            to={`/citizen/challenges/${c.id}/edit`}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: c.status === 'NEEDS_INFORMATION' ? '#faf5ff' : '#eff6ff',
                              color: c.status === 'NEEDS_INFORMATION' ? '#7e22ce' : '#1d4ed8',
                              border: `1px solid ${c.status === 'NEEDS_INFORMATION' ? '#e9d5ff' : '#bfdbfe'}`,
                            }}
                          >
                            {c.status === 'NEEDS_INFORMATION' ? 'Update Details' : 'Edit Draft'}
                          </Link>
                        )}
                        {c.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(c.id)}
                            title="Delete draft"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
