import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orderId, setOrderId] = useState(null)
  const [shippingInfo, setShippingInfo] = useState(null)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (location.state?.orderId) {
      setOrderId(location.state.orderId)
      setShippingInfo(location.state.shippingInfo)
    } else {
      // If no order data, redirect to home
      setTimeout(() => navigate('/'), 3000)
    }

    // Hide confetti effect after animation
    setTimeout(() => setShowConfetti(false), 3000)
  }, [location, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Success Header with Gradient */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center relative">
              <div className="absolute inset-0 bg-black opacity-5 pattern-dots"></div>
              <div className="relative">
                {/* Animated Success Icon */}
                <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl transform hover:scale-110 transition-transform duration-300">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  Thank You!
                </h1>
                <p className="text-xl text-green-50">
                  Your order has been placed successfully
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-8">
              {/* Order ID Badge */}
              {orderId && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Order Confirmation Number</p>
                  <p className="text-3xl font-mono font-bold text-amber-900">#{orderId}</p>
                  <p className="text-xs text-gray-600 mt-2">Save this number for your records</p>
                </div>
              )}

              {/* Success Message */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  We're preparing your order!
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  A confirmation email has been sent to <span className="font-semibold text-[#664C36]">{shippingInfo?.email}</span>.
                  We'll keep you updated on your order status every step of the way.
                </p>
              </div>

              {/* Timeline Steps */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What happens next?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Order Confirmed</p>
                      <p className="text-sm text-gray-600">You'll receive a confirmation email shortly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Order Processing</p>
                      <p className="text-sm text-gray-600">We're preparing your items for shipment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">On Its Way</p>
                      <p className="text-sm text-gray-600">Delivery within 3-5 business days</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-600">Enjoy your purchase!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {shippingInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Shipping to
                  </h3>
                  <p className="text-gray-700">
                    <span className="font-semibold">{shippingInfo.fullName}</span><br />
                    {shippingInfo.address}<br />
                    {shippingInfo.city}, {shippingInfo.zipCode}<br />
                    {shippingInfo.phone}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="block w-full py-4 px-6 bg-gradient-to-r from-[#664C36] to-[#5a4230] text-white font-bold rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-center"
                >
                  Track My Order
                </Link>
                <Link
                  to="/products"
                  className="block w-full py-4 px-6 border-2 border-[#664C36] text-[#664C36] font-bold rounded-xl hover:bg-[#664C36] hover:text-white transition-all duration-200 text-center"
                >
                  Continue Shopping
                </Link>
                <Link
                  to="/"
                  className="block text-center text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                  Return to Home
                </Link>
              </div>

              {/* Support Message */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Need help? <a href="mailto:support@shawscopra.com" className="text-[#664C36] font-semibold hover:underline">Contact our support team</a>
                </p>
              </div>
            </div>
          </div>

          {/* Additional Message */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">
              Thank you for choosing Shaw's Copra! 🥥
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
