-- Groups table for contexts/groups configuration
-- Minimal fields per requirement

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS group_context (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_group_context_name ON group_context(group_name);
