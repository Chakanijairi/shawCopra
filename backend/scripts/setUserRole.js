/**
 * Set a user's role (e.g. demote admin to user).
 *
 * Usage (from backend folder):
 *   node scripts/setUserRole.js <email> <role>
 *
 * role must be: user | admin
 *
 * Example:
 *   node scripts/setUserRole.js chawkanijairi8@gmail.com user
 *
 * After changing role, the user must sign out and sign in again (JWT stores the old role until a new token is issued).
 */
require('../loadEnv');
const { pool } = require('../src/config/database');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const role = String(process.argv[3] || '').trim().toLowerCase();

  if (!email || !role) {
    console.error('Usage: node scripts/setUserRole.js <email> <user|admin>');
    process.exit(1);
  }
  if (role !== 'user' && role !== 'admin') {
    console.error('role must be "user" or "admin"');
    process.exit(1);
  }

  const r = await pool.query(
    `UPDATE users SET role = $1 WHERE LOWER(TRIM(email)) = LOWER($2) RETURNING id, email, role`,
    [role, email]
  );

  if (r.rowCount === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log('Updated:', r.rows[0]);
  console.log('Ask this user to log out and log in again so their session uses the new role.');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
