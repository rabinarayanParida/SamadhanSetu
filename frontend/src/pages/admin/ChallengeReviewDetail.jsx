import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import AIProblemIntelligence from '../../components/AIProblemIntelligence';
import UniversityMatching from '../../components/UniversityMatching';

export default function ChallengeReviewDetail() {
  const { id } = useParams();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Categories for metadata correction
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Internal Notes State
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Modals
  const [modalType, setModalType] = useState(null); // 'VALIDATE' | 'REJECT' | 'NEEDS_INFO' | 'DUPLICATE' | null
  const [modalComment, setModalComment] = useState('');
  const [duplicateTargetId, setDuplicateTargetId] = useState('');
  const [modalError, setModalError] = useState('');

  // Fetch challenge details
  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/admin/challenges/${id}`);
      if (res.data.success) {
        setChallenge(res.data.data);
        setSelectedCategory(res.data.data.category_id ? String(res.data.data.category_id) : '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallenge();
    API.get('/challenges/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, [fetchChallenge]);

  // Execute Status Transition
  const handleTransition = async (toStatus, comment = '', duplicateId = null) => {
    setActionLoading(true);
    setActionSuccess('');
    setModalError('');

    try {
      const payload = {
        to_status: toStatus,
        comment: comment.trim() || undefined,
        duplicate_of_id: duplicateId || undefined,
      };

      const res = await API.patch(`/admin/challenges/${id}/status`, payload);
      if (res.data.success) {
        setActionSuccess(`Status successfully updated to ${toStatus}.`);
        setModalType(null);
        setModalComment('');
        setDuplicateTargetId('');
        fetchChallenge();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status.';
      setModalError(msg);
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await API.post(`/admin/challenges/${id}/review-notes`, {
        note: newNote.trim(),
      });
      if (res.data.success) {
        setNewNote('');
        fetchChallenge();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save note.');
    } finally {
      setAddingNote(false);
    }
  };

  // Update Category
  const handleUpdateCategory = async (newCatId) => {
    setSelectedCategory(newCatId);
    try {
      const res = await API.patch(`/admin/challenges/${id}/metadata`, {
        category_id: parseInt(newCatId, 10),
      });
      if (res.data.success) {
        setActionSuccess('Category updated.');
        fetchChallenge();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update category.');
    }
  };

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

  const getMediaUrl = (m) => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    return `${base}/${m.file_path.replace(/\\/g, '/')}`;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading challenge review workspace...</p>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h1>Error Loading Challenge</h1>
          <p>{error}</p>
          <Link to="/admin/challenges" className="btn btn-primary">← Back to Review Queue</Link>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="dashboard">
      {actionSuccess && (
        <div className="alert alert-success">
          <span>✅</span> {actionSuccess}
        </div>
      )}

      {/* Top Header Card */}
      <div className="challenge-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <Link to="/admin/challenges" className="btn btn-back btn-sm">
            ← Back to Queue
          </Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="challenge-display-id">{challenge.challenge_id}</span>
            <StatusBadge status={challenge.status} />
          </div>
        </div>

        <div className="challenge-detail-title-section">
          <h1>{challenge.title}</h1>
          <p className="challenge-detail-meta">
            Submitted by <strong>{challenge.submitter_name}</strong> ·{' '}
            {formatDate(challenge.submitted_at || challenge.created_at)} ·{' '}
            {challenge.location?.district ? `District: ${challenge.location.district}` : 'District: Not specified'}
          </p>
        </div>
      </div>

      {/* 2-Column Review Workspace */}
      <div className="detail-grid">
        {/* Left Column: Challenge Data + Supporting AI Intelligence + University Matching */}
        <div className="detail-main">
          {/* Section 1: Problem Information */}
          <div className="detail-section">
            <h2>📝 Challenge Information</h2>
            <div className="review-field">
              <span className="review-label">Title</span>
              <span className="review-value" style={{ fontWeight: 600 }}>{challenge.title}</span>
            </div>
            <div className="review-field" style={{ marginTop: '12px' }}>
              <span className="review-label">Description</span>
              <p className="detail-text">{challenge.description}</p>
            </div>
          </div>

          {/* Section 2: Impact & Context */}
          <div className="detail-section">
            <h2>📊 Impact & Context</h2>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-info-label">Assigned Category</span>
                <span className="detail-info-value">
                  {challenge.category_name ? `${challenge.category_icon || ''} ${challenge.category_name}` : 'Uncategorized'}
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
                    <span className={`severity-badge severity-${challenge.severity.toLowerCase()}`}>
                      {challenge.severity}
                    </span>
                  ) : '—'}
                </span>
              </div>
            </div>

            {challenge.existing_attempts && (
              <div className="detail-subsection">
                <h3>Existing Attempts</h3>
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

          {/* Section 3: Geographical Location */}
          <div className="detail-section">
            <h2>📍 Location & Geography</h2>
            {challenge.location ? (
              <div className="detail-info-grid">
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
                  <span className="detail-info-label">Pincode</span>
                  <span className="detail-info-value">{challenge.location.pincode || '—'}</span>
                </div>
                {challenge.location.address && (
                  <div className="detail-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-info-label">Address</span>
                    <span className="detail-info-value">{challenge.location.address}</span>
                  </div>
                )}
                {challenge.location.latitude && (
                  <div className="detail-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-info-label">Coordinates</span>
                    <span className="location-coords">
                      {parseFloat(challenge.location.latitude).toFixed(6)}, {parseFloat(challenge.location.longitude).toFixed(6)}
                    </span>
                    <div style={{ marginTop: '6px' }}>
                      <a
                        href={`https://www.google.com/maps?q=${challenge.location.latitude},${challenge.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        Open in Google Maps ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No location details provided.</p>
            )}
          </div>

          {/* Section 4: Evidence Attachments */}
          <div className="detail-section">
            <h2>📎 Evidence Attachments ({challenge.media?.length || 0})</h2>
            {challenge.media && challenge.media.length > 0 ? (
              <div className="detail-media-grid">
                {challenge.media.map((m) => (
                  <div key={m.id} className="detail-media-item">
                    {m.file_type === 'photo' ? (
                      <a href={getMediaUrl(m)} target="_blank" rel="noreferrer">
                        <img src={getMediaUrl(m)} alt={m.file_name} loading="lazy" />
                      </a>
                    ) : m.file_type === 'video' ? (
                      <video src={getMediaUrl(m)} controls preload="metadata" />
                    ) : (
                      <div className="detail-media-doc">
                        <span>📄</span>
                        <a href={getMediaUrl(m)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                          {m.file_name}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No media files attached.</p>
            )}
          </div>

          {/* AI Problem Intelligence (Supporting Information Only) */}
          <AIProblemIntelligence
            challenge={challenge}
            onRefresh={fetchChallenge}
            categories={categories}
          />

          {/* University Matching Engine */}
          <UniversityMatching
            challenge={challenge}
            onRefresh={fetchChallenge}
          />
        </div>

        {/* Right Column: Review Actions (Visually Dominant) + Citizen Submitter + Notes + History */}
        <div className="detail-sidebar">
          {/* Human Decision Review Action Panel (Visually Dominant) */}
          <div className="review-action-panel">
            <div className="review-panel-title">
              <span>⚡ Human Review Actions</span>
              <StatusBadge status={challenge.status} />
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Human decision-makers have final authority. AI insights provide advisory support only.
            </p>

            <div className="review-action-buttons">
              {challenge.status === 'SUBMITTED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleTransition('UNDER_REVIEW', 'Reviewer commenced evaluation of the challenge.')}
                  disabled={actionLoading}
                  style={{ width: '100%' }}
                >
                  ▶️ Start Evaluation (Under Review)
                </button>
              )}

              {challenge.status === 'UNDER_REVIEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-action-validate"
                    onClick={() => setModalType('VALIDATE')}
                    disabled={actionLoading}
                  >
                    ✓ Validate Challenge
                  </button>

                  <button
                    type="button"
                    className="btn-action-info"
                    onClick={() => setModalType('NEEDS_INFO')}
                    disabled={actionLoading}
                  >
                    💬 Request Citizen Information
                  </button>

                  <button
                    type="button"
                    className="btn-action-duplicate"
                    onClick={() => setModalType('DUPLICATE')}
                    disabled={actionLoading}
                  >
                    📑 Flag Potential Duplicate
                  </button>

                  <button
                    type="button"
                    className="btn-action-reject"
                    onClick={() => setModalType('REJECT')}
                    disabled={actionLoading}
                  >
                    ✕ Reject Challenge
                  </button>
                </div>
              )}

              {(challenge.status === 'NEEDS_INFORMATION' ||
                challenge.status === 'POTENTIAL_DUPLICATE' ||
                challenge.status === 'REJECTED' ||
                challenge.status === 'VALIDATED') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTransition('UNDER_REVIEW', 'Re-evaluation initiated by reviewer.')}
                  disabled={actionLoading}
                  style={{ width: '100%' }}
                >
                  🔄 Re-open Evaluation
                </button>
              )}
            </div>

            {/* Category Correction */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Administrative Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleUpdateCategory(e.target.value)}
                className="queue-select"
                style={{ width: '100%', fontSize: '12.5px' }}
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {challenge.duplicate_of_code && (
              <div className="alert alert-warning" style={{ margin: 0, padding: '8px 12px', fontSize: '12px' }}>
                <span>📑</span> Duplicate of{' '}
                <Link to={`/admin/challenges/${challenge.duplicate_of_id}`} style={{ textDecoration: 'underline', fontWeight: 600 }}>
                  {challenge.duplicate_of_code}
                </Link>
              </div>
            )}
          </div>

          {/* Citizen Submitter Profile */}
          <div className="detail-section">
            <h2>👤 Submitter Profile</h2>
            <div className="review-field">
              <span className="review-label">Name</span>
              <span className="review-value" style={{ fontWeight: 600 }}>{challenge.submitter_name}</span>
            </div>
            <div className="review-field" style={{ marginTop: '6px' }}>
              <span className="review-label">Email</span>
              <span className="review-value">{challenge.submitter_email}</span>
            </div>
            {challenge.submitter_phone && (
              <div className="review-field" style={{ marginTop: '6px' }}>
                <span className="review-label">Phone</span>
                <span className="review-value">{challenge.submitter_phone}</span>
              </div>
            )}
            {challenge.submitter_district && (
              <div className="review-field" style={{ marginTop: '6px' }}>
                <span className="review-label">District</span>
                <span className="review-value">{challenge.submitter_district}</span>
              </div>
            )}
          </div>

          {/* Internal Review Notes (Private) */}
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>🔒 Internal Review Notes</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Staff only</span>
            </div>

            <form onSubmit={handleAddNote} style={{ marginBottom: '14px' }}>
              <textarea
                placeholder="Add verification note or internal observation..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                style={{ width: '100%', fontSize: '13px' }}
                maxLength={3000}
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '6px', width: '100%' }}
                disabled={addingNote || !newNote.trim()}
              >
                {addingNote ? 'Saving note...' : '+ Add Note'}
              </button>
            </form>

            {challenge.review_notes && challenge.review_notes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {challenge.review_notes.map((n) => (
                  <div key={n.id} style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '12.5px' }}>
                    <p style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{n.note}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {n.author_name} ({n.author_role}) · {formatDate(n.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No internal notes recorded yet.</p>
            )}
          </div>

          {/* Status Timeline */}
          <div className="detail-section">
            <h2>📜 Status Timeline</h2>
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
                      <span className="timeline-user">
                        By <strong>{h.changed_by_name}</strong> {h.changed_by_role && `(${h.changed_by_role})`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No timeline events recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {modalType && (
        <div className="modal-overlay" onClick={() => !actionLoading && setModalType(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'VALIDATE' && 'Validate Challenge'}
                {modalType === 'NEEDS_INFO' && 'Request Citizen Information'}
                {modalType === 'DUPLICATE' && 'Flag Potential Duplicate'}
                {modalType === 'REJECT' && 'Reject Challenge'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setModalType(null)}>✕</button>
            </div>

            <div className="modal-body">
              {modalType === 'VALIDATE' && (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Confirm that this problem is authentic, well-scoped, and ready for institutional matching.
                  </p>
                  <div className="form-group">
                    <label>Validation Note (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Confirmed with district engineering division."
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                    />
                  </div>
                </>
              )}

              {modalType === 'NEEDS_INFO' && (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Inform the citizen what specific details or evidence are required.
                  </p>
                  <div className="form-group">
                    <label>Instructions for Citizen *</label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Please provide exact street location and photos of the leak."
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                    />
                  </div>
                </>
              )}

              {modalType === 'DUPLICATE' && (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Link this challenge to an already existing primary challenge ID.
                  </p>
                  <div className="form-group">
                    <label>Target Primary Challenge ID or UUID *</label>
                    <input
                      type="text"
                      placeholder="e.g., JH-2026-0001 or UUID"
                      value={duplicateTargetId}
                      onChange={(e) => setDuplicateTargetId(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Moderator Justification *</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Same water pipeline reported in adjacent village."
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                    />
                  </div>
                </>
              )}

              {modalType === 'REJECT' && (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    State the clear policy or factual reason for rejection.
                  </p>
                  <div className="form-group">
                    <label>Reason for Rejection *</label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Issue falls under private commercial property dispute."
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                    />
                  </div>
                </>
              )}

              {modalError && (
                <div className="alert alert-error" style={{ margin: 0 }}>
                  <span>⚠️</span> {modalError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalType(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  modalType === 'VALIDATE'
                    ? 'btn-action-validate'
                    : modalType === 'REJECT'
                    ? 'btn-action-reject'
                    : 'btn-primary'
                }`}
                disabled={
                  actionLoading ||
                  (modalType === 'NEEDS_INFO' && !modalComment.trim()) ||
                  (modalType === 'DUPLICATE' && (!duplicateTargetId.trim() || !modalComment.trim())) ||
                  (modalType === 'REJECT' && !modalComment.trim())
                }
                onClick={() => {
                  if (modalType === 'VALIDATE') handleTransition('VALIDATED', modalComment);
                  if (modalType === 'NEEDS_INFO') handleTransition('NEEDS_INFORMATION', modalComment);
                  if (modalType === 'DUPLICATE') handleTransition('POTENTIAL_DUPLICATE', modalComment, duplicateTargetId.trim());
                  if (modalType === 'REJECT') handleTransition('REJECTED', modalComment);
                }}
              >
                {actionLoading ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
