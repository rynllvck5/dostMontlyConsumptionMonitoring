import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ROLES } from '../models.js';

const router = express.Router();

// Signup route (only for regular "pmo"s)
router.post('/signup', async (req, res) => {
  const { email, password, profile_picture, first_name, last_name, office_id } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }
  // Prevent duplicate emails
  const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Email already exists.' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const profilePic = profile_picture || 'default-profile.jpg';
  
  try {
    await pool.query(
      'INSERT INTO users (email, password, role, first_name, last_name, profile_picture, office_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [email, hashed, ROLES.PMO, first_name || '', last_name || '', profilePic, office_id || null]
    );
    res.status(201).json({ success: true, message: 'Account registered successfully.' });
  } catch (err) {
    console.error('Error creating "pmo":', err);
    res.status(500).json({ success: false, message: 'Server error. Failed to create "pmo".' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const user = userRes.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' } // Increased to 8 hours for better "pmo" experience
  );
  res.json({ token, role: user.role });
});

// Middleware to check JWT and extract "pmo" info
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided.' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Malformed token.' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  });
}

export { authenticateJWT };

// Admin/superadmin creates "pmo" or admin
router.post('/create-pmo', authenticateJWT, async (req, res) => {
  const { email, password, role, first_name, last_name, profile_picture, office_id } = req.body;
  if (/\s/.test(email)) {
    return res.status(400).json({ message: 'Email must not contain spaces.' });
  }
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }
  if (!office_id) {
    return res.status(400).json({ message: 'Office/Unit is required.' });
  }
  // Only superadmin can create admins, admin can only create "pmo"s
  if (req.user.role === ROLES.ADMIN && role !== ROLES.PMO) {
    return res.status(403).json({ message: 'Admins can only create "pmo"s.' });
  }
  if (req.user.role !== ROLES.SUPERADMIN && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Only admins or superadmins can create PMOs.' });
  }
  // Prevent duplicate emails within the same role
  const existing = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: `Email "${email}" already exists for ${role} accounts. Please choose a different email.` });
  }
  const hashed = await bcrypt.hash(password, 10);
  const profilePic = profile_picture || 'default-profile.jpg';
  
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password, role, first_name, last_name, profile_picture, office_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [email, hashed, role, first_name || '', last_name || '', profilePic, office_id]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Account created successfully.',
      id: result.rows[0].id
    });
  } catch (err) {
    console.error('Error creating "pmo":', err);
    res.status(500).json({ success: false, message: 'Server error. Failed to create "pmo".' });
  }
});

// Check if email exists for a given role
router.get('/check-email', async (req, res) => {
  const { email, role } = req.query;
  if (!email || !role) {
    return res.status(400).json({ exists: false, error: 'Missing email or role' });
  }
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
    res.json({ exists: existing.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ exists: false, error: 'Server error' });
  }
});

// List all "pmo"s or admins
router.get('/accounts', authenticateJWT, async (req, res) => {
  const { role } = req.query;
  // Allow only admins and superadmins to fetch accounts
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (!role || (role !== 'pmo' && role !== 'admin')) {
    return res.status(400).json({ message: 'Role must be pmo or admin.' });
  }
  try {
    const results = await pool.query(`
      SELECT users.id, users.email, users.role, users.first_name, users.last_name, users.profile_picture, users.office_id, offices.name AS office_name
      FROM users
      LEFT JOIN offices ON users.office_id = offices.office_id
      WHERE users.role = $1
      ORDER BY users.email
    `, [role]);
    res.json(results.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single account by ID
router.get('/accounts/:id', authenticateJWT, async (req, res) => {
  const id = req.params.id;
  // Only admins and superadmins can fetch accounts
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const result = await pool.query(`
      SELECT users.id, users.email, users.role, users.first_name, users.last_name, users.profile_picture, users.office_id, offices.name AS office_name
      FROM users
      LEFT JOIN offices ON users.office_id = offices.office_id
      WHERE users.id = $1
      LIMIT 1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update "pmo"/admin
router.put('/account/:id', authenticateJWT, async (req, res) => {
  let id = req.params.id;
  
  // Handle the "me" route - use the authenticated "pmo"'s ID
  if (id === 'me') {
    id = req.user.id;
  }
  
  const { email, password, currentPassword, first_name, last_name, profile_picture, office_id } = req.body;
  if (email && /\s/.test(email)) {
    return res.status(400).json({ message: 'Email must not contain spaces.' });
  }
  if (!email && !password && !first_name && !last_name && !profile_picture && !office_id) {
    return res.status(400).json({ message: 'Nothing to update.' });
  }
  try {
    // Only allow "pmo"s to change their own password with current password
    if (password) {
      if (req.user.role === 'pmo' && (req.user.id === id || id === 'me')) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password required.' });
        }
        const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
        const valid = await bcrypt.compare(currentPassword, userRes.rows[0].password);
        if (!valid) {
          return res.status(400).json({ message: 'Current password incorrect.' });
        }
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
    }
    // Update first_name and last_name
    if (first_name !== undefined || last_name !== undefined) {
      await pool.query('UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3', [first_name || '', last_name || '', id]);
    }
    // Update office_id if provided
    if (office_id !== undefined) {
      await pool.query('UPDATE users SET office_id = $1 WHERE id = $2', [office_id, id]);
    }
    if (email) {
      // Check if the email already exists for a different account
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Email already exists. Please choose a different email.' });
      }
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, id]);
    }
    if (profile_picture) {
      await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [profile_picture, id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password to default (admin/superadmin only)
router.post('/account/:id/reset-password', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  // First, get the account's role to determine the default password
  const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
  if (userRes.rows.length === 0) {
    return res.status(404).json({ message: 'Account not found' });
  }
  
  // Set appropriate default password based on role
  const accountRole = userRes.rows[0].role;
  const defaultPassword = accountRole === 'admin' ? 'admin123' : 'pmopassword';
  
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
  res.json({ success: true, defaultPassword });
});

// Delete account
router.delete('/account/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    // Get account info before deleting
    const accountRes = await pool.query('SELECT email, role FROM users WHERE id = $1', [id]);
    if (accountRes.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const account = accountRes.rows[0];
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: `Account "${account.email}" has been deleted successfully.`
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error. Failed to delete account.' });
  }
});

// Profile picture upload endpoint
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../frontend/public/images/uploaded-profile-pics');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all offices
router.get('/offices', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT office_id, name FROM offices ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching offices:', err);
    res.status(500).json({ message: 'Server error fetching offices.' });
  }
});

// Get "pmo" profile
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT users.id, users.email, users.role, users.first_name, users.last_name, users.profile_picture, users.office_id, offices.name AS office_name
      FROM users
      LEFT JOIN offices ON users.office_id = offices.office_id
      WHERE users.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current "pmo"'s own profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, first_name, last_name, password, currentPassword, profile_picture, office_id } = req.body;
    
    // Check if there's anything to update
    if (!email && !first_name && !last_name && !password && !profile_picture && !office_id) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    
    // If updating password, verify current password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required' });
      }
      
      // Verify current password
      const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const valid = await bcrypt.compare(currentPassword, userRes.rows[0].password);
      if (!valid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    }
    
    // Update email if provided
    if (email) {
      // Check if the email already exists for a different account
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Email already exists. Please choose a different email.' });
      }
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
    }
    
    // Update name fields if provided
    if (first_name !== undefined || last_name !== undefined) {
      await pool.query(
        'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
        [first_name || '', last_name || '', userId]
      );
    }
    
    // Update office_id if provided
    if (office_id !== undefined) {
      await pool.query('UPDATE users SET office_id = $1 WHERE id = $2', [office_id, userId]);
    }
    
    // Update profile picture if provided
    if (profile_picture) {
      await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [profile_picture, userId]);
    }
    
    res.json({ 
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset superadmin password to default
router.post('/profile/reset-password', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Only allow superadmins to use this endpoint
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin accounts can use this feature' });
    }
    
    // Default password for superadmin
    const defaultPassword = 'dostsuperadmin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    
    res.json({
      success: true,
      message: 'Password has been reset to default successfully'
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password for admin or pmo
router.post('/reset-password', authenticateJWT, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: 'Missing user id.' });
  // Only admin/superadmin can reset passwords
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized.' });
  }
  try {
    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const role = userRes.rows[0].role;
    let newPassword = '';
    if (role === 'admin') newPassword = 'admin123';
    else if (role === 'pmo') newPassword = 'pmopassword';
    else return res.status(400).json({ message: 'Only admin or pmo passwords can be reset.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate token endpoint - accessible to all authenticated "pmo"s
router.get('/validate-token', authenticateJWT, async (req, res) => {
  try {
    // If authenticateJWT middleware passes, the token is valid
    res.json({ 
      valid: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('Error validating token:', err);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// POST /api/auth/upload-profile-picture
router.post('/upload-profile-picture', authenticateJWT, (req, res, next) => {
  // Custom multer error handler to log errors
  upload.single('profile_picture')(req, res, function (err) {
    if (err) {
      console.error('[UPLOAD PROFILE PICTURE] Multer error:', err);
      return res.status(500).json({ message: 'Multer error', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('[UPLOAD PROFILE PICTURE] req.body:', req.body);
    console.log('[UPLOAD PROFILE PICTURE] req.file:', req.file);
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    // If userId is provided and the logged-in "pmo" is admin/superadmin, update that "pmo"'s profile_picture
    if (req.body.userId) {
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        const userId = req.body.userId;
        const filename = req.file.filename;
        try {
          await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [filename, userId]);
          return res.json({ success: true, filename });
        } catch (err) {
          console.error('[UPLOAD PROFILE PICTURE] DB error:', err.stack || err);
          return res.status(500).json({ message: 'Server error', error: err.message });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to upload for another "pmo".' });
      }
    } else {
      // No userId: just return the filename, do NOT update any "pmo"
      return res.json({ success: true, filename: req.file.filename });
    }
  } catch (err) {
    console.error('[UPLOAD PROFILE PICTURE] Unexpected error:', err.stack || err);
    return res.status(500).json({ message: 'Unexpected server error', error: err.message });
  }
});

// GET /api/auth/accounts?role=admin or role=pmo
router.get('/accounts', authenticateJWT, async (req, res) => {
  const { role } = req.query;
  if (!role || !['admin', 'pmo'].includes(role)) {
    return res.status(400).json({ message: 'Role query param required (admin or pmo).' });
  }
  try {
    // Query all users with the requested role, including main admin/pmo
    const usersRes = await pool.query(
      `SELECT u.id, u.email, u.role, u.office_id, o.office_name, u.first_name, u.last_name, u.profile_picture, u.created_at
       FROM users u
       LEFT JOIN offices o ON u.office_id = o.id
       WHERE u.role = $1
       ORDER BY u.created_at ASC`,
      [role]
    );
    return res.json(usersRes.rows);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    return res.status(500).json({ message: 'Server error fetching accounts.' });
  }
});

export default router;
