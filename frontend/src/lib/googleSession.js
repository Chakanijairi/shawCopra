export const GOOGLE_PROFILE_KEY = "googleProfile"

/** Decodes Google ID token payload (JWT) for display only. */
export function decodeGoogleCredentialPayload(credential) {
  if (!credential || typeof credential !== "string") return null
  try {
    const part = credential.split(".")[1]
    if (!part) return null
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function saveGoogleProfileFromCredential(credential) {
  const payload = decodeGoogleCredentialPayload(credential)
  if (!payload?.email) {
    try {
      localStorage.removeItem(GOOGLE_PROFILE_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  const profile = {
    picture: typeof payload.picture === "string" ? payload.picture : "",
    name: String(payload.name || payload.given_name || payload.email.split("@")[0] || "").trim(),
    email: String(payload.email).trim(),
  }
  try {
    localStorage.setItem(GOOGLE_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

export function getStoredGoogleProfile() {
  try {
    const raw = localStorage.getItem(GOOGLE_PROFILE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || typeof p !== "object") return null
    return p
  } catch {
    return null
  }
}

export function clearGoogleProfile() {
  try {
    localStorage.removeItem(GOOGLE_PROFILE_KEY)
  } catch {
    /* ignore */
  }
}
