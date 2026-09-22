-- ============================================
-- Societal Innovation Collaboration Portal
-- Phase 2: Citizen Challenge Submission Schema
-- Challenge Categories (Lookup Table)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon        VARCHAR(10),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories from the problem statement domains
INSERT INTO challenge_categories (name, slug, description, icon) VALUES
  ('Education', 'education', 'Challenges related to schools, literacy, learning infrastructure, and academic access.', '📚'),
  ('Healthcare', 'healthcare', 'Issues involving hospitals, clinics, maternal health, disease prevention, and medical access.', '🏥'),
  ('Agriculture', 'agriculture', 'Problems affecting farming, irrigation, crop management, soil health, and food security.', '🌾'),
  ('Water Resources', 'water-resources', 'Challenges in water supply, purification, conservation, and watershed management.', '💧'),
  ('Sanitation', 'sanitation', 'Issues related to sewage, waste disposal, open defecation, and hygiene infrastructure.', '🚿'),
  ('Environment', 'environment', 'Concerns about pollution, deforestation, biodiversity loss, and climate resilience.', '🌳'),
  ('Energy', 'energy', 'Problems in electricity access, renewable energy adoption, and energy efficiency.', '⚡'),
  ('Urban Development', 'urban-development', 'Challenges in urban planning, housing, transportation, and city infrastructure.', '🏙️'),
  ('Rural Livelihoods', 'rural-livelihoods', 'Issues affecting rural employment, artisans, self-help groups, and skill development.', '🏘️'),
  ('Accessibility', 'accessibility', 'Barriers faced by persons with disabilities in accessing public services and infrastructure.', '♿'),
  ('Public Administration', 'public-administration', 'Inefficiencies in governance, service delivery, transparency, and citizen engagement.', '🏛️'),
  ('Other', 'other', 'Challenges that do not fit into the predefined categories.', '📋')
ON CONFLICT (slug) DO NOTHING;

-- Challenges Table

CREATE TABLE IF NOT EXISTS challenges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id        VARCHAR(20) UNIQUE NOT NULL,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    category_id         INTEGER REFERENCES challenge_categories(id),
    affected_population VARCHAR(255),
    severity            VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    existing_attempts   TEXT,
    expected_outcome    TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VALIDATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED')),
    submitted_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for challenges
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_id ON challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC);

-- Challenge Locations Table

CREATE TABLE IF NOT EXISTS challenge_locations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id  UUID UNIQUE NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    latitude      DECIMAL(10, 8),
    longitude     DECIMAL(11, 8),
    address       TEXT,
    district      VARCHAR(100),
    block         VARCHAR(100),
    village_city  VARCHAR(100),
    pincode       VARCHAR(10),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_challenge_locations_challenge ON challenge_locations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_locations_district ON challenge_locations(district);

-- Challenge Media Table

CREATE TABLE IF NOT EXISTS challenge_media (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id  UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_type     VARCHAR(20) NOT NULL CHECK (file_type IN ('photo', 'video', 'document')),
    mime_type     VARCHAR(100) NOT NULL,
    file_size     INTEGER NOT NULL,
    uploaded_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_challenge_media_challenge ON challenge_media(challenge_id);

-- Challenge Status History Table

CREATE TABLE IF NOT EXISTS challenge_status_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id  UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    from_status   VARCHAR(30),
    to_status     VARCHAR(30) NOT NULL,
    changed_by    UUID NOT NULL REFERENCES users(id),
    comment       TEXT,
    changed_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_challenge ON challenge_status_history(challenge_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON challenge_status_history(changed_at DESC);

-- Create a sequence for challenge IDs

CREATE SEQUENCE IF NOT EXISTS challenge_id_seq START WITH 1 INCREMENT BY 1;
