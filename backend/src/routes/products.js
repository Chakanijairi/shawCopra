const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

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

router.get('', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
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

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    const product = result.rows[0];
    product.image_path = product.image_path ? `/uploads/${path.basename(product.image_path)}` : null;
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ detail: 'Failed to fetch product' });
  }
});

router.post('', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ detail: 'Name and price are required' });
    }

    const imagePath = req.file ? req.file.filename : null;

    const result = await pool.query(
      'INSERT INTO products (name, description, price, image_path) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', parseFloat(price), imagePath]
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
    const { name, description, price } = req.body;
    const productId = req.params.id;

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
      'UPDATE products SET name = $1, description = $2, price = $3, image_path = $4 WHERE id = $5 RETURNING *',
      [name, description || '', parseFloat(price), imagePath, productId]
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
