/** Must match backend `auth.js` Gmail check for signup. */
export const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i

export function isValidGmail(email) {
  return GMAIL_REGEX.test(String(email).trim())
}

/** Opens Google account sign-in (account picker if already signed in). */
export const GOOGLE_ACCOUNT_SIGNIN = "https://accounts.google.com/signin"

export function openGoogleSignIn() {
  window.open(GOOGLE_ACCOUNT_SIGNIN, "_blank", "noopener,noreferrer")
}
