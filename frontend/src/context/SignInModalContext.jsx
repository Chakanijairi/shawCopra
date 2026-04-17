import { useEffect, useRef, useState } from "react"

export default function SignInModal({ isOpen, onClose }) {
  const googleBtnRef = useRef(null)
  const googleInitialized = useRef(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (!window.google) return
    if (googleInitialized.current) return // 🔥 IMPORTANT FIX

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: async (response) => {
        try {
          setLoading(true)

          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/auth/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                credential: response.credential,
              }),
            }
          )

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.detail || "Login failed")
          }

          localStorage.setItem("token", data.access_token)

          window.location.href = "/dashboard"
        } catch (err) {
          console.error(err)
          alert(err.message)
        } finally {
          setLoading(false)
        }
      },

      auto_select: false,
      cancel_on_tap_outside: true,
    })

    // 🔥 Render button ONCE
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
    })

    googleInitialized.current = true
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[400px] relative">
        <button onClick={onClose} className="absolute top-2 right-3">
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Sign in to continue
        </h2>

        <div ref={googleBtnRef} />

        {loading && (
          <p className="text-sm text-gray-500 mt-3">
            Signing you in...
          </p>
        )}
      </div>
    </div>
  )
}








// import { useEffect, useRef, useState } from "react"

// export default function SignInModal({ isOpen, onClose }) {
//   const googleBtnRef = useRef(null)
//   const [loading, setLoading] = useState(false)

//   useEffect(() => {
//     if (!isOpen) return
//     if (!window.google) return

//     window.google.accounts.id.initialize({
//       client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

//       callback: async (response) => {
//         try {
//           setLoading(true)

//           // send ID token to your backend
//           const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               credential: response.credential,
//             }),
//           })

//           const data = await res.json()

//           if (!res.ok) {
//             throw new Error(data.detail || "Login failed")
//           }

//           // store JWT
//           localStorage.setItem("token", data.access_token)

//           // optional redirect
//           window.location.href = "/dashboard"
//         } catch (err) {
//           console.error("Google login error:", err)
//           alert(err.message)
//         } finally {
//           setLoading(false)
//         }
//       },

//       // 🔥 IMPORTANT FIXES
//       auto_select: false,
//       cancel_on_tap_outside: true,
//     })

//     // 🔥 FORCE RENDER BUTTON (this prevents silent login behavior)
//     window.google.accounts.id.renderButton(googleBtnRef.current, {
//       theme: "outline",
//       size: "large",
//       type: "standard",
//       shape: "pill",
//       text: "continue_with",
//     })

//     // 🔥 THIS TRIGGERS ACCOUNT CHOOSER BEHAVIOR
//     window.google.accounts.id.prompt()

//   }, [isOpen])

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
//       <div className="bg-white p-6 rounded-xl w-[400px] relative">

//         <button
//           onClick={onClose}
//           className="absolute top-2 right-3 text-gray-500"
//         >
//           ✕
//         </button>

//         <h2 className="text-xl font-semibold mb-4">
//           Sign in to continue
//         </h2>

//         <div ref={googleBtnRef} />

//         {loading && (
//           <p className="text-sm text-gray-500 mt-3">
//             Signing you in...
//           </p>
//         )}
//       </div>
//     </div>
//   )
// }






// import { createContext, useCallback, useContext, useMemo, useState } from "react"
// import SignInModal from "../components/SignInModal"

// const SignInModalContext = createContext(null)

// export function SignInModalProvider({ children }) {
//   const [open, setOpen] = useState(false)

//   const openSignIn = useCallback(() => setOpen(true), [])
//   const closeSignIn = useCallback(() => setOpen(false), [])

//   const value = useMemo(
//     () => ({
//       openSignIn,
//       closeSignIn,
//       isOpen: open,
//     }),
//     [open, openSignIn, closeSignIn]
//   )

//   return (
//     <SignInModalContext.Provider value={value}>
//       {children}
//       <SignInModal isOpen={open} onClose={closeSignIn} />
//     </SignInModalContext.Provider>
//   )
// }

// export function useSignInModal() {
//   const ctx = useContext(SignInModalContext)
//   if (!ctx) {
//     throw new Error("useSignInModal must be used within SignInModalProvider")
//   }
//   return ctx
// }
