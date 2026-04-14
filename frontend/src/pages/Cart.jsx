import { useCart } from '../context/CartContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isAdmin } from '../lib/roles'
import { useSignInModal } from '../context/SignInModalContext'
import SmartBackButton from '../components/SmartBackButton'

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart()
  const navigate = useNavigate()
  const { openSignIn } = useSignInModal()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const sync = () => setIsLoggedIn(!!localStorage.getItem('token'))
    sync()
    window.addEventListener('shaw-auth-changed', sync)
    return () => window.removeEventListener('shaw-auth-changed', sync)
  }, [])

  const adminUser = isAdmin()

  const handleCheckout = () => {
    if (!isLoggedIn) {
      openSignIn()
      return
    }
    if (isAdmin()) {
      return
    }
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <div className="flex flex-col items-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#664C36] hover:bg-[#5a4230] transition-colors"
              >
                Browse Products
              </Link>
              <SmartBackButton
                fallbackTo="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#664C36] hover:text-[#5a4230] hover:underline"
              >
                <span aria-hidden="true">←</span> Back to home
              </SmartBackButton>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart ({getCartCount()} items)</h1>
          <Link
            to="/products"
            className="text-[#664C36] hover:text-[#5a4230] font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {cart.map((item) => (
                <div key={item.id} className="border-b border-gray-200 p-6 flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_path ? (
                      <img
                        src={`http://localhost:8000${item.image_path}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-lg font-bold text-[#664C36] mt-2">₱{item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-4 py-1 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-lg font-bold text-gray-900 mt-2">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={clearCart}
              className="mt-4 text-red-500 hover:text-red-700 font-medium"
            >
              Clear Cart
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₱{getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              {adminUser && (
                <div className="mb-4 p-4 bg-slate-100 border border-slate-200 rounded-lg">
                  <p className="text-sm font-semibold text-slate-800">Administrator account</p>
                  <p className="text-xs text-slate-600 mt-1">
                    You can manage the store from the admin dashboard. Purchases are only available when signed in as a customer.
                  </p>
                </div>
              )}

              {!isLoggedIn && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Login Required</p>
                      <p className="text-xs text-amber-700 mt-1">Please login to proceed with checkout</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={adminUser}
                className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors mb-3 ${
                  adminUser
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#664C36] text-white hover:bg-[#5a4230]"
                }`}
              >
                {!isLoggedIn ? "Login to Checkout" : adminUser ? "Checkout not available for admins" : "Proceed to Checkout"}
              </button>

              {!isLoggedIn && (
                <p className="text-center text-xs text-gray-600">
                  Use{" "}
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="text-[#664C36] font-medium hover:underline"
                  >
                    Sign in
                  </button>{" "}
                  (Google in the window) to check out.
                </p>
              )}

              <SmartBackButton
                fallbackTo="/"
                className="block w-full text-center text-sm text-[#664C36] hover:text-[#5a4230] font-medium mt-4"
              >
                Back to Home
              </SmartBackButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
