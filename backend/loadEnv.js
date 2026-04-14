/**
 * Load backend/.env from this file's directory so GMAIL_*, DATABASE_URL, etc.
 * apply even when Node is started from the repo root (cwd ≠ backend).
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
