const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile with shipping info
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, shipping_address, shipping_city, shipping_zip, shipping_phone FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ detail: 'Failed to fetch profile' });
  }
});

// Update user shipping info
router.put('/shipping', authMiddleware, async (req, res) => {
  try {
    const { fullName, address, city, zipCode, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, shipping_address = $2, shipping_city = $3, 
           shipping_zip = $4, shipping_phone = $5 
       WHERE id = $6 
       RETURNING id, full_name, email, shipping_address, shipping_city, shipping_zip, shipping_phone`,
      [fullName, address, city, zipCode, phone, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update shipping error:', error);
    res.status(500).json({ detail: 'Failed to update shipping info' });
  }
});

module.exports = router;
