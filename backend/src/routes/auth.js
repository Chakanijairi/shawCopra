const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/signup', async (req, res) => {
  console.log('📝 Signup request received:', { body: req.body });
  try {
    const { full_name, email, password, role = 'user' } = req.body;

    console.log('Validating fields...');
    if (!full_name || !email || !password) {
      console.log('❌ Validation failed: Missing fields');
      return res.status(400).json({ detail: 'All fields are required' });
    }

    console.log('Checking for existing user...');
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ Email already registered');
      return res.status(400).json({ detail: 'Email already registered' });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Inserting user into database...');
    const result = await pool.query(
      'INSERT INTO users (full_name, email, hashed_password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
      [full_name, email, hashedPassword, role]
    );

    console.log('✅ User created successfully:', result.rows[0]);
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Signup error DETAILS:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ detail: `Server error during signup: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    if (!isValidPassword) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      access_token: token,
      token_type: 'bearer',
      role: user.role,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Server error during login' });
  }
});

module.exports = router;
