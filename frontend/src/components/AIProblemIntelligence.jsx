import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function AIProblemIntelligence({ challenge, onRefresh, categories = [] }) {
  const [aiData, setAiData] = useState(challenge?.ai_intelligence || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Override Modal state
  const [overrideModal, setOverrideModal] = useState({
    open: false,
    field: '',
    label: '',
    aiValue: '',
    humanValue: '',
    reason: '',
  });

  // Sync state if prop changes
  useEffect(() => {
    if (challenge?.ai_intelligence) {
      setAiData(challenge.ai_intelligence);
    }
  }, [challenge]);

  const results = aiData?.ai_results;
  const duplicateCandidates = aiData?.duplicate_candidates || [];
  const overrides = aiData?.overrides || [];

  // Determine effective values (Human override taking precedence over AI suggestion)
  const getEffectiveValue = (field) => {
    const override = overrides.find((o) => o.field_name === field);
    return override ? override.human_value : null;
  };

  const getOverrideReason = (field) => {
    const override = overrides.find((o) => o.field_name === field);
    return override ? override.reason : null;
  };

  // Trigger full AI pipeline
  const handleAnalyze = async (isRetry = false) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const endpoint = isRetry
        ? `/ai/challenges/${challenge.id}/retry`
        : `/ai/challenges/${challenge.id}/process`;
      const res = await API.post(endpoint);

      if (res.data.success) {
        setAiData(res.data.data);
        setSuccessMsg(
          isRetry
            ? 'AI Problem Intelligence pipeline re-executed successfully!'
            : 'AI Problem Intelligence analysis completed successfully!'
        );
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete AI processing.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Open Override Modal
  const openOverrideModal = (field, label, currentAiValue) => {
    setOverrideModal({
      open: true,
      field,
      label,
      aiValue: currentAiValue || 'None',
      humanValue: getEffectiveValue(field) || currentAiValue || '',
      reason: '',
    });
  };

  // Submit Reviewer Override
  const submitOverride = async (e) => {
    e.preventDefault();
    if (!overrideModal.humanValue.trim()) {
      alert('Please enter a valid human decision value.');
      return;
    }
    if (!overrideModal.reason || overrideModal.reason.trim().length < 5) {
      alert('Please provide a detailed justification reason (minimum 5 characters).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await API.patch(`/ai/challenges/${challenge.id}/override`, {
        field_name: overrideModal.field,
        human_value: overrideModal.humanValue.trim(),
        reason: overrideModal.reason.trim(),
      });

      if (res.data.success) {
        setAiData(res.data.data.ai);
        setSuccessMsg(`Human decision recorded for ${overrideModal.label}. AI suggestion preserved.`);
        setOverrideModal({ open: false, field: '', label: '', aiValue: '', humanValue: '', reason: '' });
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reviewer override.');
    } finally {
      setLoading(false);
    }
  };

  // Duplicate Action: Confirm or Dismiss
  const handleDuplicateDecision = async (candidateId, reviewStatus) => {
    setLoading(true);
    setError('');
    try {
      const res = await API.patch(
        `/ai/challenges/${challenge.id}/duplicates/${candidateId}`,
        { review_status: reviewStatus }
      );

      if (res.data.success) {
        setAiData(res.data.data.ai);
        setSuccessMsg(
          reviewStatus === 'CONFIRMED_DUPLICATE'
            ? 'Challenge confirmed as duplicate candidate.'
            : 'Candidate marked as not a duplicate.'
        );
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update duplicate status.');
    } finally {
      setLoading(false);
    }
  };

  const status = results?.processing_status || 'IDLE';

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-title-group">
          <div className="ai-icon-badge">🤖</div>
          <div>
            <div className="ai-title">
              <span>AI Problem Intelligence Engine</span>
              {status === 'COMPLETED' && (
                <span className="ai-status-badge ai-status-completed">✓ Analysis Ready</span>
              )}
              {status === 'PROCESSING' && (
                <span className="ai-status-badge ai-status-processing">⟳ Processing...</span>
              )}
              {status === 'FAILED' && (
                <span className="ai-status-badge ai-status-failed">✕ Pipeline Error</span>
              )}
              {status === 'IDLE' && (
                <span className="ai-status-badge ai-status-idle">Not Analyzed</span>
              )}
            </div>
            <div className="ai-disclaimer">
              Decision-support intelligence layer. Recommendations inform human review and do not alter legal/business state without human confirmation.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {status === 'COMPLETED' ? (
            <button
              className="ai-btn-analyze"
              style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)' }}
              onClick={() => handleAnalyze(true)}
              disabled={loading}
            >
              {loading ? 'Re-analyzing...' : '🔄 Re-run AI Analysis'}
            </button>
          ) : (
            <button
              className="ai-btn-analyze"
              onClick={() => handleAnalyze(false)}
              disabled={loading || status === 'PROCESSING'}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                  Analyzing Challenge...
                </>
              ) : (
                '⚡ Run AI Intelligence Analysis'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>⚠️</span> {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Version Metadata Tag when completed */}
      {status === 'COMPLETED' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
          <span><strong>Model:</strong> {results.model_name || 'gpt-4o-mini'}</span>
          <span>•</span>
          <span><strong>Pipeline:</strong> {results.pipeline_version || 'phase4-v1.0'}</span>
          <span>•</span>
          <span><strong>Prompt:</strong> {results.prompt_version || 'v1.0'}</span>
          {results.completed_at && (
            <>
              <span>•</span>
              <span><strong>Analyzed:</strong> {new Date(results.completed_at).toLocaleString()}</span>
            </>
          )}
        </div>
      )}

      {/* Grid of Intelligence Cards */}
      {status === 'COMPLETED' && (
        <div className="ai-grid">
          {/* Card 1: Multi-Level Classification */}
          <div className="ai-card">
            <div className="ai-card-title">
              <span>Domain Classification</span>
              <button
                className="btn-override-sm"
                onClick={() => openOverrideModal('category', 'Category', results.ai_category)}
              >
                ✎ Override
              </button>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Suggested Category:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="ai-card-val">{results.ai_category || 'Unassigned'}</span>
                {results.classification_confidence && (
                  <span className="ai-confidence-badge">
                    {Math.round(results.classification_confidence * 100)}% Match
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Suggested Sub-category:</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)', marginTop: '2px' }}>
                {results.ai_subcategory || 'General Community Need'}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              Citizen Submitted: <strong>{challenge.category_name || 'Uncategorized'}</strong>
            </div>

            {getEffectiveValue('category') && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-badge-override">Human Override Active</span>
                  <strong style={{ color: '#f59e0b' }}>{getEffectiveValue('category')}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                  Reason: "{getOverrideReason('category')}"
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Quality & Validation Assessment */}
          <div className="ai-card">
            <div className="ai-card-title">
              <span>Validation Assessment</span>
              {results.validation_confidence && (
                <span className="ai-confidence-badge">
                  {Math.round(results.validation_confidence * 100)}% Confidence
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="ai-card-val" style={{ color: results.quality_score >= 70 ? '#10b981' : (results.quality_score >= 45 ? '#f59e0b' : '#ef4444') }}>
                {results.quality_score} / 100
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quality Score</span>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assessment Status:</div>
              <span style={{ fontWeight: 600, fontSize: '13px', color: results.is_valid ? '#10b981' : '#f59e0b' }}>
                {results.is_valid ? '✓ Genuine Community Challenge' : '⚠️ Requires Physical Verification'}
              </span>
            </div>

            {/* Warnings or missing info */}
            {results.missing_information && results.missing_information.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginBottom: '4px' }}>
                  Missing Information:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {results.missing_information.map((info, idx) => (
                    <span key={idx} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                      • {info}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.validation_warnings && results.validation_warnings.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <strong>Note:</strong> {results.validation_warnings.join('; ')}
              </div>
            )}
          </div>

          {/* Card 3: Priority Scoring & Factor Breakdown */}
          <div className="ai-card">
            <div className="ai-card-title">
              <span>Priority Scoring</span>
              <button
                className="btn-override-sm"
                onClick={() => openOverrideModal('priority_level', 'Priority Level', results.priority_level)}
              >
                ✎ Override
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="ai-card-val">{results.priority_score} / 100</span>
                <span className={`severity-badge severity-${(results.priority_level || 'medium').toLowerCase()}`}>
                  {results.priority_level} PRIORITY
                </span>
              </div>
              {results.priority_confidence && (
                <span className="ai-confidence-badge">
                  {Math.round(results.priority_confidence * 100)}% Conf
                </span>
              )}
            </div>

            {/* Factor breakdown bars */}
            {results.priority_factors && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="ai-factor-row">
                  <div className="ai-factor-header">
                    <span>Population Impact</span>
                    <strong>{results.priority_factors.population_impact || 0} / 25</strong>
                  </div>
                  <div className="ai-factor-track">
                    <div className="ai-factor-fill" style={{ width: `${((results.priority_factors.population_impact || 0) / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div className="ai-factor-row">
                  <div className="ai-factor-header">
                    <span>Severity & Harm</span>
                    <strong>{results.priority_factors.severity || 0} / 25</strong>
                  </div>
                  <div className="ai-factor-track">
                    <div className="ai-factor-fill" style={{ width: `${((results.priority_factors.severity || 0) / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div className="ai-factor-row">
                  <div className="ai-factor-header">
                    <span>Urgency</span>
                    <strong>{results.priority_factors.urgency || 0} / 20</strong>
                  </div>
                  <div className="ai-factor-track">
                    <div className="ai-factor-fill" style={{ width: `${((results.priority_factors.urgency || 0) / 20) * 100}%` }}></div>
                  </div>
                </div>

                <div className="ai-factor-row">
                  <div className="ai-factor-header">
                    <span>Geographic Spread</span>
                    <strong>{results.priority_factors.geographic_impact || 0} / 15</strong>
                  </div>
                  <div className="ai-factor-track">
                    <div className="ai-factor-fill" style={{ width: `${((results.priority_factors.geographic_impact || 0) / 15) * 100}%` }}></div>
                  </div>
                </div>

                <div className="ai-factor-row">
                  <div className="ai-factor-header">
                    <span>Intervention Feasibility</span>
                    <strong>{results.priority_factors.feasibility || 0} / 15</strong>
                  </div>
                  <div className="ai-factor-track">
                    <div className="ai-factor-fill" style={{ width: `${((results.priority_factors.feasibility || 0) / 15) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            )}

            {getEffectiveValue('priority_level') && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-badge-override">Human Override Active</span>
                  <strong style={{ color: '#f59e0b' }}>{getEffectiveValue('priority_level')}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                  Reason: "{getOverrideReason('priority_level')}"
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Routing Domain Recommendation */}
          <div className="ai-card">
            <div className="ai-card-title">
              <span>Routing Domain</span>
              <button
                className="btn-override-sm"
                onClick={() => openOverrideModal('routing_domain', 'Routing Domain', results.routing_domain)}
              >
                ✎ Override
              </button>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recommended Department / Domain:</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {results.routing_domain || 'General Rural & Community Development'}
              </div>
            </div>

            {results.routing_explanation && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {results.routing_explanation}
              </div>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
              ℹ️ Broad domain recommendation for subsequent Phase 5 institutional routing.
            </div>

            {getEffectiveValue('routing_domain') && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-badge-override">Human Override Active</span>
                  <strong style={{ color: '#f59e0b' }}>{getEffectiveValue('routing_domain')}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                  Reason: "{getOverrideReason('routing_domain')}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Semantic Duplicate Detection Panel */}
      {status === 'COMPLETED' && (
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              📑 Semantic Duplicate Candidates ({duplicateCandidates.length})
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Based on vector cosine similarity (Threshold ≥ 40%)
            </span>
          </div>

          {duplicateCandidates.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
              ✓ No candidate duplicates detected in the database.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {duplicateCandidates.map((dup) => {
                const simPercent = Math.round(dup.similarity_score * 100);
                const isHigh = dup.similarity_score >= 0.8;
                return (
                  <div key={dup.id || dup.candidate_id} className="ai-dup-card">
                    <div className="ai-dup-header">
                      <span className="queue-id-badge">{dup.candidate_code || 'CHALLENGE'}</span>
                      <span className={isHigh ? 'ai-dup-score-high' : 'ai-dup-score-med'}>
                        {simPercent}% Similarity {isHigh ? '⚡ Strong Match' : '🔍 Potential Match'}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dup.candidate_title}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Status: <span style={{ color: '#fff' }}>{dup.candidate_status || 'Active'}</span>
                      {dup.candidate_category && ` · Category: ${dup.candidate_category}`}
                    </div>

                    {/* Review Decision Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: dup.review_status === 'CONFIRMED_DUPLICATE' ? '#ec4899' : (dup.review_status === 'NOT_DUPLICATE' ? '#10b981' : 'var(--text-muted)') }}>
                        Review: <strong>{dup.review_status || 'PENDING'}</strong>
                        {dup.reviewed_by_name && ` by ${dup.reviewed_by_name}`}
                      </span>

                      <Link
                        to={`/admin/challenges/${dup.candidate_id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--accent-secondary)', textDecoration: 'underline' }}
                      >
                        Inspect ↗
                      </Link>
                    </div>

                    {/* Actions if pending */}
                    {dup.review_status !== 'CONFIRMED_DUPLICATE' && dup.review_status !== 'NOT_DUPLICATE' && (
                      <div className="ai-dup-actions">
                        <button
                          className="btn-confirm-dup"
                          onClick={() => handleDuplicateDecision(dup.candidate_id, 'CONFIRMED_DUPLICATE')}
                          disabled={loading}
                        >
                          Confirm Duplicate
                        </button>
                        <button
                          className="btn-dismiss-dup"
                          onClick={() => handleDuplicateDecision(dup.candidate_id, 'NOT_DUPLICATE')}
                          disabled={loading}
                        >
                          Not a Duplicate
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Override Modal */}
      {overrideModal.open && (
        <div className="modal-overlay" onClick={() => setOverrideModal({ ...overrideModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Override {overrideModal.label}</h3>
            <p className="modal-desc">
              Human reviewers have ultimate authority to adjust AI recommendations. The original AI analysis remains preserved for auditing.
            </p>

            <form onSubmit={submitOverride}>
              <div style={{ marginBottom: '14px' }}>
                <span className="review-label">AI Suggested Value (Preserved):</span>
                <div style={{ fontWeight: 600, color: 'var(--accent-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  {overrideModal.aiValue}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Reviewer Decision / Final {overrideModal.label}:</label>
                {overrideModal.field === 'category' ? (
                  <select
                    value={overrideModal.humanValue}
                    onChange={(e) => setOverrideModal({ ...overrideModal, humanValue: e.target.value })}
                    className="queue-select"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                ) : overrideModal.field === 'priority_level' ? (
                  <select
                    value={overrideModal.humanValue}
                    onChange={(e) => setOverrideModal({ ...overrideModal, humanValue: e.target.value })}
                    className="queue-select"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={overrideModal.humanValue}
                    onChange={(e) => setOverrideModal({ ...overrideModal, humanValue: e.target.value })}
                    placeholder={`Enter corrected ${overrideModal.label}...`}
                    required
                  />
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Justification Reason (Minimum 5 characters):</label>
                <textarea
                  value={overrideModal.reason}
                  onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                  placeholder="Explain why this recommendation is being adjusted..."
                  rows={3}
                  required
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    padding: '10px',
                    fontSize: '13px',
                    width: '100%',
                  }}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setOverrideModal({ ...overrideModal, open: false })}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-action-validate"
                  disabled={loading}
                >
                  {loading ? 'Saving Override...' : 'Save Decision & Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
