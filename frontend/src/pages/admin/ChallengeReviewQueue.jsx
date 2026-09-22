import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const STATUS_TABS = [
  { key: '', label: 'All Statuses' },
  { key: 'SUBMITTED', label: 'Pending Review' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'VALIDATED', label: 'Validated' },
  { key: 'NEEDS_INFORMATION', label: 'Needs Info' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'REJECTED', label: 'Rejected' },
];

const JHARKHAND_DISTRICTS = [
  'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum',
  'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara',
  'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu',
  'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum',
];

export default function ChallengeReviewQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [challenges, setChallenges] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [districtFilter, setDistrictFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch categories
  useEffect(() => {
    API.get('/challenges/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 10);
      if (statusFilter) params.set('status', statusFilter);
      if (districtFilter) params.set('district', districtFilter);
      if (severityFilter) params.set('severity', severityFilter);
      if (categoryFilter) params.set('category_id', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await API.get(`/admin/challenges?${params.toString()}`);
      if (res.data.success) {
        setChallenges(res.data.data.challenges || []);
        setTotal(res.data.data.total || 0);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, districtFilter, severityFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleStatusTab = (s) => {
    setStatusFilter(s);
    setPage(1);
    if (s) {
      setSearchParams({ status: s });
    } else {
      setSearchParams({});
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
          <h1>Challenge Review & Moderation Queue</h1>
          <p className="dashboard-welcome">
            Inspect, evaluate authenticity, and validate societal challenges reported across Jharkhand.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="cf-draft-badge" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
            {total} Challenges in Queue
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="challenges-filter-bar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`filter-btn ${statusFilter === tab.key ? 'filter-active' : ''}`}
            onClick={() => handleStatusTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Selects Toolbar */}
      <div className="queue-filter-toolbar">
        <div className="queue-search-box">
          <span className="queue-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, ID, or keywords..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="queue-search-input"
          />
          {searchQuery && (
            <button type="button" className="queue-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="queue-selects">
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
            className="queue-select"
          >
            <option value="">All Districts (24)</option>
            {JHARKHAND_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="queue-select"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="queue-select"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error"><span>⚠️</span> {error}</div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '30vh' }}>
          <div className="loading-spinner" />
          <p>Loading moderation queue...</p>
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No challenges found in queue"
          message="No records match your selected filter criteria. Try resetting status or filters."
          actionLabel="Reset All Filters"
          onAction={() => {
            setStatusFilter('');
            setDistrictFilter('');
            setSeverityFilter('');
            setCategoryFilter('');
            setSearchQuery('');
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="queue-table-container">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Challenge ID</th>
                  <th>Title & Citizen</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c.id} className="queue-row">
                    <td>
                      <span className="queue-id-badge">{c.challenge_id}</span>
                      {c.duplicate_of_code && (
                        <div>
                          <span className="queue-dup-badge" title={`Duplicate of ${c.duplicate_of_code}`}>
                            Dup of {c.duplicate_of_code}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="queue-title-cell">
                      <Link to={`/admin/challenges/${c.id}`} className="queue-title-link">
                        {c.title}
                      </Link>
                      <div className="queue-subtext">
                        By <strong>{c.citizen_name || 'Citizen'}</strong>
                        {c.citizen_email && <span> ({c.citizen_email})</span>}
                        {c.media_count > 0 && <span> · 📎 {c.media_count} files</span>}
                      </div>
                    </td>
                    <td>
                      {c.category_name ? (
                        <span className="meta-tag">
                          {c.category_icon} {c.category_name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Uncategorized</span>
                      )}
                    </td>
                    <td>
                      {c.district ? <span>📍 {c.district}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {c.severity ? (
                        <span className={`severity-badge severity-${c.severity.toLowerCase()}`}>
                          {c.severity}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(c.submitted_at || c.created_at)}
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link to={`/admin/challenges/${c.id}`} className="btn btn-primary btn-sm">
                        Review →
                      </Link>
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
