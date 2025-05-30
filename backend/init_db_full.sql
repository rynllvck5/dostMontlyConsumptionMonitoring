-- Create database (if not exists, ignore error if already exists)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dost_monthly_consumption_monitoring') THEN
      CREATE DATABASE dost_monthly_consumption_monitoring;
   END IF;
END$$;

-- Connect to the database (for psql, not needed in GUI tools)
-- \c dost_monthly_consumption_monitoring;

-- Create user (optional, if you want a dedicated user)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
      CREATE USER postgres WITH PASSWORD 'postgres';
   END IF;
END$$;

-- Grant privileges (adjust as needed)
GRANT ALL PRIVILEGES ON DATABASE dost_monthly_consumption_monitoring TO postgres;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'user')),
    office_unit VARCHAR(100) DEFAULT '',
    first_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    profile_picture VARCHAR(255) NOT NULL DEFAULT 'default-profile.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optionally, seed initial users (uncomment and adjust passwords as needed)
-- INSERT INTO users (username, password, role, first_name, last_name, profile_picture)
-- VALUES
--   ('superadmin', '<hashed_password>', 'superadmin', '', '', 'default-profile.jpg'),
--   ('admin', '<hashed_password>', 'admin', '', '', 'default-profile.jpg');

-- Note: For security, use your backend seed script to insert hashed passwords.
