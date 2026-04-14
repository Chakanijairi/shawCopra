import { useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { clearGoogleProfile } from "../lib/googleSession"
import { notifyAuthChanged } from "../lib/authEvents"

/**
 * Passport redirect sends users to `/#access_token=…&role=…` (see backend passportApp).
 * This must run inside the router on first paint so JWT is stored without a dedicated /login page.
 */
export default function PassportOAuthHandler() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const hashHandled = useRef(false)

  const consumeHashTokens = useCallback(() => {
    if (hashHandled.current) return
    const raw = window.location.hash?.replace(/^#/, "")
    if (!raw) return
    const params = new URLSearchParams(raw)
    const access_token = params.get("access_token")
    const role = params.get("role")
    if (!access_token) return
    hashHandled.current = true
    clearGoogleProfile()
    localStorage.setItem("token", access_token)
    localStorage.setItem("role", role || "user")
    notifyAuthChanged()
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
    const r = localStorage.getItem("role")
    navigate(r === "admin" ? "/admin" : "/", { replace: true })
  }, [navigate])

  useEffect(() => {
    consumeHashTokens()
  }, [consumeHashTokens])

  useEffect(() => {
    if (searchParams.get("error") !== "google_oauth") return
    const next = new URLSearchParams(searchParams)
    next.delete("error")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  return null
}
