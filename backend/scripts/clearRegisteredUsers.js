/**
 * Deletes all non-admin users so those emails can be registered again.
 * Preserves accounts where role = 'admin' (your seeded administrator).
 *
 * Usage (from backend folder):
 *   node scripts/clearRegisteredUsers.js
 *
 * Requires DATABASE_URL in .env (same as the API).
 */
require('../loadEnv');
const { pool } = require('../src/config/database');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'orders'
      ) AS has_orders
    `);

    if (rows[0]?.has_orders) {
      await client.query(`
        DELETE FROM orders
        WHERE user_id IN (
          SELECT id FROM users WHERE LOWER(COALESCE(role, 'user')) <> 'admin'
        )
      `);
    }

    const result = await client.query(`
      DELETE FROM users
      WHERE LOWER(COALESCE(role, 'user')) <> 'admin'
    `);

    await client.query('COMMIT');
    console.log(`Removed ${result.rowCount} user account(s). Admin account(s) kept. Emails are free to use again.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed:', e.message);
    if (/foreign key/i.test(e.message)) {
      console.error(
        'Hint: another table still references users. Delete or update those rows first, or run in your SQL client:\n' +
          "  DELETE FROM users WHERE role <> 'admin';"
      );
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
