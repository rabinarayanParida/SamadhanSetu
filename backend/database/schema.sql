-- ============================================
-- Societal Innovation Collaboration Portal
-- Phase 1: Authentication & RBAC Schema
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'university', 'industry', 'government', 'admin')),
    organization  VARCHAR(255),
    phone         VARCHAR(20),
    district      VARCHAR(100),
    state         VARCHAR(100) DEFAULT 'Jharkhand',
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast email lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- Refresh Tokens Table
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for token lookups during refresh
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================
-- Seed: Default Admin User
-- Password: Admin@123 (bcrypt hash)
-- ============================================
-- Note: Run this only once. The hash below corresponds to 'Admin@123'
-- INSERT INTO users (full_name, email, password_hash, role, organization)
-- VALUES ('System Admin', 'admin@sicp.jharkhand.gov.in', '<bcrypt_hash>', 'admin', 'SICP Administration');
