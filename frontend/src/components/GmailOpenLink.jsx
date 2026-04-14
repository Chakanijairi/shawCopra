import GoogleGLogo from "./GoogleGLogo"

/** Opens Google account sign-in in a new tab. */
export default function GmailOpenLink({ className = "" }) {
  return (
    <a
      href="https://accounts.google.com/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:bg-gray-50 transition-colors ${className}`}
      aria-label="Google account"
    >
      <GoogleGLogo className="w-8 h-8" />
    </a>
  )
}
