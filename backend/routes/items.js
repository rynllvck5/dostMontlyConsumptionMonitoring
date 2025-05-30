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

// Get all items
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { search, sortBy, sortOrder, period } = req.query;
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
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`i.item_name ILIKE $${paramCount}`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (period) {
      conditions.push(`i.period = $${paramCount}`);
      params.push(period);
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
    
    const { item_name, kilowatts, quantity, period } = req.body;
    
    if (!item_name || !kilowatts || !quantity || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert item
    const { rows: [item] } = await client.query(
      'INSERT INTO consumption_items (item_name, kilowatts, quantity, period, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [item_name, kilowatts, quantity, period, req.user.id]
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
    
    const { item_name, kilowatts, quantity, period } = req.body;
    
    if (!item_name || !kilowatts || !quantity || !period) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update item
    const { rows: [item] } = await client.query(
      'UPDATE consumption_items SET item_name = $1, kilowatts = $2, quantity = $3, period = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [item_name, kilowatts, quantity, period, req.params.id, req.user.id]
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

// Delete item
router.delete('/:id', authenticateJWT, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get images to delete
    const { rows: images } = await client.query(
      'SELECT filename FROM item_images WHERE item_id = $1',
      [req.params.id]
    );
    
    // Delete image files
    images.forEach(image => {
      const filePath = path.join(__dirname, '../../frontend/public/images/item-uploads', image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    // Delete from database
    await client.query('DELETE FROM consumption_items WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  } finally {
    client.release();
  }
});

export default router;