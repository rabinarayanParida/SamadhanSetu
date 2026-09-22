import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import LocationPicker from '../../components/LocationPicker';
import MediaUploader from '../../components/MediaUploader';

const STEPS = [
  { id: 1, title: '01 Problem', icon: '1' },
  { id: 2, title: '02 Impact', icon: '2' },
  { id: 3, title: '03 Location', icon: '3' },
  { id: 4, title: '04 Evidence', icon: '4' },
  { id: 5, title: '05 Review', icon: '5' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', desc: 'Minor inconvenience, affects few people', color: '#10b981' },
  { value: 'medium', label: 'Medium', desc: 'Moderate impact on community', color: '#f59e0b' },
  { value: 'high', label: 'High', desc: 'Significant problem affecting many', color: '#f97316' },
  { value: 'critical', label: 'Critical', desc: 'Urgent issue requiring immediate attention', color: '#ef4444' },
];

export default function ChallengeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [challengeDbId, setChallengeDbId] = useState(null);
  const [challengeDisplayId, setChallengeDisplayId] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [media, setMedia] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    affected_population: '',
    severity: '',
    existing_attempts: '',
    expected_outcome: '',
    location: {
      latitude: null,
      longitude: null,
      address: '',
      state: 'Jharkhand',
      district: '',
      block: '',
      village_city: '',
      pincode: '',
    },
  });

  // Fetch categories
  useEffect(() => {
    API.get('/challenges/categories')
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  // Load existing challenge if editing
  useEffect(() => {
    if (id) {
      API.get(`/challenges/${id}`)
        .then((res) => {
          const ch = res.data.data;
          if (ch.status !== 'DRAFT' && ch.status !== 'NEEDS_INFORMATION') {
            setError(`Challenge cannot be edited. Current status: ${ch.status}.`);
            return;
          }
          if (ch.status === 'NEEDS_INFORMATION') {
            const latestHistory = ch.status_history?.find((h) => h.to_status === 'NEEDS_INFORMATION');
            if (latestHistory?.comment) {
              setSuccess(`Reviewer request: "${latestHistory.comment}" — Please update the details and re-submit.`);
            }
          }
          setChallengeDbId(ch.id);
          setChallengeDisplayId(ch.challenge_id);
          setMedia(ch.media || []);
          setFormData({
            title: ch.title || '',
            description: ch.description || '',
            category_id: ch.category_id ? String(ch.category_id) : '',
            affected_population: ch.affected_population || '',
            severity: ch.severity || '',
            existing_attempts: ch.existing_attempts || '',
            expected_outcome: ch.expected_outcome || '',
            location: {
              latitude: ch.location?.latitude || null,
              longitude: ch.location?.longitude || null,
              address: ch.location?.address || '',
              state: ch.location?.state || 'Jharkhand',
              district: ch.location?.district || '',
              block: ch.location?.block || '',
              village_city: ch.location?.village_city || '',
              pincode: ch.location?.pincode || '',
            },
          });
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load challenge.');
        });
    }
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setError('');
  };

  const handleLocationChange = (locationData) => {
    setFormData((prev) => ({ ...prev, location: locationData }));
  };

  // Validate current step
  const validateStep = () => {
    const errors = {};

    if (step === 1) {
      if (!formData.title.trim()) errors.title = 'Title is required.';
      else if (formData.title.trim().length < 10) errors.title = 'Title must be at least 10 characters.';
      if (!formData.description.trim()) errors.description = 'Description is required.';
      else if (formData.description.trim().length < 50) errors.description = 'Description must be at least 50 characters.';
    }

    if (step === 2) {
      if (formData.affected_population && (isNaN(Number(formData.affected_population)) || Number(formData.affected_population) < 0)) {
        errors.affected_population = 'Affected population must be a non-negative number.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save as draft (create or update)
  const saveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
      };

      if (challengeDbId) {
        // Update existing draft
        const { data } = await API.put(`/challenges/${challengeDbId}`, payload);
        if (data.success) {
          setSuccess('Draft saved!');
          setTimeout(() => setSuccess(''), 2000);
        }
      } else {
        // Create new draft
        const { data } = await API.post('/challenges', payload);
        if (data.success) {
          setChallengeDbId(data.data.id);
          setChallengeDisplayId(data.data.challenge_id);
          setSuccess('Draft created!');
          setTimeout(() => setSuccess(''), 2000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft.');
      if (err.response?.data?.errors) {
        const mapped = {};
        err.response.data.errors.forEach((e) => { mapped[e.field] = e.message; });
        setFieldErrors(mapped);
      }
    } finally {
      setSaving(false);
    }
  };

  // Proceed to next step
  const nextStep = async () => {
    if (!validateStep()) return;

    // Auto-save on step 1 if not yet saved
    if (step === 1 && !challengeDbId) {
      setSaving(true);
      setError('');
      try {
        const payload = {
          ...formData,
          category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        };
        const { data } = await API.post('/challenges', payload);
        if (data.success) {
          setChallengeDbId(data.data.id);
          setChallengeDisplayId(data.data.challenge_id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save challenge.');
        setSaving(false);
        return;
      }
      setSaving(false);
    } else if (challengeDbId && step < 5) {
      // Save progress
      await saveDraft();
    }

    setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Final submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Save latest data first
      if (challengeDbId) {
        const payload = {
          ...formData,
          category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        };
        await API.put(`/challenges/${challengeDbId}`, payload);
      }

      // Submit
      const { data } = await API.put(`/challenges/${challengeDbId}/submit`);
      if (data.success) {
        navigate(`/citizen/challenges/${challengeDbId}`, {
          state: { justSubmitted: true },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === parseInt(id, 10));
    return cat ? `${cat.icon} ${cat.name}` : '—';
  };

  return (
    <div className="challenge-form-page">
      <div className="challenge-form-container">
        {/* Header */}
        <div className="cf-header">
          <h1>Submit a Societal Challenge</h1>
          {challengeDisplayId && (
            <span className="cf-draft-badge">Draft: {challengeDisplayId}</span>
          )}
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`step-item ${step === s.id ? 'step-active' : ''} ${step > s.id ? 'step-done' : ''}`}
              onClick={() => {
                if (s.id < step || (challengeDbId && s.id <= 5)) {
                  if (s.id <= step || challengeDbId) setStep(s.id);
                }
              }}
            >
              <div className="step-circle">
                {step > s.id ? '✓' : s.icon}
              </div>
              <span className="step-label">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error"><span>⚠️</span> {error}</div>
        )}
        {success && (
          <div className="alert alert-success"><span>✅</span> {success}</div>
        )}

        {/* Step Content */}
        <div className="cf-body">
          {/* STEP 1: Problem Info */}
          {step === 1 && (
            <div className="cf-step">
              <h2>📝 Problem Information</h2>
              <p className="cf-step-desc">Describe the societal challenge you've identified.</p>

              <div className="form-group">
                <label htmlFor="cf-title">Challenge Title *</label>
                <input
                  type="text"
                  id="cf-title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Contaminated drinking water supply in Kanke block"
                  className={fieldErrors.title ? 'input-error' : ''}
                  maxLength={200}
                />
                <div className="cf-field-meta">
                  {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
                  <span className="char-count">{formData.title.length}/200</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cf-desc">Detailed Description *</label>
                <textarea
                  id="cf-desc"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe the challenge in detail. Include what the problem is, who it affects, where it occurs, when it started, and how it impacts the community..."
                  className={fieldErrors.description ? 'input-error' : ''}
                  rows={6}
                  maxLength={5000}
                />
                <div className="cf-field-meta">
                  {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
                  <span className="char-count">{formData.description.length}/5000</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cf-category">Category (Optional)</label>
                <select
                  id="cf-category"
                  value={formData.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Impact */}
          {step === 2 && (
            <div className="cf-step">
              <h2>📊 Impact & Context</h2>
              <p className="cf-step-desc">Help us understand the severity and scope of this challenge.</p>

              <div className="form-group">
                <label htmlFor="cf-population">Affected Population (Approx. number of people)</label>
                <input
                  type="number"
                  min="0"
                  id="cf-population"
                  value={formData.affected_population}
                  onChange={(e) => handleChange('affected_population', e.target.value)}
                  placeholder="e.g., 5000"
                  className={fieldErrors.affected_population ? 'input-error' : ''}
                />
                {fieldErrors.affected_population && (
                  <span className="field-error">{fieldErrors.affected_population}</span>
                )}
              </div>

              <div className="form-group">
                <label>Severity Level</label>
                <div className="severity-grid">
                  {SEVERITY_OPTIONS.map((s) => (
                    <label
                      key={s.value}
                      className={`severity-option ${formData.severity === s.value ? 'severity-selected' : ''}`}
                      style={{ '--sev-color': s.color }}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={s.value}
                        checked={formData.severity === s.value}
                        onChange={(e) => handleChange('severity', e.target.value)}
                        className="sr-only"
                      />
                      <span className="severity-label">{s.label}</span>
                      <span className="severity-desc">{s.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cf-attempts">Existing Attempts to Solve</label>
                <textarea
                  id="cf-attempts"
                  value={formData.existing_attempts}
                  onChange={(e) => handleChange('existing_attempts', e.target.value)}
                  placeholder="Have there been any previous attempts to address this problem? What was tried and why didn't it work?"
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cf-outcome">Expected Outcome</label>
                <textarea
                  id="cf-outcome"
                  value={formData.expected_outcome}
                  onChange={(e) => handleChange('expected_outcome', e.target.value)}
                  placeholder="What outcome or solution would you like to see for this challenge?"
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Location */}
          {step === 3 && (
            <div className="cf-step">
              <h2>📍 Location</h2>
              <p className="cf-step-desc">Where is this challenge located? Use GPS, search, or enter manually.</p>

              <LocationPicker
                location={formData.location}
                onChange={handleLocationChange}
              />
            </div>
          )}

          {/* STEP 4: Evidence */}
          {step === 4 && (
            <div className="cf-step">
              <h2>📎 Supporting Evidence</h2>
              <p className="cf-step-desc">Upload photos, videos, and documents to support your challenge.</p>

              {challengeDbId ? (
                <MediaUploader
                  challengeId={challengeDbId}
                  media={media}
                  onMediaChange={setMedia}
                />
              ) : (
                <div className="media-empty">
                  <span>📎</span>
                  <p>Save the challenge as a draft first to upload files.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="cf-step">
              <h2>✅ Review & Submit</h2>
              <p className="cf-step-desc">Review your challenge before submitting.</p>

              <div className="review-section">
                <div className="review-group">
                  <h3>Problem Information</h3>
                  <div className="review-field">
                    <span className="review-label">Title</span>
                    <span className="review-value">{formData.title || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Description</span>
                    <span className="review-value review-text">{formData.description || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Category</span>
                    <span className="review-value">{formData.category_id ? getCategoryName(formData.category_id) : '—'}</span>
                  </div>
                </div>

                <div className="review-group">
                  <h3>Impact & Context</h3>
                  <div className="review-field">
                    <span className="review-label">Affected Population</span>
                    <span className="review-value">{formData.affected_population || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Severity</span>
                    <span className="review-value">
                      {formData.severity ? (
                        <span className={`severity-badge severity-${formData.severity}`}>
                          {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
                        </span>
                      ) : '—'}
                    </span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Existing Attempts</span>
                    <span className="review-value review-text">{formData.existing_attempts || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Expected Outcome</span>
                    <span className="review-value review-text">{formData.expected_outcome || '—'}</span>
                  </div>
                </div>

                <div className="review-group">
                  <h3>Location</h3>
                  {formData.location.latitude ? (
                    <>
                      <div className="review-field">
                        <span className="review-label">Coordinates</span>
                        <span className="review-value">
                          {parseFloat(formData.location.latitude).toFixed(6)}, {parseFloat(formData.location.longitude).toFixed(6)}
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="review-field">
                    <span className="review-label">Address</span>
                    <span className="review-value">{formData.location.address || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">State</span>
                    <span className="review-value">{formData.location.state || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">District</span>
                    <span className="review-value">{formData.location.district || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Block / Subdivision</span>
                    <span className="review-value">{formData.location.block || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Village / City / Locality</span>
                    <span className="review-value">{formData.location.village_city || '—'}</span>
                  </div>
                  <div className="review-field">
                    <span className="review-label">Pincode</span>
                    <span className="review-value">{formData.location.pincode || '—'}</span>
                  </div>
                </div>

                <div className="review-group">
                  <h3>Evidence</h3>
                  <div className="review-field">
                    <span className="review-label">Files Uploaded</span>
                    <span className="review-value">
                      {media.length > 0
                        ? `${media.filter((m) => m.file_type === 'photo').length} photos, ${media.filter((m) => m.file_type === 'video').length} videos, ${media.filter((m) => m.file_type === 'document').length} documents`
                        : 'No files uploaded'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="cf-nav">
          <div className="cf-nav-left">
            {step > 1 && (
              <button type="button" className="btn btn-secondary" onClick={prevStep}>
                ← Previous
              </button>
            )}
          </div>
          <div className="cf-nav-right">
            {challengeDbId && step < 5 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={saveDraft}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Draft'}
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                className="btn btn-primary-action"
                onClick={nextStep}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Next →'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-submit-challenge"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="btn-loading"><span className="spinner" /> Submitting...</span>
                ) : (
                  '🚀 Submit Challenge'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
