import { Navigate } from "react-router-dom"

/** Registration is disabled — accounts are created on first Google sign-in. */
export default function Register() {
  return <Navigate to="/" replace />
}
