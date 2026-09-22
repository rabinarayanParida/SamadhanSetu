import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const stakeholders = [
  {
    icon: '👥',
    title: 'Citizens & Communities',
    description: 'Submit verified societal challenges directly with geospatial location and multimedia evidence.',
  },
  {
    icon: '🏛️',
    title: 'Government & Administration',
    description: 'Review, moderate, and validate grassroots issues across 24 districts of Jharkhand.',
  },
  {
    icon: '🎓',
    title: 'Universities & HEIs',
    description: 'Match institutional capabilities, labs, and faculty expertise to develop evidence-based solutions.',
  },
  {
    icon: '🏭',
    title: 'Industry & Startups',
    description: 'Provide technical mentorship, CSR funding, and deployment acceleration for scalable impact.',
  },
];

const workflowSteps = [
  { step: '01', title: 'Citizen reports problem', desc: 'Verified submission with geo-coordinates, photos, videos, and impact context.' },
  { step: '02', title: 'Review & validation', desc: 'Government and administrative moderators evaluate authenticity and urgency.' },
  { step: '03', title: 'AI problem intelligence', desc: 'Multi-level classification, quality verification, and duplicate detection.' },
  { step: '04', title: 'University matching', desc: 'Transparent recommendation based on verified faculty, labs, and research match.' },
  { step: '05', title: 'Collaborative solution', desc: 'Academic teams and industry partners co-engineer field prototypes.' },
  { step: '06', title: 'Impact measurement', desc: 'District-level deployment, feedback validation, and transparent monitoring.' },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <span className="hero-tag">
          🏛️ Government of Jharkhand · Higher Education & Civic Innovation
        </span>
        <h1 className="hero-title">
          Solve Local Problems. <span className="hero-highlight">Build Real Solutions.</span>
        </h1>
        <p className="hero-description">
          A collaborative platform connecting communities, government, universities and industry to turn societal challenges into measurable solutions.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to={`/dashboard/${user.role}`} className="btn btn-hero-primary">
              Open My Portal →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-hero-primary">
                Report a Challenge
              </Link>
              <Link to="/login" className="btn btn-hero-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Real Ecosystem Metrics Summary */}
        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-value">24</span>
            <span className="stat-label">Districts Covered</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">100%</span>
            <span className="stat-label">Human-Verified Decisions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">NEP 2020</span>
            <span className="stat-label">Aligned Framework</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">Multi-HEI</span>
            <span className="stat-label">Collaborative Network</span>
          </div>
        </div>
      </section>

      {/* How It Works (Section 23 Architecture) */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          A transparent 6-stage pipeline from grassroots problem reporting to measurable civic impact.
        </p>

        <div className="steps-grid">
          {workflowSteps.map((s) => (
            <div key={s.step} className="step-card">
              <span className="step-number">{s.step}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stakeholders Section */}
      <section className="stakeholders">
        <h2 className="section-title">Participating Stakeholders</h2>
        <p className="section-subtitle">
          Aligning civic needs with state governance, research excellence, and industrial capacity.
        </p>

        <div className="stakeholder-grid">
          {stakeholders.map((s) => (
            <div key={s.title} className="stakeholder-card">
              <div className="stakeholder-icon">
                {s.icon}
              </div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} SamadhanSetu — Societal Innovation & Collaboration Portal, Jharkhand
        </p>
        <p className="footer-sub">
          Problem Statement ID: 26043 · Developed by Team The Astrixs
        </p>
      </footer>
    </div>
  );
}
