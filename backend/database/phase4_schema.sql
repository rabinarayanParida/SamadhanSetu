-- ============================================
-- Societal Innovation Collaboration Portal
-- Phase 4: AI Problem Intelligence Engine Schema
-- ============================================

-- ============================================
-- 1. AI Analysis Results Table
-- Stores structured multi-factor AI results
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_ai_results (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id              UUID UNIQUE NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    processing_status         VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                              CHECK (processing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    -- AI Classification
    ai_category               VARCHAR(100),
    ai_subcategory            VARCHAR(100),
    classification_confidence NUMERIC(4, 3),

    -- AI Quality Assessment
    is_valid                  BOOLEAN,
    validation_confidence     NUMERIC(4, 3),
    quality_score             INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    missing_information       JSONB DEFAULT '[]'::jsonb,
    validation_warnings       JSONB DEFAULT '[]'::jsonb,

    -- AI Multi-Factor Prioritization
    priority_score            INTEGER CHECK (priority_score >= 0 AND priority_score <= 100),
    priority_level            VARCHAR(20) CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    priority_factors          JSONB DEFAULT '{}'::jsonb,
    priority_confidence       NUMERIC(4, 3),
    priority_explanation      TEXT,

    -- AI Domain Routing Recommendation
    routing_domain            VARCHAR(150),
    routing_confidence        NUMERIC(4, 3),
    routing_explanation       TEXT,

    -- Pipeline & Model Version Tracking
    model_name                VARCHAR(100),
    prompt_version            VARCHAR(50),
    pipeline_version          VARCHAR(50),

    -- Error / Retry Tracking
    error_message             TEXT,
    retry_count               INTEGER DEFAULT 0,

    -- Timestamps
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at              TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ai_results_challenge ON challenge_ai_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_status ON challenge_ai_results(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_results_priority ON challenge_ai_results(priority_level);
CREATE INDEX IF NOT EXISTS idx_ai_results_category ON challenge_ai_results(ai_category);

-- ============================================
-- 2. Semantic Duplicate Candidates Table
-- Stores duplicate candidate relationships & review decisions
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_ai_duplicates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id            UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    candidate_id            UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    similarity_score        NUMERIC(5, 4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    review_status           VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                            CHECK (review_status IN ('PENDING', 'CONFIRMED_DUPLICATE', 'NOT_DUPLICATE')),
    reviewed_by             UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at             TIMESTAMP WITH TIME ZONE,
    review_comment          TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_challenge_candidate UNIQUE(challenge_id, candidate_id),
    CONSTRAINT chk_not_self_duplicate CHECK(challenge_id != candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_duplicates_challenge ON challenge_ai_duplicates(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ai_duplicates_candidate ON challenge_ai_duplicates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_duplicates_status ON challenge_ai_duplicates(review_status);
CREATE INDEX IF NOT EXISTS idx_ai_duplicates_score ON challenge_ai_duplicates(similarity_score DESC);

-- ============================================
-- 3. Challenge Vector Embeddings Table
-- Stores text embeddings for semantic similarity search
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_embeddings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id            UUID UNIQUE NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    embedding               JSONB NOT NULL,
    embedding_model         VARCHAR(100) NOT NULL,
    embedding_text_hash     VARCHAR(64) NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embeddings_challenge ON challenge_embeddings(challenge_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_hash ON challenge_embeddings(embedding_text_hash);

-- ============================================
-- 4. Human Reviewer AI Overrides Table
-- Audits reviewer overrides while preserving original AI recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_ai_overrides (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id            UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    reviewer_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name              VARCHAR(50) NOT NULL
                            CHECK (field_name IN ('category', 'subcategory', 'priority_level', 'priority_score', 'routing_domain', 'validation')),
    ai_value                TEXT,
    human_value             TEXT NOT NULL,
    reason                  TEXT NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_overrides_challenge ON challenge_ai_overrides(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ai_overrides_reviewer ON challenge_ai_overrides(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ai_overrides_created ON challenge_ai_overrides(created_at DESC);
