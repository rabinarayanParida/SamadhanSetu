import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function UniversityDashboard() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Selected assignment for detailed view / inspection
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Decline Modal
  const [declineModal, setDeclineModal] = useState({ open: false, assignmentId: null, title: '' });
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Accept confirmation state
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Fetch university assigned challenges
  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await API.get('/assignments/university/challenges', { params });
      if (res.data.success) {
        setAssignments(res.data.data.assignments || []);
        setTotalCount(res.data.data.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned challenges.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Handle Accept
  const handleAccept = async (assignmentId) => {
    setAcceptLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post(`/assignments/university/challenges/${assignmentId}/accept`);
      if (res.data.success) {
        setSuccess('Challenge accepted! Project collaboration workspace can now be initiated.');
        fetchChallenges();
        if (selectedAssignment && selectedAssignment.id === assignmentId) {
          setSelectedAssignment((prev) => ({ ...prev, assignment_status: 'ACCEPTED' }));
        }
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept challenge.');
    } finally {
      setAcceptLoading(false);
    }
  };

  // Handle Decline
  const handleDeclineConfirm = async () => {
    if (!declineModal.assignmentId) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post(
        `/assignments/university/challenges/${declineModal.assignmentId}/decline`,
        { reason: declineReason.trim() }
      );
      if (res.data.success) {
        setSuccess('Challenge assignment declined and returned to state moderation queue.');
        setDeclineModal({ open: false, assignmentId: null, title: '' });
        setDeclineReason('');
        fetchChallenges();
        if (selectedAssignment && selectedAssignment.id === declineModal.assignmentId) {
          setSelectedAssignment((prev) => ({ ...prev, assignment_status: 'DECLINED' }));
        }
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline challenge.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats calculation
  const pendingCount = assignments.filter((a) => a.assignment_status === 'PENDING').length;
  const acceptedCount = assignments.filter((a) => a.assignment_status === 'ACCEPTED').length;
  const declinedCount = assignments.filter((a) => a.assignment_status === 'DECLINED').length;

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
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>University Innovation Portal</h1>
          <p className="dashboard-welcome">
            Welcome, <strong>{user?.full_name}</strong>
            {user?.organization && <span> — {user.organization}</span>}
          </p>
        </div>
        <div className="role-indicator">
          University Partner
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="alert alert-success">
          <span>✅</span> {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Metric Cards (Section 14) */}
      <div className="stats-grid">
        <div className="stat-block">
          <div className="stat-block-icon">📥</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{totalCount}</span>
            <span className="stat-block-label">Assigned Challenges</span>
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-icon">⏳</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{pendingCount}</span>
            <span className="stat-block-label">Pending Decisions</span>
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-icon">✅</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{acceptedCount}</span>
            <span className="stat-block-label">Accepted Challenges</span>
          </div>
        </div>
        <div className="stat-block">
          <div className="stat-block-icon">↩️</div>
          <div className="stat-block-info">
            <span className="stat-block-value">{declinedCount}</span>
            <span className="stat-block-label">Declined</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="dashboard-section" style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div>
            <h2>Assigned Community Challenges</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Institutional matches assigned by state administrators based on your research and lab capabilities.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="challenges-filter-bar" style={{ margin: 0 }}>
            {[
              { key: '', label: 'All' },
              { key: 'PENDING', label: 'Pending Action' },
              { key: 'ACCEPTED', label: 'Accepted' },
              { key: 'DECLINED', label: 'Declined' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`filter-btn ${statusFilter === f.key ? 'filter-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '30vh' }}>
            <div className="loading-spinner" />
            <p>Fetching assigned challenges...</p>
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="No challenges assigned yet"
            message={
              statusFilter
                ? `There are no challenges matching status "${statusFilter}".`
                : 'Assigned challenges will appear here once an administrator connects your institution to a validated challenge.'
            }
          />
        ) : (
          /* Assignment List Cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignments.map((assignment) => {
              const isSelected = selectedAssignment?.id === assignment.id;

              return (
                <div
                  key={assignment.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className="queue-id-badge">
                          {assignment.challenge_code || 'ID: ' + assignment.challenge_id?.slice(0, 8)}
                        </span>
                        {assignment.category_name && (
                          <span className="meta-tag">
                            {assignment.category_icon || '📁'} {assignment.category_name}
                          </span>
                        )}
                        {assignment.challenge_district && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            📍 {assignment.challenge_district}
                          </span>
                        )}
                        {assignment.severity && (
                          <span className={`severity-badge severity-${assignment.severity.toLowerCase()}`}>
                            {assignment.severity}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                        {assignment.challenge_title}
                      </h3>

                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: '0 0 12px',
                        display: '-webkit-box',
                        WebkitLineClamp: isSelected ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {assignment.challenge_description}
                      </p>

                      {/* Explainable Match Scoring Rationale */}
                      {assignment.match_score && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          marginBottom: '10px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '13px' }}>🎯</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                              Institutional Match Score: {Math.round(assignment.match_score)}%
                            </span>
                          </div>
                          {assignment.match_explanation && (
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              {assignment.match_explanation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Administrator Assignment Reason */}
                      {assignment.assignment_reason && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <strong>Administrator Rationale:</strong> "{assignment.assignment_reason}"
                        </div>
                      )}

                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        Assigned on {formatDate(assignment.assigned_at)}
                        {assignment.assigned_by_name && <span> by {assignment.assigned_by_name}</span>}
                      </div>
                    </div>

                    {/* Status & Actions Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                      <StatusBadge status={assignment.assignment_status} />

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                        <Link
                          to={`/citizen/challenges/${assignment.challenge_id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Challenge
                        </Link>

                        {assignment.assignment_status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setDeclineModal({
                                open: true,
                                assignmentId: assignment.id,
                                title: assignment.challenge_title,
                              })}
                              className="btn btn-sm btn-danger"
                              disabled={acceptLoading || actionLoading}
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAccept(assignment.id)}
                              className="btn btn-sm btn-submit-challenge"
                              disabled={acceptLoading || actionLoading}
                            >
                              {acceptLoading ? 'Accepting...' : 'Accept'}
                            </button>
                          </>
                        )}
                      </div>

                      {assignment.assignment_status === 'ACCEPTED' && (
                        <span style={{ fontSize: '11.5px', color: 'var(--success-text)', fontWeight: 500 }}>
                          Accepted on {formatDate(assignment.responded_at)}
                        </span>
                      )}

                      {assignment.assignment_status === 'DECLINED' && (
                        <span style={{ fontSize: '11.5px', color: 'var(--error-text)', fontWeight: 500 }}>
                          Declined on {formatDate(assignment.responded_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {declineModal.open && (
        <div
          className="modal-overlay"
          onClick={() => !actionLoading && setDeclineModal({ open: false, assignmentId: null, title: '' })}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Decline Challenge Assignment</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeclineModal({ open: false, assignmentId: null, title: '' })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Are you sure your institution wants to decline <strong>"{declineModal.title}"</strong>? The challenge will be returned to state administrators for reassignment.
              </p>

              <div className="form-group">
                <label>Reason for Declining (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Domain faculty currently at maximum capacity, or missing required laboratory testing facilities..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeclineModal({ open: false, assignmentId: null, title: '' })}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleDeclineConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
