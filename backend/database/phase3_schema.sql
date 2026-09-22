-- ============================================
-- Societal Innovation Collaboration Portal
-- Phase 3: Admin & Government Challenge Review Schema
-- ============================================

-- 1. Update status check constraint on challenges to include Phase 3 states
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_status_check
  CHECK (status IN (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'VALIDATED',
    'REJECTED',
    'NEEDS_INFORMATION',
    'POTENTIAL_DUPLICATE',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
  ));

-- 2. Add potential duplicate reference column to challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES challenges(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_duplicate_of ON challenges(duplicate_of_id);

-- 3. Review Notes Table (Internal to reviewers — never exposed to citizens)
CREATE TABLE IF NOT EXISTS challenge_review_notes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id  UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note          TEXT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_notes_challenge ON challenge_review_notes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_review_notes_created ON challenge_review_notes(created_at DESC);

-- 4. Administrative Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action        VARCHAR(100) NOT NULL,
    challenge_id  UUID REFERENCES challenges(id) ON DELETE SET NULL,
    metadata      JSONB,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_challenge ON audit_logs(challenge_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
