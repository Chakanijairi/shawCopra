const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const { pool } = require('./database');
const { upsertUserFromGoogleProfile } = require('../lib/googleAuthUser');

/** SPA origin for OAuth redirects (Passport). Supports FRONTEND_URL or CLIENT_URL. */
function frontendBaseUrl() {
  const raw =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CLIENT_URL?.trim() ||
    'http://localhost:5173';
  return raw.replace(/\/$/, '');
}

/**
 * Passport + express-session + Google OAuth2 redirect flow.
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL.
 * Successful login redirects to FRONTEND_URL/#access_token=...&role=... (SPA stores JWT; see PassportOAuthHandler).
 */
function setupPassport(app) {
  const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackURL = process.env.CALLBACK_URL?.trim();

  if (!clientID || !clientSecret || !callbackURL) {
    return;
  }

  const sessionSecret =
    process.env.SESSION_SECRET?.trim() || process.env.JWT_SECRET || 'change-me-session';

  app.use(
    session({
      name: 'shawscopra.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const r = await pool.query(
        'SELECT id, email, role, full_name, username FROM users WHERE id = $1',
        [id]
      );
      done(null, r.rows[0] || null);
    } catch (e) {
      done(e);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails &&
            profile.emails[0] &&
            profile.emails[0].value;
          if (!email) {
            return done(new Error('Google did not return an email address'));
          }
          const sub = profile.id;
          const name =
            (profile.displayName && profile.displayName.trim()) ||
            email.split('@')[0];
          const user = await upsertUserFromGoogleProfile({
            email: String(email).toLowerCase().trim(),
            sub: String(sub),
            name: String(name).trim(),
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const { buildAuthPayload } = require('../routes/auth');
  const base = frontendBaseUrl();

  /** `prompt: 'select_account'` shows Google’s account chooser (“Use another account”, etc.). */
  app.get('/auth/google/oauth', (req, res, next) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
    })(req, res, next);
  });

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${base}/?error=google_oauth`,
    }),
    (req, res) => {
      const payload = buildAuthPayload(req.user);
      if (!payload) {
        return res.status(500).json({
          detail: 'Server configuration error: JWT_SECRET is missing',
        });
      }
      const token = encodeURIComponent(payload.access_token);
      const role = encodeURIComponent(payload.role);
      res.redirect(`${base}/#access_token=${token}&role=${role}`);
    }
  );

  console.log(
    `✓ Passport: Google OAuth → SPA ${base}/ (FRONTEND_URL or CLIENT_URL)`
  );
}

module.exports = { setupPassport, frontendBaseUrl };
