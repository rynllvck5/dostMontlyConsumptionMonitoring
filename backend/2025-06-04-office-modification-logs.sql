-- Migration: Create office_modification_logs table
CREATE TABLE IF NOT EXISTS office_modification_logs (
  log_id SERIAL PRIMARY KEY,
  office_id INTEGER REFERENCES offices(office_id) ON DELETE CASCADE,
  modified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB NOT NULL
);

-- Index for quick lookup by office
CREATE INDEX IF NOT EXISTS idx_office_modification_logs_office_id ON office_modification_logs(office_id);
