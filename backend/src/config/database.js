require('../../loadEnv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

    const checkUsersCols2 = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='users'
    `);
    const uc = checkUsersCols2.rows.map((r) => r.column_name);

    if (!uc.includes('username')) {
      await client.query(`ALTER TABLE users ADD COLUMN username VARCHAR(120) UNIQUE`);
      console.log('  ✓ Added username column to users table');
    }

    if (!uc.includes('admin_request_status')) {
      await client.query(
        `ALTER TABLE users ADD COLUMN admin_request_status VARCHAR(20)`
      );
      console.log('  ✓ Added admin_request_status column to users table');
    }

    const checkUsersCols3 = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='users'
    `);
    const uc3 = checkUsersCols3.rows.map((r) => r.column_name);
    if (!uc3.includes('gmail_app_password_enc')) {
      await client.query(
        `ALTER TABLE users ADD COLUMN gmail_app_password_enc TEXT`
      );
      console.log('  ✓ Added gmail_app_password_enc column to users table');
    }

    const checkUsersCols4 = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='users'
    `);
    const uc4 = checkUsersCols4.rows.map((r) => r.column_name);
    if (!uc4.includes('google_sub')) {
      await client.query(
        `ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) UNIQUE`
      );
      console.log('  ✓ Added google_sub column to users table');
    }

    const hpNull = await client.query(`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'hashed_password'
    `);
    if (hpNull.rows[0]?.is_nullable === 'NO') {
      await client.query(
        `ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL`
      );
      console.log('  ✓ hashed_password is now nullable (Google-only or optional password)');
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

async function seedDefaultAdmin() {
  const email =
    process.env.DEFAULT_ADMIN_EMAIL?.trim() ||
    'shawscopra.defaultadmin@gmail.com';
  const username =
    process.env.DEFAULT_ADMIN_USERNAME?.trim() || 'Admin';
  const password =
    process.env.DEFAULT_ADMIN_PASSWORD !== undefined &&
    process.env.DEFAULT_ADMIN_PASSWORD !== ''
      ? process.env.DEFAULT_ADMIN_PASSWORD
      : '123';
  const fullName = (
    process.env.DEFAULT_ADMIN_FULL_NAME || 'Site Administrator'
  ).trim();

  try {
    const legacy = await pool.query(
      `SELECT id FROM users WHERE email = 'shaw@gmail.com'`
    );
    if (legacy.rows.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET full_name = $1, username = $2, email = $3,
         hashed_password = $4, role = 'admin', admin_request_status = 'approved'
         WHERE email = 'shaw@gmail.com'`,
        [fullName, username, email, hashedPassword]
      );
      console.log(`  ✓ Migrated legacy default admin → (${username} / ${email})`);
      return;
    }

    const byEmail = await pool.query(
      `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER($1)`,
      [email]
    );
    let targetId =
      byEmail.rows[0]?.id ||
      (
        await pool.query(
          `SELECT id FROM users
           WHERE username IS NOT NULL
             AND TRIM(username) <> ''
             AND LOWER(TRIM(username)) = LOWER($1)`,
          [username]
        )
      ).rows[0]?.id;

    const hashedPassword = await bcrypt.hash(password, 10);
    if (targetId != null) {
      await pool.query(
        `UPDATE users SET full_name = $1, username = $2, email = $3,
         hashed_password = $4, role = 'admin', admin_request_status = 'approved'
         WHERE id = $5`,
        [fullName, username, email, hashedPassword, targetId]
      );
      console.log(
        `  ✓ Synced default admin (username: ${username} — matches .env password)`
      );
      return;
    }
    await pool.query(
      `INSERT INTO users (
        full_name, username, email, hashed_password, role, admin_request_status,
        shipping_phone, shipping_address
      ) VALUES ($1, $2, $3, $4, 'admin', 'approved', '', '')`,
      [fullName, username, email, hashedPassword]
    );
    console.log(
      `  ✓ Seeded default admin (username: ${username} — sign in with username or email)`
    );
  } catch (e) {
    console.error('  ⚠ Default admin seed skipped:', e.message);
  }
}

module.exports = { pool, initDatabase, seedDefaultAdmin };
