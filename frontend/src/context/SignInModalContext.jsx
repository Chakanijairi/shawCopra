import { createContext, useCallback, useContext, useMemo, useState } from "react"
import SignInModal from "../components/SignInModal"

const SignInModalContext = createContext(null)

export function SignInModalProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openSignIn = useCallback(() => setOpen(true), [])
  const closeSignIn = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({
      openSignIn,
      closeSignIn,
      isOpen: open,
    }),
    [open, openSignIn, closeSignIn]
  )

  return (
    <SignInModalContext.Provider value={value}>
      {children}
      <SignInModal isOpen={open} onClose={closeSignIn} />
    </SignInModalContext.Provider>
  )
}

export function useSignInModal() {
  const ctx = useContext(SignInModalContext)
  if (!ctx) {
    throw new Error("useSignInModal must be used within SignInModalProvider")
  }
  return ctx
}
