import { useEffect } from 'react'

function LogoutModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 2 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50 backdrop-blur-sm animate-logout-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform animate-logout-panel">
        {/* Success Icon with Animation */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-logout-icon">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Successfully Logged Out!
        </h2>
        <p className="text-gray-600 text-center mb-6">
          You have been safely logged out of your account
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-green-400 to-emerald-600 h-1.5 rounded-full animate-progress"></div>
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          Redirecting to home page...
        </p>
      </div>
    </div>
  )
}

export default LogoutModal
