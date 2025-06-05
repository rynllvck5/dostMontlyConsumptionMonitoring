import pool from './db.js';
import bcrypt from 'bcrypt';
import { CREATE_USERS_TABLE, ROLES } from './models.js';

async function seed() {
  await pool.query(CREATE_USERS_TABLE);

  // Delete all existing users
  await pool.query('DELETE FROM users');

  // Insert superadmin
  const superadminPassword = await bcrypt.hash('dostsuperadmin123', 10);
  // Lookup office_id for "Regional Office" for admin
  const officeResult = await pool.query('SELECT id FROM offices WHERE name = $1', ['Regional Office']);
  const regionalOfficeId = officeResult.rows.length > 0 ? officeResult.rows[0].id : null;

  await pool.query(
    'INSERT INTO users (email, password, role, first_name, last_name, office_id) VALUES ($1, $2, $3, $4, $5, $6)',
    ['superadmin@region1.dost.gov.ph', superadminPassword, ROLES.SUPERADMIN, 'DOST', null, null]
  );
  console.log('Superadmin created.');

  // Insert admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await pool.query(
    'INSERT INTO users (email, password, role, first_name, last_name, office_id) VALUES ($1, $2, $3, $4, $5, $6)',
    ['admin@region1.dost.gov.ph', adminPassword, ROLES.ADMIN, 'admin', null, regionalOfficeId]
  );
  console.log('Admin created.');

  await pool.end();
  console.log('Seeding complete.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
