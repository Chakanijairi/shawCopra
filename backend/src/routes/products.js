const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.get('', optionalAuth, async (req, res) => {
  try {
    const adminList =
      req.user?.role === 'admin' && String(req.query.scope || '') === 'admin';
    const sql = adminList
      ? 'SELECT * FROM products ORDER BY id DESC'
      : 'SELECT * FROM products WHERE COALESCE(stock, 0) > 0 ORDER BY id DESC';
    const result = await pool.query(sql);
    const products = result.rows.map(product => ({
      ...product,
      image_path: product.image_path ? `/uploads/${path.basename(product.image_path)}` : null
    }));
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ detail: 'Failed to fetch products' });
  }
});

/**
 * Atomically reduce `products.stock` for each cart line (checkout).
 * Customer JWT only; admins cannot use this path.
 * Must be registered before GET /:id so "purchase-stock" is not parsed as an id.
 */
router.post('/purchase-stock', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ detail: 'Administrators cannot deduct stock via checkout.' });
  }

  const raw = req.body?.items;
  if (!Array.isArray(raw) || raw.length === 0) {
    return res.status(400).json({ detail: 'items array is required' });
  }

  const lines = [];
  for (const row of raw) {
    const id = Number.parseInt(String(row?.id ?? row?.product_id ?? ''), 10);
    const quantity = Math.floor(Number(row?.quantity ?? 0));
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ detail: 'Each item needs a valid product id' });
    }
    if (quantity < 1) {
      return res.status(400).json({ detail: 'Each item needs quantity >= 1' });
    }
    lines.push({ id, quantity });
  }

  const merged = new Map();
  for (const { id, quantity } of lines) {
    merged.set(id, (merged.get(id) || 0) + quantity);
  }
  const sorted = [...merged.entries()].sort((a, b) => a[0] - b[0]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [productId, qty] of sorted) {
      const result = await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND stock >= $1
         RETURNING id, name, stock`,
        [qty, productId]
      );
      if (result.rowCount === 0) {
        const snap = await client.query(
          'SELECT id, name, stock FROM products WHERE id = $1',
          [productId]
        );
        await client.query('ROLLBACK');
        const row = snap.rows[0];
        if (!row) {
          return res.status(409).json({ detail: `Product #${productId} is no longer available.` });
        }
        return res.status(409).json({
          detail: `Not enough stock for "${row.name}". Available: ${row.stock}, requested: ${qty}.`,
        });
      }
    }

    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      /* ignore */
    }
    console.error('purchase-stock error:', err);
    return res.status(500).json({ detail: 'Could not update stock' });
  } finally {
    client.release();
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    const product = result.rows[0];
    const admin = req.user?.role === 'admin';
    const stock = product.stock != null ? Number(product.stock) : 0;
    if (!admin && stock <= 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    product.image_path = product.image_path ? `/uploads/${path.basename(product.image_path)}` : null;
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ detail: 'Failed to fetch product' });
  }
});

router.post('', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ detail: 'Name and price are required' });
    }

    const imagePath = req.file ? req.file.filename : null;
    const stockNum = Math.max(0, Math.floor(Number.parseInt(String(stock ?? '0'), 10) || 0));

    const result = await pool.query(
      'INSERT INTO products (name, description, price, image_path, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || '', parseFloat(price), imagePath, stockNum]
    );

    const product = result.rows[0];
    product.image_path = product.image_path ? `/uploads/${path.basename(product.image_path)}` : null;

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ detail: 'Failed to create product' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const productId = req.params.id;
    const stockNum = Math.max(0, Math.floor(Number.parseInt(String(stock ?? '0'), 10) || 0));

    const existingProduct = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    let imagePath = existingProduct.rows[0].image_path;

    if (req.file) {
      if (imagePath) {
        const oldImagePath = path.join(uploadDir, path.basename(imagePath));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = req.file.filename;
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, image_path = $4, stock = $5 WHERE id = $6 RETURNING *',
      [name, description || '', parseFloat(price), imagePath, stockNum, productId]
    );

    const product = result.rows[0];
    product.image_path = product.image_path ? `/uploads/${path.basename(product.image_path)}` : null;

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ detail: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;

    const existingProduct = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    const imagePath = existingProduct.rows[0].image_path;
    if (imagePath) {
      const imageFilePath = path.join(uploadDir, path.basename(imagePath));
      if (fs.existsSync(imageFilePath)) {
        fs.unlinkSync(imageFilePath);
      }
    }

    await pool.query('DELETE FROM products WHERE id = $1', [productId]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ detail: 'Failed to delete product' });
  }
});

module.exports = router;
