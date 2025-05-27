-- Create database
CREATE DATABASE dost_monthly_consumption_monitoring;

-- Connect to the database (for psql, not needed in GUI tools)
-- \c monthly_db;

-- Create user (optional, if you want a dedicated user)
CREATE USER postgres WITH PASSWORD 'postgres';

-- Grant privileges (adjust as needed)
GRANT ALL PRIVILEGES ON DATABASE dost_monthly_consumption_monitoring TO postgres;

-- You may need to run the table creation manually or let the Node.js seed script handle it:
--
-- CREATE TABLE IF NOT EXISTS users (
--   id SERIAL PRIMARY KEY,
--   username VARCHAR(50) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'user')),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
