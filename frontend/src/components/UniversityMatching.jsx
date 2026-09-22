import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const FACTOR_LABELS = {
  domain_expertise: { label: 'Domain Expertise', icon: '🎯', color: '#6366f1' },
  faculty_expertise: { label: 'Faculty Expertise', icon: '👨‍🏫', color: '#8b5cf6' },
  research_match: { label: 'Research Match', icon: '🔬', color: '#3b82f6' },
  lab_capability: { label: 'Lab Capability', icon: '🧪', color: '#10b981' },
  previous_projects: { label: 'Previous Projects', icon: '📋', color: '#f59e0b' },
  innovation_capability: { label: 'Innovation', icon: '💡', color: '#ec4899' },
  geographic_suitability: { label: 'Geographic', icon: '📍', color: '#14b8a6' },
  capacity_availability: { label: 'Capacity', icon: '📊', color: '#64748b' },
};

const STATUS_COLORS = {
  RECOMMENDED: '#3b82f6',
  SHORTLISTED: '#10b981',
  REJECTED: '#ef4444',
  SELECTED: '#f59e0b',
  EXPIRED: '#64748b',
};

export default function UniversityMatching({ challenge, onRefresh }) {
  const [matchData, setMatchData] = useState(challenge?.matching || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedMatch, setExpandedMatch] = useState(null);

  // Assignment modal
  const [assignModal, setAssignModal] = useState({ open: false, match: null });
  const [assignReason, setAssignReason] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (challenge?.matching) {
      setMatchData(challenge.matching);
    }
  }, [challenge]);

  const canMatch = ['VALIDATED', 'UNDER_REVIEW'].includes(challenge?.status) && challenge?.ai_intelligence?.ai_results?.processing_status === 'COMPLETED';
  const isAssigned = ['ASSIGNED', 'IN_PROGRESS'].includes(challenge?.status);

  // Generate matches
  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post(`/matching/challenges/${challenge.id}/matches/generate`);
      if (res.data.success) {
        setMatchData(res.data.data);
        setSuccess('University recommendations generated successfully!');
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate matches.');
    } finally {
      setLoading(false);
    }
  };

  // Shortlist / Reject
  const handleMatchAction = async (matchId, action) => {
    try {
      const res = await API.post(`/matching/challenges/${challenge.id}/matches/${matchId}/${action}`);
      if (res.data.success) {
        setSuccess(`University ${action === 'shortlist' ? 'shortlisted' : 'rejected'}.`);
        // Refresh match data
        const refreshRes = await API.get(`/matching/challenges/${challenge.id}/matches`);
        if (refreshRes.data.success) setMatchData(refreshRes.data.data);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} match.`);
    }
  };

  // Assign university
  const handleAssign = async () => {
    if (!assignModal.match) return;
    setAssignLoading(true);
    setError('');
    try {
      const payload = {
        university_id: assignModal.match.university_id,
        department_id: assignModal.match.department_id || undefined,
        reason: assignReason.trim() || undefined,
      };
      const res = await API.post(`/assignments/challenges/${challenge.id}/assign`, payload);
      if (res.data.success) {
        setSuccess('Challenge assigned to university!');
        setAssignModal({ open: false, match: null });
        setAssignReason('');
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign challenge.');
    } finally {
      setAssignLoading(false);
    }
  };

  const matches = matchData?.matches || [];
  const hasMatches = matches.length > 0;

  // Compute score ring color
  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    if (score >= 30) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="match-panel">
      <div className="match-panel-header">
        <div className="match-panel-title">
          <span className="match-panel-icon">🎓</span>
          <div>
            <h2>University Matching Engine</h2>
            <p className="match-panel-subtitle">
              AI-powered institutional recommendation and assignment
            </p>
          </div>
        </div>
        <div className="match-panel-actions">
          {isAssigned && challenge?.assignment && (
            <span className="match-assigned-badge">
              ✅ Assigned to {challenge.assignment.university_name}
            </span>
          )}
          {canMatch && (
            <button
              className="btn-match-generate"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <><span className="btn-spinner" /> Analyzing Universities...</>
              ) : hasMatches ? (
                '🔄 Regenerate Recommendations'
              ) : (
                '🎯 Generate University Recommendations'
              )}
            </button>
          )}
          {!canMatch && !isAssigned && (
            <span className="match-prereq-badge">
              ⚠️ Requires VALIDATED status with completed AI analysis
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-error" style={{ margin: '16px 0 0' }}>
          <span>⚠️</span> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ margin: '16px 0 0' }}>
          <span>✅</span> {success}
        </div>
      )}

      {/* Assignment info bar */}
      {isAssigned && challenge?.assignment && (
        <div className="match-assignment-bar">
          <div className="match-assignment-info">
            <div className="match-assignment-left">
              <span className="match-assignment-label">Currently Assigned To</span>
              <span className="match-assignment-uni">{challenge.assignment.university_name}</span>
              {challenge.assignment.department_name && (
                <span className="match-assignment-dept">{challenge.assignment.department_name}</span>
              )}
            </div>
            <div className="match-assignment-right">
              <span className={`match-asgn-status match-asgn-status-${challenge.assignment.assignment_status.toLowerCase()}`}>
                {challenge.assignment.assignment_status}
              </span>
              {challenge.assignment.assignment_reason && (
                <span className="match-assignment-reason">Reason: {challenge.assignment.assignment_reason}</span>
              )}
              <span className="match-assignment-meta">
                by {challenge.assignment.assigned_by_name} · {new Date(challenge.assignment.assigned_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              {challenge.assignment.ai_match_score != null && (
                <span className="match-assignment-ai-note">
                  AI top score: {challenge.assignment.ai_match_score}%
                  {challenge.assignment.ai_recommended_name && (
                    <> · AI recommended: {challenge.assignment.ai_recommended_name}</>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match results */}
      {hasMatches && (
        <div className="match-results">
          <div className="match-results-header">
            <span className="match-results-count">
              {matchData.match_count} universities ranked
            </span>
            {matchData.generated_at && (
              <span className="match-results-date">
                Generated: {new Date(matchData.generated_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            )}
          </div>

          <div className="match-cards">
            {matches.map((match) => {
              const isExpanded = expandedMatch === match.id;
              const scoreColor = getScoreColor(match.match_score);

              return (
                <div
                  key={match.id}
                  className={`match-card ${isExpanded ? 'match-card-expanded' : ''} ${match.match_status === 'SELECTED' ? 'match-card-selected' : ''}`}
                >
                  {/* Card Header */}
                  <div className="match-card-header" onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
                    <div className="match-card-rank">#{match.rank}</div>

                    <div className="match-score-ring" style={{ '--score-color': scoreColor, '--score-pct': match.match_score }}>
                      <svg viewBox="0 0 36 36">
                        <path
                          className="match-score-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="match-score-fg"
                          strokeDasharray={`${match.match_score}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{ stroke: scoreColor }}
                        />
                      </svg>
                      <span className="match-score-value" style={{ color: scoreColor }}>
                        {Math.round(match.match_score)}
                      </span>
                    </div>

                    <div className="match-card-info">
                      <div className="match-card-name">{match.university_name}</div>
                      <div className="match-card-meta">
                        <span className="match-card-type">{match.university_type}</span>
                        <span className="match-card-separator">·</span>
                        <span>{match.university_district}</span>
                        {match.department_name && (
                          <>
                            <span className="match-card-separator">·</span>
                            <span className="match-card-dept">📁 {match.department_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="match-card-actions">
                      <span className="match-status-badge" style={{ backgroundColor: STATUS_COLORS[match.match_status] || '#64748b' }}>
                        {match.match_status}
                      </span>
                      <span className="match-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Explanation */}
                  {match.explanation && (
                    <div className="match-explanation">
                      <span className="match-explanation-icon">💡</span>
                      <p>{match.explanation}</p>
                    </div>
                  )}

                  {/* Factor breakdown bars (always visible) */}
                  <div className="match-factors-mini">
                    {(match.factors || []).map((factor) => {
                      const config = FACTOR_LABELS[factor.factor_name] || { label: factor.factor_name, icon: '🔹', color: '#64748b' };
                      const pct = Math.round(factor.factor_score * 100);
                      return (
                        <div key={factor.factor_name} className="factor-bar-row">
                          <span className="factor-bar-label">
                            <span className="factor-bar-icon">{config.icon}</span>
                            {config.label}
                          </span>
                          <div className="factor-bar-track">
                            <div
                              className="factor-bar-fill"
                              style={{ width: `${pct}%`, backgroundColor: config.color }}
                            />
                          </div>
                          <span className="factor-bar-value">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded: Faculty, Details, Actions */}
                  {isExpanded && (
                    <div className="match-expanded">
                      {/* Recommended Faculty */}
                      {match.recommended_faculty && match.recommended_faculty.length > 0 && (
                        <div className="match-faculty-section">
                          <h4>👨‍🏫 Recommended Faculty</h4>
                          <div className="match-faculty-list">
                            {match.recommended_faculty.map((fac, i) => (
                              <div key={i} className="match-faculty-chip">
                                <span className="match-faculty-name">{fac.faculty_name}</span>
                                <span className="match-faculty-designation">{fac.designation}</span>
                                {fac.specialization && (
                                  <span className="match-faculty-spec">{fac.specialization}</span>
                                )}
                                {fac.relevance_reason && (
                                  <span className="match-faculty-reason">{fac.relevance_reason}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Factor evidence detail */}
                      <div className="match-evidence-section">
                        <h4>📊 Scoring Evidence</h4>
                        <div className="match-evidence-grid">
                          {(match.factors || []).map((factor) => {
                            const config = FACTOR_LABELS[factor.factor_name] || { label: factor.factor_name, icon: '🔹' };
                            return (
                              <div key={factor.factor_name} className="match-evidence-item">
                                <div className="match-evidence-header">
                                  <span>{config.icon} {config.label}</span>
                                  <span className="match-evidence-score">
                                    {Math.round(factor.factor_score * 100)}% × {Math.round(factor.weight * 100)}% weight
                                  </span>
                                </div>
                                {factor.evidence && (
                                  <p className="match-evidence-text">{factor.evidence}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="match-action-bar">
                        <Link to={`/admin/universities/${match.university_id}`} className="btn-match-profile">
                          👁️ View Full Profile
                        </Link>

                        {match.match_status === 'RECOMMENDED' && (
                          <>
                            <button className="btn-match-shortlist" onClick={(e) => { e.stopPropagation(); handleMatchAction(match.id, 'shortlist'); }}>
                              ⭐ Shortlist
                            </button>
                            <button className="btn-match-reject" onClick={(e) => { e.stopPropagation(); handleMatchAction(match.id, 'reject'); }}>
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {['RECOMMENDED', 'SHORTLISTED'].includes(match.match_status) && !isAssigned && canMatch && (
                          <button
                            className="btn-match-assign"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignModal({ open: true, match });
                            }}
                          >
                            🎓 Assign This University
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasMatches && !loading && canMatch && (
        <div className="match-empty">
          <div className="match-empty-icon">🎓</div>
          <h3>No University Recommendations Yet</h3>
          <p>Generate recommendations to find the best-fit universities for this challenge based on domain expertise, faculty capabilities, lab infrastructure, and previous project experience.</p>
        </div>
      )}

      {/* Assignment Modal */}
      {assignModal.open && (
        <div className="modal-overlay" onClick={() => !assignLoading && setAssignModal({ open: false, match: null })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h3>🎓 Assign Challenge to University</h3>
            <p className="modal-desc">
              You are about to assign this challenge to <strong>{assignModal.match?.university_name}</strong>
              {assignModal.match?.department_name && <> (Department: {assignModal.match.department_name})</>}.
              The university will be notified and can accept or decline.
            </p>

            <div className="match-assign-summary">
              <div className="match-assign-score">
                <span>Match Score</span>
                <strong style={{ color: getScoreColor(assignModal.match?.match_score || 0) }}>
                  {Math.round(assignModal.match?.match_score || 0)}%
                </strong>
              </div>
              <div className="match-assign-score">
                <span>Rank</span>
                <strong>#{assignModal.match?.rank}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Assignment Reason (Optional)</label>
              <textarea
                rows={3}
                placeholder="e.g., Selected based on strong water resources expertise and previous project experience in the same district."
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
              />
            </div>

            {error && <div className="field-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="modal-actions">
              <button className="btn btn-sm" onClick={() => setAssignModal({ open: false, match: null })} disabled={assignLoading}>
                Cancel
              </button>
              <button
                className="btn btn-sm btn-match-assign"
                onClick={handleAssign}
                disabled={assignLoading}
              >
                {assignLoading ? 'Assigning...' : '✅ Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
