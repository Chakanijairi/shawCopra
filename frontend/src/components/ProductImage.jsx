import { productImageUrl } from "../lib/api"

/**
 * Product photos from Supabase or /uploads — uses no-referrer so storage/CDN referrer rules don’t block the image.
 */
export default function ProductImage({ imagePath, alt, className, loading = "eager" }) {
  const src = productImageUrl(imagePath)
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading={loading}
      decoding="async"
    />
  )
}
