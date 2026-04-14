/** Fired after token/role are written so UI (e.g. Navbar) can sync from localStorage. */
export function notifyAuthChanged() {
  window.dispatchEvent(new CustomEvent("shaw-auth-changed"))
}
