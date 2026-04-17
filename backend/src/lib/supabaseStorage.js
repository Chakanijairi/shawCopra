const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
/** Bucket name; must exist in Supabase Storage (e.g. create bucket `products`, public read for product images). */
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';
/** Object keys are stored as `public/<filename>` inside the bucket. */
const PUBLIC_PREFIX = 'public';

function isConfigured() {
  return Boolean(url && serviceKey);
}

function getClient() {
  if (!isConfigured()) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Upload a Multer memory file to `public/<filename>` in the bucket, then return the public URL.
 * Postgres should store this URL string in `products.image_path` (not a local filename).
 */
async function uploadProductImage(file) {
  const client = getClient();
  if (!client) {
    throw new Error('Supabase Storage is not configured');
  }
  const ext = path.extname(file.originalname || '') || '.jpg';
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const fileName = `${uniqueSuffix}${ext}`;
  const objectPath = `${PUBLIC_PREFIX}/${fileName}`;

  const { error } = await client.storage.from(bucket).upload(objectPath, file.buffer, {
    contentType: file.mimetype || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

function parsePublicObjectLocation(publicUrl) {
  const marker = '/object/public/';
  const idx = String(publicUrl).indexOf(marker);
  if (idx === -1) return null;
  const rest = String(publicUrl).slice(idx + marker.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  const bucketName = rest.slice(0, slash);
  const objectPath = rest.slice(slash + 1);
  if (!bucketName || !objectPath) return null;
  return { bucketName, objectPath };
}

/**
 * Remove an image referenced by DB value: Supabase public URL or local filename.
 */
async function removeStoredImage(stored) {
  if (!stored) return;
  const s = String(stored).trim();
  if (/^https?:\/\//i.test(s)) {
    if (!isConfigured()) return;
    const loc = parsePublicObjectLocation(s);
    if (!loc) {
      console.warn('Supabase remove: could not parse public URL');
      return;
    }
    const client = getClient();
    if (!client) return;
    const { error } = await client.storage.from(loc.bucketName).remove([loc.objectPath]);
    if (error) console.warn('Supabase remove failed:', error.message);
    return;
  }
}

module.exports = {
  isConfigured,
  uploadProductImage,
  removeStoredImage,
};
