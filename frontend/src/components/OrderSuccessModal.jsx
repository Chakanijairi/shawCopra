import { useEffect } from 'react'
import './OrderSuccessModal.css'

function OrderSuccessModal({ isOpen, onClose, orderId, adminEmailNotifyIssue }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 order-modal-fadeIn order-modal-backdrop" style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform order-modal-slideUp relative overflow-hidden order-modal-content"
           style={{ background: 'white' }}>
        
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Success Icon with Animation */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl order-modal-scaleIn relative z-10">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3 relative z-10">
          Thank You!
        </h2>
        <p className="text-gray-600 text-center mb-6 relative z-10">
          Your order has been placed successfully. We will update you soon on your order status.
        </p>

        {/* Order ID */}
        {orderId && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 mb-6 text-center relative z-10">
            <p className="text-xs text-gray-600 mb-1">Order Number</p>
            <p className="text-2xl font-mono font-bold text-amber-900">#{orderId}</p>
          </div>
        )}

        {/* Email notices */}
        {adminEmailNotifyIssue ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 relative z-10" role="status">
            <p className="text-sm font-semibold text-amber-900">Store email alert</p>
            <p className="text-xs text-amber-800 mt-1">{adminEmailNotifyIssue}</p>
            <p className="text-xs text-amber-700 mt-2">
              Your order is confirmed. If this keeps happening, the shop needs Gmail (SMTP) configured on the server.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative z-10">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">Email</p>
                <p className="text-xs text-blue-700">
                  The shop has been notified at their Gmail. You can receive updates when they message you from the admin
                  dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#664C36] to-[#5a4230] text-white font-bold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Continue Shopping
          </button>
          <p className="text-center text-sm text-gray-500">
            Click the X to close this message
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessModal
