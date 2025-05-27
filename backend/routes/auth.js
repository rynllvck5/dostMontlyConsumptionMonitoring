import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ROLES } from '../models.js';

const router = express.Router();

// Signup route (only for regular users)
router.post('/signup', async (req, res) => {
  const { username, password, profile_picture } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required.' });
  }
  // Prevent duplicate usernames
  const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Username already exists.' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const profilePic = profile_picture || 'default-profile.jpg';
  await pool.query(
    'INSERT INTO users (username, password, role, profile_picture) VALUES ($1, $2, $3, $4)',
    [username, hashed, ROLES.USER, profilePic]
  );
  res.status(201).json({ message: 'User registered successfully.' });
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required.' });
  }
  const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (userRes.rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const user = userRes.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' } // Increased to 8 hours for better user experience
  );
  res.json({ token, role: user.role });
});

// Middleware to check JWT and extract user info
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

// Admin/superadmin creates user or admin
router.post('/create-user', authenticateJWT, async (req, res) => {
  const { username, password, role, first_name, last_name, profile_picture } = req.body;
  if (/\s/.test(username)) {
    return res.status(400).json({ message: 'Username must not contain spaces.' });
  }
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required.' });
  }
  // Only superadmin can create admins, admin can only create users
  if (req.user.role === ROLES.ADMIN && role !== ROLES.USER) {
    return res.status(403).json({ message: 'Admins can only create users.' });
  }
  if (req.user.role !== ROLES.SUPERADMIN && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Only admins or superadmins can create users.' });
  }
  // Prevent duplicate usernames within the same role
  const existing = await pool.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, role]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: `Username "${username}" already exists for ${role} accounts. Please choose a different username.` });
  }
  const hashed = await bcrypt.hash(password, 10);
  const profilePic = profile_picture || 'default-profile.jpg';
  await pool.query(
    'INSERT INTO users (username, password, role, first_name, last_name, profile_picture) VALUES ($1, $2, $3, $4, $5, $6)',
    [username, hashed, role, first_name || '', last_name || '', profilePic]
  );
  res.status(201).json({ success: true, message: 'User created successfully.' });
});

// Check if username exists for a given role
router.get('/check-username', async (req, res) => {
  const { username, role } = req.query;
  if (!username || !role) {
    return res.status(400).json({ exists: false, error: 'Missing username or role' });
  }
  try {
    const existing = await pool.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, role]);
    res.json({ exists: existing.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ exists: false, error: 'Server error' });
  }
});

// List all users or admins
router.get('/accounts', authenticateJWT, async (req, res) => {
  const { role } = req.query;
  // Allow only admins and superadmins to fetch accounts
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (!role || (role !== 'user' && role !== 'admin')) {
    return res.status(400).json({ message: 'Role must be user or admin.' });
  }
  try {
    const results = await pool.query('SELECT id, username, role, first_name, last_name, profile_picture FROM users WHERE role = $1 ORDER BY username', [role]);
    res.json(results.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user/admin
router.put('/account/:id', authenticateJWT, async (req, res) => {
  let id = req.params.id;
  
  // Handle the "me" route - use the authenticated user's ID
  if (id === 'me') {
    id = req.user.id;
  }
  
  const { username, password, currentPassword, first_name, last_name, profile_picture } = req.body;
  if (username && /\s/.test(username)) {
    return res.status(400).json({ message: 'Username must not contain spaces.' });
  }
  if (!username && !password && !first_name && !last_name && !profile_picture) {
    return res.status(400).json({ message: 'Nothing to update.' });
  }
  try {
    // Only allow users to change their own password with current password
    if (password) {
      if (req.user.role === 'user' && (req.user.id === id || id === 'me')) {
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
    if (username) {
      // Check if the username already exists for a different account
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Username already exists. Please choose a different username.' });
      }
      await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
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
  const defaultPassword = accountRole === 'admin' ? 'admin123' : 'userpassword';
  
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
  res.json({ success: true, defaultPassword });
});

// Delete account
router.delete('/account/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    // Get account info before deleting
    const accountRes = await pool.query('SELECT username, role FROM users WHERE id = $1', [id]);
    if (accountRes.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const account = accountRes.rows[0];
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: `Account "${account.username}" has been deleted successfully.`
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error. Failed to delete account.' });
  }
});

// Profile picture upload endpoint
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('../frontend/public/images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get user profile
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, username, role, first_name, last_name, profile_picture FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user's own profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, first_name, last_name, password, currentPassword, profile_picture } = req.body;
    
    // Check if there's anything to update
    if (!username && !first_name && !last_name && !password && !profile_picture) {
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
    
    // Update username if provided
    if (username) {
      // Check if the username already exists for a different account
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Username already exists. Please choose a different username.' });
      }
      await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
    }
    
    // Update name fields if provided
    if (first_name !== undefined || last_name !== undefined) {
      await pool.query(
        'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
        [first_name || '', last_name || '', userId]
      );
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

// Validate token endpoint - accessible to all authenticated users
router.get('/validate-token', authenticateJWT, async (req, res) => {
  try {
    // If authenticateJWT middleware passes, the token is valid
    res.json({ 
      valid: true, 
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('Error validating token:', err);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// POST /api/auth/upload-profile-picture
router.post('/upload-profile-picture', authenticateJWT, upload.single('profile_picture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  let userId = req.user.id;
  // Allow admin/superadmin to specify userId to upload for another user
  if ((req.user.role === 'admin' || req.user.role === 'superadmin') && req.body.userId) {
    userId = req.body.userId;
  }
  const filename = req.file.filename;
  try {
    await pool.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [filename, userId]);
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
