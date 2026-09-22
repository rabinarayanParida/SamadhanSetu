import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function ChallengeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const justSubmitted = location.state?.justSubmitted;
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/challenges/${id}`)
      .then((res) => setChallenge(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load challenge details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreviewUrl = (item) => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    return `${base}/${item.file_path.replace(/\\/g, '/')}`;
  };

  const backTarget =
    user?.role === 'university'
      ? '/dashboard/university'
      : user?.role === 'admin' || user?.role === 'government'
      ? '/admin/challenges'
      : '/citizen/challenges';

  const backLabel =
    user?.role === 'university'
      ? '← Back to University Dashboard'
      : user?.role === 'admin' || user?.role === 'government'
      ? '← Back to Review Queue'
      : '← Back to Challenges';

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading challenge information...</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h1>Unable to Load Challenge</h1>
          <p>{error || 'The requested challenge could not be found.'}</p>
          <Link to={backTarget} className="btn btn-primary">{backLabel}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Just Submitted Notice */}
      {justSubmitted && (
        <div className="alert alert-success">
          <span>✅</span> Challenge <strong>{challenge.challenge_id}</strong> has been submitted successfully and entered the state review queue.
        </div>
      )}

      {/* Reviewer Information Request Callout */}
      {challenge.status === 'NEEDS_INFORMATION' && (
        <div className="alert alert-warning" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong>💬 Information Requested by Reviewer:</strong>
            <p style={{ marginTop: '4px', fontSize: '13px' }}>
              {challenge.status_history?.find((h) => h.to_status === 'NEEDS_INFORMATION')?.comment ||
                'Please update your challenge details to address reviewer inquiries.'}
            </p>
          </div>
          <Link to={`/citizen/challenges/${challenge.id}/edit`} className="btn btn-primary btn-sm">
            Update Challenge Details
          </Link>
        </div>
      )}

      {/* Top Header Card */}
      <div className="challenge-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <Link to={backTarget} className="btn btn-back btn-sm">
            {backLabel}
          </Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {user?.role === 'citizen' && (challenge.status === 'DRAFT' || challenge.status === 'NEEDS_INFORMATION') && (
              <Link to={`/citizen/challenges/${challenge.id}/edit`} className="btn btn-primary btn-sm">
                ✏️ {challenge.status === 'NEEDS_INFORMATION' ? 'Update & Respond' : 'Edit Draft'}
              </Link>
            )}
          </div>
        </div>

        <div className="challenge-detail-title-section">
          <div className="challenge-detail-ids">
            <span className="challenge-display-id">{challenge.challenge_id}</span>
            <StatusBadge status={challenge.status} />
          </div>
          <h1>{challenge.title}</h1>
          <p className="challenge-detail-meta">
            Submitted by <strong>{challenge.submitted_by_name || 'Citizen'}</strong> · Created {formatDate(challenge.created_at)}
            {challenge.submitted_at && <> · Submitted {formatDate(challenge.submitted_at)}</>}
          </p>
        </div>
      </div>

      {/* Discrete Content Sections (Section 10) */}
      <div className="detail-grid">
        {/* Main Column */}
        <div className="detail-main">
          {/* Section 1: Problem Description */}
          <div className="detail-section">
            <h2>📝 Problem Description</h2>
            <p className="detail-text">{challenge.description}</p>
          </div>

          {/* Section 2: Impact & Context */}
          <div className="detail-section">
            <h2>📊 Impact & Context</h2>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-info-label">Category</span>
                <span className="detail-info-value">
                  {challenge.category_name ? `${challenge.category_icon} ${challenge.category_name}` : '—'}
                </span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Affected Population</span>
                <span className="detail-info-value">{challenge.affected_population || '—'}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-info-label">Reported Severity</span>
                <span className="detail-info-value">
                  {challenge.severity ? (
                    <span className={`severity-badge severity-${challenge.severity}`}>
                      {challenge.severity.charAt(0).toUpperCase() + challenge.severity.slice(1)}
                    </span>
                  ) : '—'}
                </span>
              </div>
            </div>

            {challenge.existing_attempts && (
              <div className="detail-subsection">
                <h3>Existing Attempts to Address</h3>
                <p className="detail-text">{challenge.existing_attempts}</p>
              </div>
            )}

            {challenge.expected_outcome && (
              <div className="detail-subsection">
                <h3>Expected Outcome</h3>
                <p className="detail-text">{challenge.expected_outcome}</p>
              </div>
            )}
          </div>

          {/* Section 3: Location */}
          {challenge.location && (
            <div className="detail-section">
              <h2>📍 Location</h2>
              <div className="detail-info-grid">
                {challenge.location.latitude && (
                  <div className="detail-info-item">
                    <span className="detail-info-label">Coordinates</span>
                    <span className="detail-info-value" style={{ fontFamily: 'monospace' }}>
                      {parseFloat(challenge.location.latitude).toFixed(6)}, {parseFloat(challenge.location.longitude).toFixed(6)}
                    </span>
                  </div>
                )}
                <div className="detail-info-item">
                  <span className="detail-info-label">District</span>
                  <span className="detail-info-value">{challenge.location.district || '—'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Block / Tehsil</span>
                  <span className="detail-info-value">{challenge.location.block || '—'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Village / City</span>
                  <span className="detail-info-value">{challenge.location.village_city || '—'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Address</span>
                  <span className="detail-info-value">{challenge.location.address || '—'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Pincode</span>
                  <span className="detail-info-value">{challenge.location.pincode || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Evidence */}
          {challenge.media && challenge.media.length > 0 && (
            <div className="detail-section">
              <h2>📎 Supporting Evidence ({challenge.media.length} files)</h2>
              <div className="detail-media-grid">
                {challenge.media.map((m) => (
                  <div key={m.id} className="detail-media-item">
                    {m.file_type === 'photo' ? (
                      <img src={getPreviewUrl(m)} alt={m.file_name} loading="lazy" />
                    ) : m.file_type === 'video' ? (
                      <video src={getPreviewUrl(m)} controls preload="metadata" />
                    ) : (
                      <div className="detail-media-doc">
                        <span>📄</span>
                        <a href={getPreviewUrl(m)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                          {m.file_name}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="detail-sidebar">
          {/* Phase 5: Institutional Assignment Information */}
          {challenge.assignment && (
            <div className="detail-section">
              <h2>🎓 Institutional Assignment</h2>
              <div className="detail-info-item" style={{ marginBottom: '8px' }}>
                <span className="detail-info-label">Partner Institution</span>
                <span className="detail-info-value" style={{ fontWeight: 600 }}>
                  {challenge.assignment.university_name || 'Assigned University'}
                  {challenge.assignment.university_code && ` (${challenge.assignment.university_code})`}
                </span>
              </div>
              <div className="detail-info-item" style={{ marginBottom: '8px' }}>
                <span className="detail-info-label">Assignment Status</span>
                <StatusBadge status={challenge.assignment.assignment_status} />
              </div>
              {challenge.assignment.ai_match_score && (
                <div className="detail-info-item" style={{ marginBottom: '8px' }}>
                  <span className="detail-info-label">Match Score</span>
                  <span className="detail-info-value" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                    {Math.round(challenge.assignment.ai_match_score)}%
                  </span>
                </div>
              )}
              {challenge.assignment.assignment_reason && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                  <strong>Admin Rationale:</strong> "{challenge.assignment.assignment_reason}"
                </div>
              )}
              {challenge.assignment.assigned_at && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Assigned on {formatDate(challenge.assignment.assigned_at)}
                </div>
              )}
            </div>
          )}

          {/* Submitter Info Card */}
          <div className="detail-section">
            <h2>👤 Submitter Information</h2>
            <div className="detail-info-item" style={{ marginBottom: '8px' }}>
              <span className="detail-info-label">Citizen Name</span>
              <span className="detail-info-value">{challenge.submitted_by_name || 'Community Member'}</span>
            </div>
            {challenge.submitter_email && (
              <div className="detail-info-item" style={{ marginBottom: '8px' }}>
                <span className="detail-info-label">Email</span>
                <span className="detail-info-value">{challenge.submitter_email}</span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="detail-info-label">Submission Date</span>
              <span className="detail-info-value">{formatDate(challenge.submitted_at || challenge.created_at)}</span>
            </div>
          </div>

          {/* Review History Timeline */}
          <div className="detail-section">
            <h2>📜 Review History & Timeline</h2>
            {challenge.status_history && challenge.status_history.length > 0 ? (
              <div className="status-timeline">
                {challenge.status_history.map((h, i) => (
                  <div key={h.id || i} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <StatusBadge status={h.to_status} />
                        <span className="timeline-date">{formatDate(h.changed_at)}</span>
                      </div>
                      {h.comment && <p className="timeline-comment">"{h.comment}"</p>}
                      <span className="timeline-user">Updated by {h.changed_by_name || 'System Moderator'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No review actions recorded yet. Submission is pending moderator review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
