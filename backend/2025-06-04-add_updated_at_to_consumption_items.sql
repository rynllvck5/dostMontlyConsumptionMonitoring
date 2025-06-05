-- Add updated_at column to consumption_items
ALTER TABLE consumption_items
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Set updated_at to created_at for existing rows
UPDATE consumption_items SET updated_at = created_at WHERE updated_at IS NULL;
