-- Initial schema for Personal Interaction Tracker
-- Creates core tables and constraints based on 02_DATA_MODEL

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Person entity
CREATE TABLE IF NOT EXISTS person (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    context TEXT NULL,
    source TEXT NOT NULL CHECK (source IN ('manual', 'contacts')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interaction entity
CREATE TABLE IF NOT EXISTS interaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- InteractionPerson relation (junction table)
CREATE TABLE IF NOT EXISTS interaction_person (
    interaction_id UUID NOT NULL REFERENCES interaction(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES person(id) ON DELETE RESTRICT,
    PRIMARY KEY (interaction_id, person_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_person_name ON person(name);
CREATE INDEX IF NOT EXISTS idx_interaction_date ON interaction(date);
CREATE INDEX IF NOT EXISTS idx_interaction_person_pid ON interaction_person(person_id);
