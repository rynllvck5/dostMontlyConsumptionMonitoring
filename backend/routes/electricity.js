import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import pool from '../db.js';
import { authenticateJWT } from './auth.js';

const router = express.Router();
// Set upload directory to frontend/public/images/electricity-consumption-uploaded-files
const uploadDir = path.resolve(__dirname, '../../frontend/public/images/electricity-consumption-uploaded-files');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB/file

// GET /api/electricity - All office records for a year (for graphs/report)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = req.query.year || new Date().getFullYear();

    // 1. Get user's office_id
    const userResult = await pool.query('SELECT office_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const officeId = userResult.rows[0].office_id;

    // 2. Get all user ids in that office
    const usersResult = await pool.query('SELECT id FROM users WHERE office_id = $1', [officeId]);
    const userIds = usersResult.rows.map(row => row.id);
    if (userIds.length === 0) return res.json([]);

    // 3. Get all consumption records for those users in the specified year
    const result = await pool.query(
      'SELECT * FROM electricity_consumption WHERE user_id = ANY($1) AND year = $2',
      [userIds, year]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch electricity consumption data.' });
  }
});

// GET /api/electricity/office-consumption
router.get('/office-consumption', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    // 1. Get current user's office_id
    const userResult = await pool.query('SELECT office_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const officeId = userResult.rows[0].office_id;
    // 2. Find all user ids in that office_id
    const usersResult = await pool.query('SELECT id FROM users WHERE office_id = $1', [officeId]);
    const userIds = usersResult.rows.map(row => row.id);
    if (userIds.length === 0) return res.json([]);
    // 3. Aggregate monthly consumption for current year for those users
    const year = new Date().getFullYear();
    const months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    // Fetch office-wide fields from offices table
    const officeDetailsRes = await pool.query(
      `SELECT building_description, gross_area, air_conditioned_area, number_of_occupants, office_account_no, office_address
       FROM offices WHERE office_id = $1`, [officeId]
    );
    const officeDetails = officeDetailsRes.rows[0] || {};

    // Fetch the year from electricity_consumption (just one value)
    let selectedYear = year;
    const yearResult = await pool.query(
      `SELECT year FROM electricity_consumption WHERE user_id = ANY($1) AND year = $2 LIMIT 1`, [userIds, year]
    );
    if (yearResult.rows.length > 0) {
      selectedYear = yearResult.rows[0].year;
    }

    const data = [];
    for (const month of months) {
      const result = await pool.query(
        `SELECT COUNT(*) as count, SUM(baseline) as total_peso, SUM(consumption_kwh) as total_consumption_kwh FROM electricity_consumption WHERE month = $1 AND year = $2 AND user_id = ANY($3) AND baseline > 0`,
        [month, year, userIds]
      );
      const sum = result.rows[0].total_peso;
      const consumption_kwh = result.rows[0].total_consumption_kwh;
      const count = Number(result.rows[0].count);
      if (count > 0 && sum !== null && sum !== 0) {
        data.push({
          month,
          peso: Number(sum),
          consumption_kwh: consumption_kwh !== null ? Number(consumption_kwh) : 0,
          ...officeDetails // add office fields to each month's object
        });
      }
    }
    res.json({
      year: selectedYear,
      data
    });
  } catch (err) {
    console.error('Error fetching office consumption:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/', authenticateJWT, upload.array('attachments'), async (req, res) => {
  console.log('Decoded user from JWT:', req.user);
  console.log('Uploaded files:', req.files);
  if (req.files && req.files.length > 0) {
    req.files.forEach(f => {
      console.log('Saved file:', f.filename, 'Original name:', f.originalname, 'Destination:', f.destination, 'Full path:', f.path);
    });
  }
  const {
    month,
    baseline,
    consumption_kwh,
    forceUpdate,
    building_description,
    gross_area,
    air_conditioned_area,
    number_of_occupants,
    office_account_no,
    office_address
  } = req.body;
  const userId = req.user.id;
  const year = new Date().getFullYear();

  if (req.user.role !== 'pmo') {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  const validMonths = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  if (!month || !validMonths.includes(month)) {
    return res.status(400).json({ success: false, message: 'Invalid month.' });
  }
  if (!baseline || isNaN(baseline) || Number(baseline) < 0) {
    return res.status(400).json({ success: false, message: 'Baseline must be a positive number.' });
  }
  if (!consumption_kwh || isNaN(consumption_kwh) || Number(consumption_kwh) < 0) {
    return res.status(400).json({ success: false, message: 'Consumption must be a positive number.' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Please attach at least one file.' });
  }

  try {
    // Check if record exists for this month/year/user
    const { rows } = await pool.query(
      'SELECT id FROM electricity_consumption WHERE month = $1 AND year = $2 AND user_id = $3',
      [month, year, userId]
    );

    let consumptionId;
    if (rows.length > 0 && !forceUpdate) {
      return res.status(409).json({ exists: true, message: 'Data for this month/year already exists.' });
    }

    if (rows.length > 0 && forceUpdate) {
      // Update existing record
      consumptionId = rows[0].id;
      await pool.query(
        `UPDATE electricity_consumption SET
          baseline = $1,
          consumption_kwh = $2,
          building_description = $3,
          gross_area = $4,
          air_conditioned_area = $5,
          number_of_occupants = $6,
          office_account_no = $7,
          office_address = $8
        WHERE id = $9`,
        [
          baseline,
          consumption_kwh,
          building_description,
          gross_area,
          air_conditioned_area,
          number_of_occupants,
          office_account_no,
          office_address,
          consumptionId
        ]
      );
      await pool.query('DELETE FROM electricity_files WHERE consumption_id = $1', [consumptionId]);
    } else if (rows.length === 0) {
      // Insert new record
      const insertResult = await pool.query(
        `INSERT INTO electricity_consumption (
          month, year, baseline, consumption_kwh, user_id,
          building_description, gross_area, air_conditioned_area, number_of_occupants, office_account_no, office_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          month,
          year,
          baseline,
          consumption_kwh,
          userId,
          building_description,
          gross_area,
          air_conditioned_area,
          number_of_occupants,
          office_account_no,
          office_address
        ]
      );
      consumptionId = insertResult.rows[0].id;
    }

    // Save files metadata
    for (const file of req.files) {
      await pool.query(
        'INSERT INTO electricity_files (consumption_id, file_name, file_type, file_path) VALUES ($1, $2, $3, $4)',
        [consumptionId, file.originalname, file.mimetype, file.path]
      );
    }

    res.json({ success: true, message: forceUpdate ? 'Updated successfully!' : 'Saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
