const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');
const { upsertUserFromGoogleProfile } = require('../lib/googleAuthUser');

const router = express.Router();

// ✅ IMPORTANT: pass CLIENT ID here
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Build JWT payload (same for all auth methods)
 */
function buildAuthPayload(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return null;
  }

  const effectiveRole = user.role === 'admin' ? 'admin' : 'user';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: effectiveRole,
    },
    secret,
    { expiresIn }
  );

  return {
    access_token: token,
    token_type: 'bearer',
    role: effectiveRole,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      username: user.username || null,
    },
  };
}

/**
 * Send auth response
 */
function issueAuthJson(user, res) {
  const payload = buildAuthPayload(user);

  if (!payload) {
    return res.status(500).json({
      detail: 'Server configuration error: JWT_SECRET is missing',
    });
  }

  return res.json(payload);
}

/**
 * ❌ Disable manual signup
 */
router.post('/signup', (req, res) => {
  return res.status(403).json({
    detail: 'Registration is disabled. Use Google Sign-In.',
  });
});

/**
 * ✅ Google Sign-In (ID TOKEN FLOW)
 */
router.post('/google', async (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!googleClientId) {
    return res.status(503).json({
      detail: 'Google sign-in is not configured properly.',
    });
  }

  const { credential } = req.body;

  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({
      detail: 'Missing Google credential',
    });
  }

  try {
    // ✅ verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({
        detail: 'Google did not return email',
      });
    }

    if (!payload.email_verified) {
      return res.status(400).json({
        detail: 'Email is not verified by Google',
      });
    }

    const email = payload.email.toLowerCase().trim();
    const sub = payload.sub;
    const name =
      payload.name ||
      payload.given_name ||
      email.split('@')[0] ||
      'User';

    // ✅ upsert user
    const user = await upsertUserFromGoogleProfile({
      email,
      sub,
      name,
    });

    // ✅ return JWT
    return issueAuthJson(user, res);

  } catch (error) {
    console.error('❌ Google auth error:', error);

    return res.status(401).json({
      detail:
        process.env.NODE_ENV === 'production'
          ? 'Google login failed'
          : error.message,
    });
  }
});

/**
 * ✅ Email login (optional)
 */
router.post('/login', async (req, res) => {
  try {
    const identifier = req.body?.email?.trim();
    const password = req.body?.password;

    if (!identifier || !password) {
      return res.status(400).json({
        detail: 'Email and password required',
      });
    }

    const result = await pool.query(
      `SELECT * FROM users
       WHERE LOWER(email) = LOWER($1)
          OR LOWER(username) = LOWER($1)`,
      [identifier]
    );

    const user = result.rows[0];

    if (!user || !user.hashed_password) {
      return res.status(401).json({
        detail: 'Invalid credentials',
      });
    }

    const match = await bcrypt.compare(password, user.hashed_password);

    if (!match) {
      return res.status(401).json({
        detail: 'Invalid credentials',
      });
    }

    return issueAuthJson(user, res);

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      detail: 'Login failed',
    });
  }
});

module.exports = router;






// // const express = require('express');
// // const jwt = require('jsonwebtoken');
// // const bcrypt = require('bcryptjs');
// // const { OAuth2Client } = require('google-auth-library');
// // const { pool } = require('../config/database');
// // const { upsertUserFromGoogleProfile } = require('../lib/googleAuthUser');

// const router = express.Router();
// const googleClient = new OAuth2Client();

// /**
//  * Same session for every sign-in path: password POST /login, POST /auth/google, Passport OAuth callback.
//  * All issue the same JWT + role shape so the client treats them as one “room”.
//  */
// function buildAuthPayload(user) {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     return null;
//   }

//   const effectiveRole = user.role === 'admin' ? 'admin' : 'user';
//   const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
//   const token = jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//       role: effectiveRole,
//     },
//     secret,
//     { expiresIn }
//   );

//   return {
//     access_token: token,
//     token_type: 'bearer',
//     role: effectiveRole,
//     user: {
//       id: user.id,
//       full_name: user.full_name,
//       email: user.email,
//       username: user.username || null,
//     },
//   };
// }

// function issueAuthJson(user, res) {
//   const payload = buildAuthPayload(user);
//   if (!payload) {
//     return res.status(500).json({
//       detail: 'Server configuration error: JWT_SECRET is missing',
//     });
//   }
//   return res.json(payload);
// }

// /** Sign-up with email/password is disabled — use Google sign-in only. */
// router.post('/signup', (req, res) => {
//   res.status(403).json({
//     detail: 'Registration with email and password is disabled. Sign in with Google.',
//   });
// });

// /** Google ID token — links to existing user by email or creates a row. */
// router.post('/google', async (req, res) => {
//   const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
//   if (!googleClientId) {
//     return res.status(503).json({
//       detail:
//         'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in backend/.env.',
//     });
//   }

//   const { credential } = req.body;
//   if (!credential || typeof credential !== 'string') {
//     return res.status(400).json({ detail: 'Missing Google credential' });
//   }

//   try {
//     const ticket = await googleClient.verifyIdToken({
//       idToken: credential,
//       audience: googleClientId,
//     });
//     const payload = ticket.getPayload();
//     if (!payload?.email) {
//       return res.status(400).json({ detail: 'Google did not return an email address.' });
//     }
//     if (payload.email_verified !== true) {
//       return res.status(400).json({ detail: 'Verify your email with Google before signing in.' });
//     }

//     const email = String(payload.email).trim().toLowerCase();
//     const sub = String(payload.sub);
//     const name = String(
//       payload.name || payload.given_name || email.split('@')[0] || 'Customer'
//     ).trim();

//     const user = await upsertUserFromGoogleProfile({
//       email,
//       sub,
//       name,
//     });

//     return issueAuthJson(user, res);
//   } catch (e) {
//     console.error('Google auth error:', e.message || e);
//     return res.status(401).json({
//       detail:
//         process.env.NODE_ENV === 'production'
//           ? 'Google sign-in failed. Try again.'
//           : `Google sign-in failed: ${e.message}`,
//     });
//   }
// });

// /** Email/username + password (users with a stored password hash). */
// router.post('/login', async (req, res) => {
//   try {
//     const raw = req.body?.email;
//     const password = req.body?.password;
//     const identifier = typeof raw === 'string' ? raw.trim() : '';
//     if (!identifier || typeof password !== 'string' || !password) {
//       return res.status(400).json({
//         detail: 'Email (or username) and password are required',
//       });
//     }

//     const result = await pool.query(
//       `SELECT * FROM users
//        WHERE LOWER(TRIM(email)) = LOWER($1)
//           OR (username IS NOT NULL AND TRIM(username) <> '' AND LOWER(TRIM(username)) = LOWER($1))`,
//       [identifier]
//     );

//     const candidates = result.rows;
//     const user =
//       candidates.find((u) => u.hashed_password) || candidates[0];

//     if (!user) {
//       return res.status(401).json({ detail: 'Invalid email or password' });
//     }
//     if (!user.hashed_password) {
//       return res.status(401).json({
//         detail:
//           'No password is set for this account. Use Sign in with Google below.',
//       });
//     }

//     const match = await bcrypt.compare(password, user.hashed_password);
//     if (!match) {
//       return res.status(401).json({ detail: 'Invalid email or password' });
//     }

//     return issueAuthJson(user, res);
//   } catch (e) {
//     console.error('Login error:', e.message);
//     return res.status(500).json({ detail: 'Login failed' });
//   }
// });

// module.exports = router;
// module.exports.buildAuthPayload = buildAuthPayload;
