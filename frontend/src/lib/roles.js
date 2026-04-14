/** Role helpers (JWT role mirrored in localStorage at login). */

export function isAdmin() {
  try {
    return localStorage.getItem("role") === "admin"
  } catch {
    return false
  }
}

/** Only non-admin users may add to cart and check out. */
export function canPurchase() {
  return !isAdmin()
}
