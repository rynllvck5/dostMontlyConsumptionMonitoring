import express from 'express';
import multer from 'multer';
import pool from '../db.js';
import { authenticateJWT } from './auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB/file

router.post('/', authenticateJWT, upload.array('attachments'), async (req, res) => {
  const { month, baseline, consumption_kwh, forceUpdate } = req.body;
  const userId = req.user.id;
  const year = new Date().getFullYear();

  if (req.user.role !== 'user') {
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
        'UPDATE electricity_consumption SET baseline = $1, consumption_kwh = $2 WHERE id = $3',
        [baseline, consumption_kwh, consumptionId]
      );
      await pool.query('DELETE FROM electricity_files WHERE consumption_id = $1', [consumptionId]);
    } else if (rows.length === 0) {
      // Insert new record
      const insertResult = await pool.query(
        'INSERT INTO electricity_consumption (month, year, baseline, consumption_kwh, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [month, year, baseline, consumption_kwh, userId]
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
