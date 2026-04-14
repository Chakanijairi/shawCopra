/** Shown when VITE_GOOGLE_CLIENT_ID is set — Google Cloud must list the same origins the browser uses. */
export default function GoogleOAuthConsoleHint() {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null
  return (
    <details className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
      <summary className="cursor-pointer font-medium text-left">
        Google: “origin is not allowed”, “no registered origin”, invalid_client, or [GSI_LOGGER] errors?
      </summary>
      <div className="mt-2 text-gray-700 space-y-2">
        <p>
          Open{" "}
          <a
            className="text-[#664C36] underline font-medium"
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud → Credentials
          </a>{" "}
          → your <strong>OAuth 2.0 Client ID</strong> (type <strong>Web application</strong>, not Desktop).
        </p>
        <p>
          <strong>Authorized JavaScript origins</strong> — add each exact origin where you open the site (no path, no trailing
          slash). The Google button only works on origins listed here; opening the app via a different host/port (e.g.{" "}
          <code className="font-mono">file://</code> or another port) will trigger [GSI_LOGGER] / “origin is not allowed”.
        </p>
        <ul className="list-disc pl-5 font-mono text-[11px] bg-white/80 rounded px-2 py-1">
          <li>http://localhost:5173</li>
          <li>http://127.0.0.1:5173</li>
        </ul>
        <p className="text-[11px]">
          After saving, use that same URL in the browser (and hard-refresh: Ctrl+Shift+R).
        </p>
        <p>
          <strong>Authorized redirect URIs</strong> — add:
        </p>
        <p className="font-mono text-[11px] bg-white/80 rounded px-2 py-1">http://localhost:8000/auth/google/callback</p>
        <p>
          Click <strong>Save</strong>. Wait a minute, restart Vite, open the app using an origin you listed (e.g.{" "}
          <code className="font-mono">http://localhost:5173</code>), hard-refresh (Ctrl+Shift+R).
        </p>
        <p>
          For <strong>invalid_client</strong>: confirm <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> matches this
          client&apos;s ID and backend <code className="font-mono">GOOGLE_CLIENT_SECRET</code> matches this client&apos;s
          secret (regenerate secret in Google if needed).
        </p>
      </div>
    </details>
  )
}
