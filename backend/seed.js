import pool from './db.js';
import bcrypt from 'bcrypt';
import { CREATE_USERS_TABLE, ROLES } from './models.js';

async function seed() {
  await pool.query(CREATE_USERS_TABLE);

  // Check if superadmin exists
  const superadminRes = await pool.query(
    'SELECT * FROM users WHERE role = $1',
    [ROLES.SUPERADMIN]
  );
  if (superadminRes.rows.length === 0) {
    const hashed = await bcrypt.hash('dostsuperadmin123', 10);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['superadmin', hashed, ROLES.SUPERADMIN]
    );
    console.log('Superadmin created.');
  }

  // Check if admin exists
  const adminRes = await pool.query(
    'SELECT * FROM users WHERE role = $1',
    [ROLES.ADMIN]
  );
  if (adminRes.rows.length === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['admin', hashed, ROLES.ADMIN]
    );
    console.log('Admin created.');
  }

  await pool.end();
  console.log('Seeding complete.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
