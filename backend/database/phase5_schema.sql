-- ============================================
-- Societal Innovation Collaboration Portal
-- Phase 5: AI-Powered University Matching
--          & Institutional Assignment Schema
-- ============================================

-- ============================================
-- 1. Universities (Master Directory)
-- ============================================
CREATE TABLE IF NOT EXISTS universities (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(255) NOT NULL,
    code             VARCHAR(50) UNIQUE NOT NULL,
    type             VARCHAR(50) NOT NULL DEFAULT 'State University'
                     CHECK (type IN ('Central University', 'State University', 'Deemed University', 'IIT', 'NIT', 'IIIT', 'Private University', 'Autonomous Institute', 'Medical Institute', 'Agricultural University')),
    location         VARCHAR(255),
    district         VARCHAR(100),
    state            VARCHAR(100) DEFAULT 'Jharkhand',
    website          VARCHAR(500),
    description      TEXT,
    established_year INTEGER,
    capacity_status  VARCHAR(30) DEFAULT 'UNKNOWN'
                     CHECK (capacity_status IN ('AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'UNKNOWN')),
    max_concurrent_projects INTEGER DEFAULT 10,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_universities_code ON universities(code);
CREATE INDEX IF NOT EXISTS idx_universities_district ON universities(district);
CREATE INDEX IF NOT EXISTS idx_universities_active ON universities(is_active);

-- ============================================
-- 2. Departments
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id    UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    code             VARCHAR(50),
    description      TEXT,
    capacity_status  VARCHAR(30) DEFAULT 'UNKNOWN'
                     CHECK (capacity_status IN ('AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'UNKNOWN')),
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_university ON departments(university_id);

-- ============================================
-- 3. Faculty
-- ============================================
CREATE TABLE IF NOT EXISTS faculty (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id    UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
    name             VARCHAR(255) NOT NULL,
    designation      VARCHAR(100),
    specialization   VARCHAR(255),
    profile_summary  TEXT,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_university ON faculty(university_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department_id);

-- ============================================
-- 4. Faculty Expertise
-- ============================================
CREATE TABLE IF NOT EXISTS faculty_expertise (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id        UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    expertise_area    VARCHAR(255) NOT NULL,
    keywords          JSONB DEFAULT '[]'::jsonb,
    research_interests JSONB DEFAULT '[]'::jsonb,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_expertise_faculty ON faculty_expertise(faculty_id);

-- ============================================
-- 5. Research Areas (Lookup Table)
-- ============================================
CREATE TABLE IF NOT EXISTS research_areas (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL UNIQUE,
    description      TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. University Research Areas (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS university_research_areas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id    UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    research_area_id INTEGER NOT NULL REFERENCES research_areas(id) ON DELETE CASCADE,
    strength_level   VARCHAR(20) DEFAULT 'MODERATE'
                     CHECK (strength_level IN ('EMERGING', 'MODERATE', 'STRONG', 'LEADING')),
    UNIQUE(university_id, research_area_id)
);

CREATE INDEX IF NOT EXISTS idx_uni_research_university ON university_research_areas(university_id);

-- ============================================
-- 7. University Labs / Facilities
-- ============================================
CREATE TABLE IF NOT EXISTS university_labs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id    UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    capabilities     JSONB DEFAULT '[]'::jsonb,
    technologies     JSONB DEFAULT '[]'::jsonb,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_labs_university ON university_labs(university_id);

-- ============================================
-- 8. University Innovation / Incubation Centres
-- ============================================
CREATE TABLE IF NOT EXISTS university_innovation_centres (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id    UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    capability       VARCHAR(255),
    description      TEXT,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_innovation_university ON university_innovation_centres(university_id);

-- ============================================
-- 9. University Previous Projects
-- ============================================
CREATE TABLE IF NOT EXISTS university_projects (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id     UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
    title             VARCHAR(500) NOT NULL,
    description       TEXT,
    domain            VARCHAR(255),
    technologies      JSONB DEFAULT '[]'::jsonb,
    challenge_category VARCHAR(100),
    year              INTEGER,
    outcomes          TEXT,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_university ON university_projects(university_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON university_projects(domain);

-- ============================================
-- 10. University Capability Embeddings (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS university_capability_embeddings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id     UUID UNIQUE NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    embedding         JSONB NOT NULL,
    embedding_text_hash VARCHAR(64) NOT NULL,
    embedding_model   VARCHAR(100) NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cap_emb_university ON university_capability_embeddings(university_id);

-- ============================================
-- 11. Challenge Matches (AI Recommendations)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_matches (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id      UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    university_id     UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
    match_score       NUMERIC(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    rank              INTEGER NOT NULL,
    match_status      VARCHAR(30) NOT NULL DEFAULT 'RECOMMENDED'
                      CHECK (match_status IN ('RECOMMENDED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'EXPIRED')),
    explanation       TEXT,
    matching_version  VARCHAR(50) DEFAULT 'v1.0',
    model_version     VARCHAR(100),
    generated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, university_id, matching_version)
);

CREATE INDEX IF NOT EXISTS idx_matches_challenge ON challenge_matches(challenge_id);
CREATE INDEX IF NOT EXISTS idx_matches_university ON challenge_matches(university_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON challenge_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_matches_score ON challenge_matches(match_score DESC);

-- ============================================
-- 12. Challenge Match Factors (Explainability)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_match_factors (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id          UUID NOT NULL REFERENCES challenge_matches(id) ON DELETE CASCADE,
    factor_name       VARCHAR(100) NOT NULL,
    factor_score      NUMERIC(4,3) NOT NULL CHECK (factor_score >= 0 AND factor_score <= 1),
    weight            NUMERIC(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    weighted_score    NUMERIC(5,3) NOT NULL,
    evidence          TEXT,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_match_factors_match ON challenge_match_factors(match_id);

-- ============================================
-- 13. Challenge Match Faculty (Recommendations)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_match_faculty (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id          UUID NOT NULL REFERENCES challenge_matches(id) ON DELETE CASCADE,
    faculty_id        UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    relevance_score   NUMERIC(4,3) DEFAULT 0,
    relevance_reason  TEXT,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, faculty_id)
);

CREATE INDEX IF NOT EXISTS idx_match_faculty_match ON challenge_match_faculty(match_id);

-- ============================================
-- 14. Challenge Assignments (Human Decisions)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_assignments (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id             UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    university_id            UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    department_id            UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_by              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_status        VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                             CHECK (assignment_status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'SUPERSEDED')),
    assignment_reason        TEXT,
    ai_recommended_university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    ai_match_score           NUMERIC(5,2),
    assigned_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at             TIMESTAMP WITH TIME ZONE,
    response_reason          TEXT,
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_challenge ON challenge_assignments(challenge_id);
CREATE INDEX IF NOT EXISTS idx_assignments_university ON challenge_assignments(university_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON challenge_assignments(assignment_status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON challenge_assignments(assigned_by);

-- ============================================
-- 15. Link university users to universities
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_id);
