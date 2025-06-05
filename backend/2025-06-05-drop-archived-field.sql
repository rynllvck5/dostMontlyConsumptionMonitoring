-- Migration SQL to drop the 'archived' column from 'consumption_items' table
ALTER TABLE consumption_items DROP COLUMN IF EXISTS archived;
-- Down migration (optional):
-- ALTER TABLE consumption_items ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;
