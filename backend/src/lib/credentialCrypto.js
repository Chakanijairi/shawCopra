const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

function getKey() {
  const raw = process.env.MAIL_CREDENTIALS_KEY || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(String(raw)).digest();
}

/** Encrypt Gmail App Password for storage (AES-256-GCM). */
function encryptAppPassword(plain) {
  if (!plain || typeof plain !== 'string') return null;
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptAppPassword(b64) {
  if (!b64 || typeof b64 !== 'string') return null;
  try {
    const key = getKey();
    const buf = Buffer.from(b64, 'base64');
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const enc = buf.subarray(32);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

module.exports = { encryptAppPassword, decryptAppPassword };
