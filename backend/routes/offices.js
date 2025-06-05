import express from 'express';
import pool from '../db.js';
import { authenticateJWT } from './auth.js';

const router = express.Router();

// GET /api/offices/:office_id - Get office details (PMO can only access their own office)
router.get('/:office_id', authenticateJWT, async (req, res) => {
  const { office_id } = req.params;
  try {
    // Only allow PMO to fetch their own office
    if (req.user.role !== 'pmo') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Check if this office is the PMO's office
    const userRes = await pool.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length || String(userRes.rows[0].office_id) !== String(office_id)) {
      return res.status(403).json({ message: 'You can only access your own office.' });
    }
    const officeRes = await pool.query(
      `SELECT office_id, name, office_account_no, building_description, gross_area, air_conditioned_area, number_of_occupants, office_address
       FROM offices WHERE office_id = $1`,
      [office_id]
    );
    if (!officeRes.rows.length) {
      return res.status(404).json({ message: 'Office not found.' });
    }
    res.json(officeRes.rows[0]);
  } catch (err) {
    console.error('Error fetching office details:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/offices/:office_id - Update office details (PMO can only update their own office)
router.put('/:office_id', authenticateJWT, async (req, res) => {
  const { office_id } = req.params;
  const { building_description, gross_area, air_conditioned_area, number_of_occupants, office_account_no, office_address } = req.body;
  try {
    if (req.user.role !== 'pmo') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Check if this office is the PMO's office
    const userRes = await pool.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length || String(userRes.rows[0].office_id) !== String(office_id)) {
      return res.status(403).json({ message: 'You can only update your own office.' });
    }
    // Validate numeric fields
    if (gross_area !== undefined && isNaN(Number(gross_area))) {
      return res.status(400).json({ message: 'Gross area must be a number.' });
    }
    if (air_conditioned_area !== undefined && isNaN(Number(air_conditioned_area))) {
      return res.status(400).json({ message: 'Air conditioned area must be a number.' });
    }
    if (number_of_occupants !== undefined && (isNaN(Number(number_of_occupants)) || Number(number_of_occupants) < 0)) {
      return res.status(400).json({ message: 'Number of occupants must be a non-negative number.' });
    }
    // Convert empty strings to null for numeric fields
    const safeGrossArea = gross_area === '' ? null : gross_area;
    const safeAirConditionedArea = air_conditioned_area === '' ? null : air_conditioned_area;
    const safeNumberOfOccupants = number_of_occupants === '' ? null : number_of_occupants;
    // Fetch current (before) office details
    const beforeRes = await pool.query(
      `SELECT building_description, gross_area, air_conditioned_area, number_of_occupants, office_account_no, office_address
       FROM offices WHERE office_id = $1`,
      [office_id]
    );
    if (!beforeRes.rows.length) {
      return res.status(404).json({ message: 'Office not found.' });
    }
    const before = beforeRes.rows[0];
    // Update office
    const result = await pool.query(
      `UPDATE offices SET 
        building_description = $1,
        gross_area = $2,
        air_conditioned_area = $3,
        number_of_occupants = $4,
        office_account_no = $5,
        office_address = $6
      WHERE office_id = $7
      RETURNING *`,
      [building_description, safeGrossArea, safeAirConditionedArea, safeNumberOfOccupants, office_account_no, office_address, office_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Office not found.' });
    }
    const after = result.rows[0];
    // Compute field-level diff
    const diff = {};
    const fields = [
      'building_description',
      'gross_area',
      'air_conditioned_area',
      'number_of_occupants',
      'office_account_no',
      'office_address'
    ];
    fields.forEach(field => {
      if (before[field] !== after[field]) {
        diff[field] = { before: before[field], after: after[field] };
      }
    });
    // Log the modification (only if something changed)
    if (Object.keys(diff).length > 0) {
      await pool.query(
        `INSERT INTO office_modification_logs (office_id, modified_by, changes) VALUES ($1, $2, $3::jsonb)`,
        [office_id, req.user.id, JSON.stringify(diff)]
      );
    }
    res.json({ success: true, office: after });
  } catch (err) {
    console.error('Error updating office:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/offices/:office_id/history - Get office modification logs (PMOs of this office only)
router.get('/:office_id/history', authenticateJWT, async (req, res) => {
  const { office_id } = req.params;
  try {
    if (req.user.role !== 'pmo') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Check if this office is the PMO's office
    const userRes = await pool.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length || String(userRes.rows[0].office_id) !== String(office_id)) {
      return res.status(403).json({ message: 'You can only view history for your own office.' });
    }
    // Fetch logs with user info
    const logsRes = await pool.query(
      `SELECT l.log_id, l.modified_at, l.changes, u.email, u.first_name, u.last_name
       FROM office_modification_logs l
       LEFT JOIN users u ON l.modified_by = u.id
       WHERE l.office_id = $1
       ORDER BY l.modified_at DESC
       LIMIT 50`,
      [office_id]
    );
    // Ensure changes is always a JS object
    const logs = logsRes.rows.map(log => ({
      ...log,
      changes: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes
    }));
    res.json(logs);
  } catch (err) {
    console.error('Error fetching office modification history:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
