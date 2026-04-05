const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const { initDatabase, pool } = require('./src/config/database');
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const userRoutes = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 8000;

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://shaw-copra.vercel.app',
];

const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Must match multer destination in src/routes/products.js (backend/uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Health check DB error:', err.message);
    res.status(503).json({ status: 'error', database: err.message });
  }
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal server error'
  });
});

function ensureEnv() {
  const db = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
  if (!db) {
    console.error('FATAL: DATABASE_URL is not set. Add your Supabase connection string on Render.');
    process.exit(1);
  }

  const jwt = process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim();
  if (!jwt) {
    process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠️  JWT_SECRET is not set in environment. Using a random secret for this run only. ' +
        'Add JWT_SECRET in Render → Environment so tokens survive redeploys and restarts.'
    );
  }
}

const startServer = async () => {
  try {
    ensureEnv();
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
