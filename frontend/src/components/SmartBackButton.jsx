import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Pops client history when possible so the previous screen (e.g. /products?q=…)
 * reloads with the same URL, scroll, and in-memory/UI state the browser restores.
 * Use `fallbackTo` when there is no step to go back to (e.g. direct link to this page).
 */
export default function SmartBackButton({ fallbackTo, className = "", children, onBeforeBack }) {
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    onBeforeBack?.()
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallbackTo)
    }
  }, [navigate, fallbackTo, onBeforeBack])

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? (
        <>
          <span className="inline" aria-hidden="true">
            ←{" "}
          </span>
          Back
        </>
      )}
    </button>
  )
}
