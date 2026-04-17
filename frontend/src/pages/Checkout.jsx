import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartBackButton from '../components/SmartBackButton'
import { useCart } from '../context/CartContext'
import { getUserProfile, updateShippingInfo, notifyAdminNewOrder, purchaseDeductStock } from '../lib/api'
import { useSignInModal } from '../context/SignInModalContext'
import OrderSuccessModal from '../components/OrderSuccessModal'
import { priceNumber } from '../lib/prices'

/** GCash mobile app deep link (official scheme used by payment providers). */
const GCASH_APP_URL = 'gcash://'

function isLikelyMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Attempts to open the GCash app. Browsers cannot reliably detect installation;
 * we use visibility/blur + a short timeout to infer failure.
 */
function tryOpenGcashApp(onUnavailable) {
  if (!isLikelyMobileDevice()) {
    onUnavailable()
    return
  }

  let settled = false
  const finish = (opened) => {
    if (settled) return
    settled = true
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('blur', onBlur)
    clearTimeout(failTimer)
    if (!opened) onUnavailable()
  }

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') finish(true)
  }
  const onPageHide = () => finish(true)
  const onBlur = () => {
    // App may steal focus before visibility flips on some devices
    setTimeout(() => {
      if (document.visibilityState === 'hidden') finish(true)
    }, 0)
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('blur', onBlur)

  const failTimer = setTimeout(() => {
    if (document.visibilityState === 'visible') finish(false)
    else finish(true)
  }, 2200)

  try {
    window.location.href = GCASH_APP_URL
  } catch {
    finish(false)
  }
}

function Checkout() {
  const navigate = useNavigate()
  const { openSignIn } = useSignInModal()
  const { cart, getCartTotal, clearCart } = useCart()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [saveShipping, setSaveShipping] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [gcashUnavailableMessage, setGcashUnavailableMessage] = useState('')
  const gcashAttemptRef = useRef(0)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    notes: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      openSignIn()
      navigate('/cart', { replace: true })
      return
    }
    if (localStorage.getItem('role') === 'admin') {
      navigate('/cart', { replace: true })
      return
    }
    setIsLoggedIn(true)
    loadUserProfile()
  }, [navigate, openSignIn])

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile()
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        email: profile.email || '',
        phone: profile.shipping_phone || '',
        address: profile.shipping_address || '',
        city: profile.shipping_city || '',
        zipCode: profile.shipping_zip || ''
      }))
    } catch (error) {
      console.error('Failed to load profile:', error)
      if (!localStorage.getItem('token')) {
        openSignIn()
        navigate('/cart', { replace: true })
      }
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    if (cart.length === 0 && !orderPlaced) {
      navigate('/cart')
    }
  }, [cart, navigate, orderPlaced])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value
    setPaymentMethod(value)
    setGcashUnavailableMessage('')

    if (value !== 'gcash') return

    gcashAttemptRef.current += 1
    const attemptId = gcashAttemptRef.current

    tryOpenGcashApp(() => {
      if (attemptId !== gcashAttemptRef.current) return
      setGcashUnavailableMessage(
        'GCash is not available on this device. Try another payment method.'
      )
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (localStorage.getItem('role') === 'admin') {
      navigate('/cart', { replace: true })
      return
    }
    setLoading(true)

    try {
      if (saveShipping) {
        try {
          await updateShippingInfo({
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            phone: formData.phone
          })
        } catch (error) {
          console.error('Failed to save shipping info:', error)
        }
      }

      await purchaseDeductStock(
        cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        }))
      )

      const orderData = {
        items: cart,
        total: getCartTotal(),
        paymentMethod,
        shippingInfo: formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')

      const newOrder = {
        id: Date.now(),
        ...orderData
      }

      existingOrders.push(newOrder)
      localStorage.setItem('orders', JSON.stringify(existingOrders))

      console.log('✅ Order saved:', newOrder.id)

      const itemLines = cart.map((i) => {
        const qty = i.quantity || 1
        const lineTotal = priceNumber(i.price) * qty
        return `${i.name || 'Item'} ×${qty} — ₱${lineTotal.toFixed(2)}`
      })
      void notifyAdminNewOrder({
        order: {
          id: newOrder.id,
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
          shippingInfo: newOrder.shippingInfo,
          itemLines,
        },
        totalOrdersInStore: existingOrders.length,
      })

      setOrderPlaced(true)
      setCurrentOrderId(newOrder.id)
      setShowSuccessModal(true)

      clearCart()

    } catch (error) {
      console.error('❌ Order error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    navigate('/products')
  }

  if (!isLoggedIn || (cart.length === 0 && !orderPlaced)) {
    return null
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#664C36] rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <OrderSuccessModal 
        isOpen={showSuccessModal} 
        onClose={closeSuccessModal}
        orderId={currentOrderId}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="mb-8">
            <SmartBackButton fallbackTo="/cart" className="text-[#664C36] hover:text-[#5a4230] font-medium">
              ← Back to Cart
            </SmartBackButton>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Checkout</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-6">

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#664C36]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#664C36]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#664C36]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#664C36]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#664C36]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#664C36]"
                    />
                  </div>

                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={handlePaymentMethodChange}
                  />
                  Cash on Delivery
                </label>

                <label className="flex items-center gap-3 mt-3">
                  <input
                    type="radio"
                    value="gcash"
                    checked={paymentMethod === 'gcash'}
                    onChange={handlePaymentMethodChange}
                  />
                  GCash
                </label>

                {gcashUnavailableMessage && (
                  <p
                    className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                    role="alert"
                  >
                    {gcashUnavailableMessage}
                  </p>
                )}

              </div>

            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {cart.map((item) => (
                <div key={item.id} className="flex justify-between mb-2">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₱{(priceNumber(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className="border-t pt-4 mt-4 font-bold">
                Total: ₱{getCartTotal().toFixed(2)}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-[#664C36] text-white rounded-lg"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>

            </div>

          </form>
        </div>
      </div>
    </>
  )
}

export default Checkout