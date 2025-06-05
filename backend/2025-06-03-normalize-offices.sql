-- Migration: Normalize office info into an offices table and update users table

-- 1. Create the offices table with office_id as primary key
CREATE TABLE IF NOT EXISTS offices (
    office_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    office_account_no VARCHAR(100),
    building_description TEXT,
    building_account_no VARCHAR(100),
    gross_area NUMERIC,
    air_conditioned_area NUMERIC
);

-- 2. Remove office_unit from users (if exists)
ALTER TABLE users DROP COLUMN IF EXISTS office_unit;

-- 3. Add office_id to users and set up foreign key
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS office_id INTEGER REFERENCES offices(office_id);

-- Note: You may want to back up or migrate office_unit data before dropping the column if needed.
