const { pool } = require('../config/database');

/** Gmail that gets `admin`; everyone else is `user`. Override with ADMIN_GOOGLE_EMAIL in backend/.env */
function adminGoogleEmail() {
  return (process.env.ADMIN_GOOGLE_EMAIL || 'chawkanijairi8@gmail.com').trim().toLowerCase();
}

/**
 * Find or create a user from Google identity (used by POST /auth/google and Passport OAuth callback).
 * Sets role: admin only for ADMIN_GOOGLE_EMAIL (default chawkanijairi8@gmail.com), else user.
 */
async function upsertUserFromGoogleProfile({ email, sub, name }) {
  const emailNorm = String(email).trim().toLowerCase();
  const subStr = String(sub);
  const displayName = String(name || emailNorm.split('@')[0] || 'Customer').trim();

  const found = await pool.query(
    `SELECT * FROM users
     WHERE LOWER(TRIM(email)) = $1 OR google_sub = $2`,
    [emailNorm, subStr]
  );

  let user = found.rows[0];
  if (found.rows.length > 1) {
    user =
      found.rows.find(
        (r) => r.email && String(r.email).toLowerCase() === emailNorm
      ) || found.rows[0];
  }

  if (user) {
    await pool.query(
      `UPDATE users
       SET google_sub = COALESCE(google_sub, $1::varchar),
           full_name = CASE WHEN $2::text <> '' THEN $2 ELSE full_name END
       WHERE id = $3`,
      [subStr, displayName, user.id]
    );
    const fresh = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
    user = fresh.rows[0];
  } else {
    const ins = await pool.query(
      `INSERT INTO users (
        full_name, email, hashed_password, role, admin_request_status,
        shipping_phone, shipping_address, gmail_app_password_enc, google_sub
      ) VALUES ($1, $2, NULL, 'user', NULL, '', '', NULL, $3)
      RETURNING *`,
      [displayName, emailNorm, subStr]
    );
    user = ins.rows[0];
  }

  if (emailNorm === adminGoogleEmail()) {
    await pool.query(
      `UPDATE users SET role = 'admin', admin_request_status = 'approved' WHERE id = $1`,
      [user.id]
    );
  } else {
    await pool.query(
      `UPDATE users SET role = 'user', admin_request_status = NULL WHERE id = $1`,
      [user.id]
    );
  }

  const out = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
  return out.rows[0];
}

module.exports = { upsertUserFromGoogleProfile, adminGoogleEmail };
