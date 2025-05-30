// User roles: superadmin, admin, user
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
};

export const CREATE_USERS_TABLE = `
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
`;
