import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { getUserProfile } from "../lib/api"

export default function AdminRoute({ children }) {
  const [state, setState] = useState("loading")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setState("deny")
      return
    }
    getUserProfile()
      .then((profile) => {
        if (profile.role === "admin") setState("allow")
        else setState("deny")
      })
      .catch(() => setState("deny"))
  }, [])

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#664C36] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === "deny") {
    return <Navigate to="/" replace />
  }

  return children
}
