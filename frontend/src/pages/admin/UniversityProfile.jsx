import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';

const STRENGTH_COLORS = {
  LEADING: '#10b981',
  STRONG: '#3b82f6',
  MODERATE: '#f59e0b',
  EMERGING: '#8b5cf6',
};

const CAPACITY_LABELS = {
  AVAILABLE: { label: 'Available', color: '#10b981', icon: '🟢' },
  LIMITED: { label: 'Limited', color: '#f59e0b', icon: '🟡' },
  UNAVAILABLE: { label: 'Unavailable', color: '#ef4444', icon: '🔴' },
  UNKNOWN: { label: 'Unknown', color: '#64748b', icon: '⚪' },
};

export default function UniversityProfile() {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    API.get(`/universities/${id}`)
      .then((res) => {
        if (res.data.success) setUniversity(res.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load university.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading university profile...</p>
      </div>
    );
  }

  if (error || !university) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h1>Error</h1>
          <p>{error || 'University not found.'}</p>
          <Link to="/admin/challenges" className="btn btn-submit">← Back</Link>
        </div>
      </div>
    );
  }

  const cap = CAPACITY_LABELS[university.capacity_status] || CAPACITY_LABELS.UNKNOWN;
  const tabs = [
    { id: 'overview', label: '📋 Overview', count: null },
    { id: 'departments', label: '🏛️ Departments', count: university.departments?.length },
    { id: 'faculty', label: '👨‍🏫 Faculty', count: university.faculty?.length },
    { id: 'research', label: '🔬 Research', count: university.research_areas?.length },
    { id: 'labs', label: '🧪 Labs', count: university.labs?.length },
    { id: 'projects', label: '📋 Projects', count: university.projects?.length },
    { id: 'innovation', label: '💡 Innovation', count: university.innovation_centres?.length },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="uni-profile-header">
        <Link to="/admin/challenges" className="btn btn-back" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          ← Back
        </Link>
        <div className="uni-profile-title-row">
          <div>
            <span className="uni-profile-code">{university.code}</span>
            <h1>{university.name}</h1>
            <div className="uni-profile-meta">
              <span className="uni-profile-type">{university.type}</span>
              <span>📍 {university.location}, {university.district}</span>
              {university.established_year && <span>Est. {university.established_year}</span>}
              {university.website && (
                <a href={university.website} target="_blank" rel="noreferrer" className="uni-profile-link">
                  🌐 Website ↗
                </a>
              )}
            </div>
          </div>
          <div className="uni-profile-capacity">
            <span className="uni-capacity-badge" style={{ backgroundColor: cap.color + '20', color: cap.color }}>
              {cap.icon} {cap.label}
            </span>
            <span className="uni-capacity-count">
              {university.active_assignment_count || 0} / {university.max_concurrent_projects || 10} active projects
            </span>
          </div>
        </div>
        {university.description && (
          <p className="uni-profile-desc">{university.description.replace('[DEMO DATA] ', '')}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="uni-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`uni-tab ${activeTab === tab.id ? 'uni-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count != null && <span className="uni-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="uni-tab-content">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="uni-overview">
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-block">
                <div className="stat-block-icon" style={{ background: '#6366f120', color: '#6366f1' }}>🏛️</div>
                <div className="stat-block-info">
                  <span className="stat-block-value">{university.departments?.length || 0}</span>
                  <span className="stat-block-label">Departments</span>
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-block-icon" style={{ background: '#10b98120', color: '#10b981' }}>👨‍🏫</div>
                <div className="stat-block-info">
                  <span className="stat-block-value">{university.faculty?.length || 0}</span>
                  <span className="stat-block-label">Faculty</span>
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-block-icon" style={{ background: '#3b82f620', color: '#3b82f6' }}>🧪</div>
                <div className="stat-block-info">
                  <span className="stat-block-value">{university.labs?.length || 0}</span>
                  <span className="stat-block-label">Labs & Facilities</span>
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-block-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>📋</div>
                <div className="stat-block-info">
                  <span className="stat-block-value">{university.projects?.length || 0}</span>
                  <span className="stat-block-label">Past Projects</span>
                </div>
              </div>
            </div>

            {/* Research Strength */}
            {university.research_areas?.length > 0 && (
              <div className="detail-section">
                <h2>🔬 Research Strengths</h2>
                <div className="uni-research-tags">
                  {university.research_areas.map((ra) => (
                    <span
                      key={ra.id}
                      className="uni-research-tag"
                      style={{ borderColor: STRENGTH_COLORS[ra.strength_level] || '#64748b' }}
                    >
                      <span className="uni-research-strength" style={{ color: STRENGTH_COLORS[ra.strength_level] }}>
                        {ra.strength_level}
                      </span>
                      {ra.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Innovation Centres */}
            {university.innovation_centres?.length > 0 && (
              <div className="detail-section" style={{ marginTop: '20px' }}>
                <h2>💡 Innovation & Incubation Centres</h2>
                {university.innovation_centres.map((ic) => (
                  <div key={ic.id} className="uni-innovation-card">
                    <strong>{ic.name}</strong>
                    {ic.capability && <span className="uni-innovation-cap">{ic.capability}</span>}
                    {ic.description && <p>{ic.description.replace('[DEMO] ', '')}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Departments */}
        {activeTab === 'departments' && (
          <div className="uni-dept-grid">
            {(university.departments || []).map((dept) => (
              <div key={dept.id} className="uni-dept-card">
                <div className="uni-dept-header">
                  <h3>{dept.name}</h3>
                  {dept.code && <span className="uni-dept-code">{dept.code}</span>}
                </div>
                <p className="uni-dept-desc">{dept.description?.replace('[DEMO] ', '') || 'No description'}</p>
                <div className="uni-dept-footer">
                  <span>👨‍🏫 {dept.faculty_count || 0} Faculty</span>
                </div>
              </div>
            ))}
            {(!university.departments || university.departments.length === 0) && (
              <p className="text-muted">No departments registered.</p>
            )}
          </div>
        )}

        {/* Faculty */}
        {activeTab === 'faculty' && (
          <div className="uni-faculty-grid">
            {(university.faculty || []).map((fac) => (
              <div key={fac.id} className="uni-faculty-card">
                <div className="uni-faculty-header">
                  <div>
                    <h3>{fac.name}</h3>
                    <span className="uni-faculty-designation">{fac.designation}</span>
                  </div>
                  {fac.department_name && (
                    <span className="uni-faculty-dept">{fac.department_name}</span>
                  )}
                </div>
                {fac.specialization && <p className="uni-faculty-spec">🎯 {fac.specialization}</p>}
                {fac.profile_summary && (
                  <p className="uni-faculty-summary">{fac.profile_summary.replace('[DEMO] ', '')}</p>
                )}
                {fac.expertise && Array.isArray(fac.expertise) && fac.expertise.length > 0 && (
                  <div className="uni-faculty-expertise">
                    {fac.expertise.map((exp, ei) => (
                      <div key={ei}>
                        {exp.keywords && Array.isArray(exp.keywords) && (
                          <div className="uni-keyword-tags">
                            {exp.keywords.slice(0, 8).map((kw, ki) => (
                              <span key={ki} className="uni-keyword-tag">{kw}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(!university.faculty || university.faculty.length === 0) && (
              <p className="text-muted">No faculty registered.</p>
            )}
          </div>
        )}

        {/* Research */}
        {activeTab === 'research' && (
          <div className="uni-research-grid">
            {(university.research_areas || []).map((ra) => (
              <div key={ra.id} className="uni-research-card">
                <div className="uni-research-card-header">
                  <h3>{ra.name}</h3>
                  <span className="uni-strength-badge" style={{ backgroundColor: STRENGTH_COLORS[ra.strength_level] + '20', color: STRENGTH_COLORS[ra.strength_level] }}>
                    {ra.strength_level}
                  </span>
                </div>
                {ra.description && <p>{ra.description}</p>}
              </div>
            ))}
            {(!university.research_areas || university.research_areas.length === 0) && (
              <p className="text-muted">No research areas registered.</p>
            )}
          </div>
        )}

        {/* Labs */}
        {activeTab === 'labs' && (
          <div className="uni-lab-grid">
            {(university.labs || []).map((lab) => (
              <div key={lab.id} className="uni-lab-card">
                <h3>🧪 {lab.name}</h3>
                {lab.department_name && <span className="uni-lab-dept">{lab.department_name}</span>}
                {lab.description && <p>{lab.description.replace('[DEMO] ', '')}</p>}
                {lab.capabilities && Array.isArray(lab.capabilities) && lab.capabilities.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <span className="review-label">Capabilities</span>
                    <div className="uni-keyword-tags">
                      {lab.capabilities.map((c, i) => (
                        <span key={i} className="uni-keyword-tag uni-keyword-cap">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {lab.technologies && Array.isArray(lab.technologies) && lab.technologies.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="review-label">Technologies</span>
                    <div className="uni-keyword-tags">
                      {lab.technologies.map((t, i) => (
                        <span key={i} className="uni-keyword-tag uni-keyword-tech">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
          <div className="uni-project-grid">
            {(university.projects || []).map((proj) => (
              <div key={proj.id} className="uni-project-card">
                <div className="uni-project-header">
                  <h3>{proj.title}</h3>
                  <div className="uni-project-meta">
                    {proj.domain && <span className="uni-project-domain">{proj.domain}</span>}
                    {proj.year && <span className="uni-project-year">{proj.year}</span>}
                  </div>
                </div>
                {proj.description && <p>{proj.description.replace('[DEMO] ', '')}</p>}
                {proj.outcomes && (
                  <div className="uni-project-outcome">
                    <strong>Outcomes:</strong> {proj.outcomes.replace('[DEMO] ', '')}
                  </div>
                )}
                {proj.technologies && Array.isArray(proj.technologies) && (
                  <div className="uni-keyword-tags" style={{ marginTop: '8px' }}>
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="uni-keyword-tag uni-keyword-tech">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Innovation */}
        {activeTab === 'innovation' && (
          <div className="uni-innovation-grid">
            {(university.innovation_centres || []).map((ic) => (
              <div key={ic.id} className="uni-innovation-card">
                <h3>💡 {ic.name}</h3>
                {ic.capability && <span className="uni-innovation-cap">{ic.capability}</span>}
                {ic.description && <p>{ic.description.replace('[DEMO] ', '')}</p>}
              </div>
            ))}
            {(!university.innovation_centres || university.innovation_centres.length === 0) && (
              <p className="text-muted">No innovation centres registered.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
