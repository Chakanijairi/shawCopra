const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';

/** Supabase and most cloud Postgres hosts require TLS (not only when NODE_ENV=production). */
function resolveSsl() {
  if (!connectionString) return false;
  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  if (isLocal && !connectionString.includes('sslmode=require')) {
    return false;
  }
  const needsSsl =
    process.env.DATABASE_SSL === 'true' ||
    process.env.NODE_ENV === 'production' ||
    /supabase\.co|pooler\.supabase|neon\.tech|render\.com|railway\.app/i.test(
      connectionString
    ) ||
    connectionString.includes('sslmode=require');
  return needsSsl ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: resolveSsl(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error (connection may recover on next query):', err.message);
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_path VARCHAR(500)
      )
    `);

    // Check and add missing columns to users table
    const checkUsersCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users'
    `);
    const userColumns = checkUsersCols.rows.map(r => r.column_name);

    if (!userColumns.includes('hashed_password') && !userColumns.includes('password')) {
      await client.query(`ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)`);
      console.log('  ✓ Added hashed_password column to users table');
    } else if (userColumns.includes('password') && !userColumns.includes('hashed_password')) {
      await client.query(`ALTER TABLE users RENAME COLUMN password TO hashed_password`);
      console.log('  ✓ Renamed password to hashed_password in users table');
    }
    
    if (!userColumns.includes('role')) {
      await client.query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'`);
      console.log('  ✓ Added role column to users table');
    }

    if (!userColumns.includes('created_at')) {
      await client.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('  ✓ Added created_at column to users table');
    }

    // Add shipping columns
    if (!userColumns.includes('shipping_address')) {
      await client.query(`ALTER TABLE users ADD COLUMN shipping_address TEXT`);
      console.log('  ✓ Added shipping_address column to users table');
    }

    if (!userColumns.includes('shipping_city')) {
      await client.query(`ALTER TABLE users ADD COLUMN shipping_city VARCHAR(100)`);
      console.log('  ✓ Added shipping_city column to users table');
    }

    if (!userColumns.includes('shipping_zip')) {
      await client.query(`ALTER TABLE users ADD COLUMN shipping_zip VARCHAR(20)`);
      console.log('  ✓ Added shipping_zip column to users table');
    }

    if (!userColumns.includes('shipping_phone')) {
      await client.query(`ALTER TABLE users ADD COLUMN shipping_phone VARCHAR(20)`);
      console.log('  ✓ Added shipping_phone column to users table');
    }

    // Check and add missing columns to products table
    const checkProductsCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products'
    `);
    const productColumns = checkProductsCol.rows.map(r => r.column_name);

    if (!productColumns.includes('created_at')) {
      await client.query(`ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('  ✓ Added created_at column to products table');
    }

    await client.query('COMMIT');
    console.log('✅ Database tables initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
