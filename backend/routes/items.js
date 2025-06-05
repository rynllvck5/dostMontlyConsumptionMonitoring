import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../db.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to frontend/public/images/item-uploads
    const itemName = (req.body.item_name || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadDir = path.join(__dirname, '../../frontend/public/images/item-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use item name and unique suffix for filename
    const itemName = (req.body.item_name || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${itemName}.${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|jfif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get all items (exclude archived by default, only from same office)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { search, sortBy, sortOrder, item_model, showArchived } = req.query;
    // Get the logged-in user's office_id
    const userRes = await pool.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) return res.status(403).json({ error: 'Forbidden: user not found' });
    const officeId = userRes.rows[0].office_id;

    let query = `
      SELECT 
        i.*,
        (i.kilowatts * i.quantity) as total_kw,
        COALESCE(
          NULLIF(array_agg(im.filename) FILTER (WHERE im.filename IS NOT NULL), '{}'),
          NULL
        ) as images
      FROM consumption_items i 
      LEFT JOIN item_images im ON i.id = im.item_id
      JOIN users u ON i.user_id = u.id
    `;
    
    const conditions = ['u.office_id = $1'];
    const params = [officeId];
    let paramCount = 2;

    // Exclude items with quantity = 0 unless explicitly showing archived
    if (!showArchived || showArchived === 'false') {
      conditions.push(`i.quantity > 0`);
    }

    // Fix: Use OR if both search and item_model are provided
    if (search && item_model) {
      conditions.push(`(i.item_name ILIKE $${paramCount} OR i.item_model ILIKE $${paramCount + 1})`);
      params.push(`%${search}%`, `%${item_model}%`);
      paramCount += 2;
    } else if (search) {
      conditions.push(`i.item_name ILIKE $${paramCount}`);
      params.push(`%${search}%`);
      paramCount++;
    } else if (item_model) {
      conditions.push(`i.item_model ILIKE $${paramCount}`);
      params.push(`%${item_model}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' GROUP BY i.id';

    // Add sorting
    if (sortBy) {
      const validSortColumns = ['kilowatts', 'total_kw', 'created_at'];
      const validSortOrders = ['asc', 'desc'];
      
      if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder?.toLowerCase())) {
        query += ` ORDER BY ${sortBy === 'total_kw' ? '(i.kilowatts * i.quantity)' : `i.${sortBy}`} ${sortOrder.toLowerCase()}`;
      } else {
        query += ' ORDER BY i.created_at DESC'; // Default sorting
      }
    } else {
      query += ' ORDER BY i.created_at DESC'; // Default sorting
    }
    
    const result = await pool.query(query, params);
    res.json({ items: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Create new item with images
router.post('/', authenticateJWT, upload.array('images', 10), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { item_name, kilowatts, quantity, item_model } = req.body;
    
    if (!item_name || !kilowatts || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert item
    const { rows: [item] } = await client.query(
      'INSERT INTO consumption_items (item_name, kilowatts, quantity, item_model, user_id, updated_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [item_name, kilowatts, quantity, item_model || null, req.user.id]
    );

    // Insert images if any
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => 
        `(${item.id}, '${file.filename}')`
      ).join(',');
      
      await client.query(`
        INSERT INTO item_images (item_id, filename)
        VALUES ${imageValues}
      `);
    }

    await client.query('COMMIT');
    
    // Fetch the item with images
    const { rows: [newItem] } = await client.query(`
      SELECT 
        i.*,
        COALESCE(
          NULLIF(array_agg(im.filename) FILTER (WHERE im.filename IS NOT NULL), '{}'),
          NULL
        ) as images
      FROM consumption_items i 
      LEFT JOIN item_images im ON i.id = im.item_id 
      WHERE i.id = $1 
      GROUP BY i.id
    `, [item.id]);
    
    res.status(201).json(newItem);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  } finally {
    client.release();
  }
});

// Update item with images
router.put('/:id', authenticateJWT, upload.array('images', 10), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { item_name, kilowatts, quantity, item_model } = req.body;
    
    if (!item_name || !kilowatts || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update item
    // Check if the item belongs to the same office as the logged-in user
    const userRes = await client.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) throw new Error('User not found');
    const officeId = userRes.rows[0].office_id;
    const itemRes = await client.query(
      `SELECT i.id FROM consumption_items i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND u.office_id = $2`,
      [req.params.id, officeId]
    );
    if (!itemRes.rows.length) {
      throw new Error('Item not found or unauthorized');
    }
    // Proceed with update
    const { rows: [item] } = await client.query(
      'UPDATE consumption_items SET item_name = $1, kilowatts = $2, quantity = $3, item_model = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [item_name, kilowatts, quantity, item_model || null, req.params.id]
    );

    if (!item) {
      throw new Error('Item not found or unauthorized');
    }

    // Handle deleted images first
    if (req.body.deleted_images) {
      const deletedImages = JSON.parse(req.body.deleted_images);
      // Delete the files
      for (const filename of deletedImages) {
        const filePath = path.join(__dirname, '../../frontend/public/images/item-uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // Remove from database
      await client.query(
        'DELETE FROM item_images WHERE item_id = $1 AND filename = ANY($2)',
        [item.id, deletedImages]
      );
    }

    // Handle existing images
    if (req.body.existing_images) {
      const existingImages = JSON.parse(req.body.existing_images);
      // Delete images not in the existing_images array and not in deleted_images
      const deletedImages = req.body.deleted_images ? JSON.parse(req.body.deleted_images) : [];
      const imagesToKeep = existingImages.filter(img => !deletedImages.includes(img));
      
      // Delete files for images not in imagesToKeep
      const { rows: currentImages } = await client.query(
        'SELECT filename FROM item_images WHERE item_id = $1 AND filename != ALL($2)',
        [item.id, imagesToKeep]
      );
      
      for (const img of currentImages) {
        const filePath = path.join(__dirname, '../../frontend/public/images/item-uploads', img.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Update database
      await client.query(
        'DELETE FROM item_images WHERE item_id = $1 AND filename != ALL($2)',
        [item.id, imagesToKeep]
      );
    } else {
      // If no existing_images specified, remove all images
      const { rows: currentImages } = await client.query(
        'SELECT filename FROM item_images WHERE item_id = $1',
        [item.id]
      );
      
      for (const img of currentImages) {
        const filePath = path.join(__dirname, '../../frontend/public/images/item-uploads', img.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      await client.query('DELETE FROM item_images WHERE item_id = $1', [item.id]);
    }

    // Add new images if any
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => 
        `(${item.id}, '${file.filename}')`
      ).join(',');
      
      await client.query(`
        INSERT INTO item_images (item_id, filename)
        VALUES ${imageValues}
      `);
    }

    await client.query('COMMIT');
    
    // Fetch the updated item with images
    const { rows: [updatedItem] } = await client.query(`
      SELECT 
        i.*,
        COALESCE(
          NULLIF(array_agg(im.filename) FILTER (WHERE im.filename IS NOT NULL), '{}'),
          NULL
        ) as images
      FROM consumption_items i 
      LEFT JOIN item_images im ON i.id = im.item_id 
      WHERE i.id = $1 
      GROUP BY i.id
    `, [item.id]);
    
    res.json(updatedItem);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  } finally {
    client.release();
  }
});

// Archive item (replace delete)
router.patch('/:id/archive', authenticateJWT, async (req, res) => {
  console.log('[ARCHIVE ROUTE HIT]', 'id:', req.params.id, 'user:', req.user?.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Get the logged-in user's office_id
    const userRes = await client.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: user not found' });
    }
    const officeId = userRes.rows[0].office_id;
    // Check if the item belongs to the same office
    const itemRes = await client.query(
      `SELECT i.id FROM consumption_items i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND u.office_id = $2`,
      [req.params.id, officeId]
    );
    if (!itemRes.rows.length) {
      await client.query('ROLLBACK');
      console.log('[ARCHIVE ERROR] Item not found or not authorized (office mismatch)');
      return res.status(404).json({ error: 'Item not found or not authorized' });
    }
        // Get quantity to archive from request
    const quantityToArchive = parseInt(req.body.quantity, 10);
    const itemInfoRes = await client.query('SELECT quantity, archived_quantity FROM consumption_items WHERE id = $1', [req.params.id]);
    if (!itemInfoRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }
    const { quantity, archived_quantity } = itemInfoRes.rows[0];
    if (!quantityToArchive || quantityToArchive < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid archive quantity' });
    }
    if (quantityToArchive > quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot archive more than available quantity' });
    }
    // Update the item: subtract from quantity, add to archived_quantity
    const newQuantity = quantity - quantityToArchive;
    const newArchivedQuantity = (archived_quantity || 0) + quantityToArchive;
    const { rowCount } = await client.query(
      'UPDATE consumption_items SET quantity = $1, archived_quantity = $2 WHERE id = $3',
      [newQuantity, newArchivedQuantity, req.params.id]
    );
    console.log('[ARCHIVE QUERY] rowCount:', rowCount, 'newQuantity:', newQuantity, 'archivedQuantity:', newArchivedQuantity);
    await client.query('COMMIT');
    res.json({ message: 'Item archived successfully', newQuantity, archivedQuantity: newArchivedQuantity });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ARCHIVE CATCH]', err);
    res.status(500).json({ error: 'Failed to archive item' });
  } finally {
    client.release();
  }
});

// Restore archived quantity to active quantity
router.patch('/:id/restore', authenticateJWT, async (req, res) => {
  console.log('[RESTORE ROUTE HIT]', 'id:', req.params.id, 'user:', req.user?.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Get the logged-in user's office_id
    const userRes = await client.query('SELECT office_id FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: user not found' });
    }
    const officeId = userRes.rows[0].office_id;
    // Check if the item belongs to the same office
    const itemRes = await client.query(
      `SELECT i.id FROM consumption_items i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND u.office_id = $2`,
      [req.params.id, officeId]
    );
    if (!itemRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found or not authorized' });
    }
    // Get current archived_quantity and quantity
    const itemInfoRes = await client.query('SELECT quantity, archived_quantity FROM consumption_items WHERE id = $1', [req.params.id]);
    if (!itemInfoRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }
    const { quantity, archived_quantity } = itemInfoRes.rows[0];
    const quantityToRestore = parseInt(req.body.quantity, 10);
    if (!quantityToRestore || quantityToRestore < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid restore quantity' });
    }
    if (quantityToRestore > archived_quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot restore more than archived quantity' });
    }
    // Update the item: subtract from archived_quantity, add to quantity
    const newQuantity = quantity + quantityToRestore;
    const newArchivedQuantity = archived_quantity - quantityToRestore;
    const { rowCount } = await client.query(
      'UPDATE consumption_items SET quantity = $1, archived_quantity = $2 WHERE id = $3',
      [newQuantity, newArchivedQuantity, req.params.id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Item restored successfully', newQuantity, archivedQuantity: newArchivedQuantity });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[RESTORE CATCH]', err);
    res.status(500).json({ error: 'Failed to restore item' });
  } finally {
    client.release();
  }
});

export default router;