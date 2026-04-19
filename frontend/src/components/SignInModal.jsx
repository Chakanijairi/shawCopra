import { useEffect } from "react"
import SmartBackButton from "./SmartBackButton"
import { getGooglePassportOAuthUrl, isProductionApiUrlPointingAtLocalhost } from "../lib/api"

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const PASSPORT_GOOGLE_URL = getGooglePassportOAuthUrl()
const apiPointsToLocalInProd = isProductionApiUrlPointingAtLocalhost()

export default function SignInModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]" role="dialog" aria-modal="true" aria-labelledby="sign-in-modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="sign-in-modal-title" className="text-lg font-semibold text-gray-900 pr-8 mb-6">
          Sign in
        </h2>

        <div className="flex flex-col items-stretch gap-3">
          {apiPointsToLocalInProd ? (
            <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-3 leading-relaxed">
              <strong className="font-medium">API URL is still localhost in this production build.</strong> In{" "}
              <strong className="font-medium">Vercel → Settings → Environment Variables</strong>, set{" "}
              <code className="font-mono text-xs bg-white/80 px-1 rounded">VITE_API_URL</code> to your public API (e.g.{" "}
              <code className="font-mono text-xs bg-white/80 px-1 rounded">https://your-api.onrender.com</code>
              ), then <strong className="font-medium">redeploy</strong>. Also set matching{" "}
              <code className="font-mono text-xs bg-white/80 px-1 rounded">FRONTEND_URL</code> /{" "}
              <code className="font-mono text-xs bg-white/80 px-1 rounded">CALLBACK_URL</code> on the API host.
            </p>
          ) : null}
          {GOOGLE_CLIENT_ID && !apiPointsToLocalInProd ? (
            <a
              href={PASSPORT_GOOGLE_URL}
              target="_top"
              rel="noopener noreferrer"
              className="flex justify-center items-center gap-2 w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 text-center shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </a>
          ) : !apiPointsToLocalInProd ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 leading-relaxed">
              Google sign-in is not wired for this deployment. In{" "}
              <strong className="font-medium">Vercel → Settings → Environment Variables</strong>, add{" "}
              <code className="font-mono text-xs bg-white/80 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> with the same Web
              Client ID as <code className="font-mono text-xs bg-white/80 px-1 rounded">GOOGLE_CLIENT_ID</code> on Render,
              then redeploy. Without it, the app cannot open the &quot;Choose an account&quot; screen for your app
              (CopraSystem).
            </p>
          ) : null}
        </div>

        <p className="text-center mt-6">
          <SmartBackButton
            fallbackTo="/"
            onBeforeBack={onClose}
            className="text-sm text-gray-500 hover:text-[#664C36]"
          >
            Back to store
          </SmartBackButton>
        </p>
      </div>
    </div>
  )
}
