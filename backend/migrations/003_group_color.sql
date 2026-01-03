-- Add color column to groups and set default
ALTER TABLE group_context
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#9e9e9e';

-- Ensure existing rows have a color set (for older DBs without default backfill)
UPDATE group_context SET color = '#9e9e9e' WHERE color IS NULL OR color = '';
