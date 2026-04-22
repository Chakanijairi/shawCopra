import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartBackButton from '../components/SmartBackButton'
import { useCart } from '../context/CartContext'
import { getUserProfile, updateShippingInfo, notifyAdminNewOrder, purchaseDeductStock } from '../lib/api'
import { useSignInModal } from '../context/SignInModalContext'
import OrderSuccessModal from '../components/OrderSuccessModal'
import { priceNumber } from '../lib/prices'

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
  /** Set when the shop could not be emailed (missing Gmail on server, SMTP error, etc.) */
  const [adminEmailNotifyIssue, setAdminEmailNotifyIssue] = useState(null)
  const [gcashProofFile, setGcashProofFile] = useState(null)
  const [gcashProofDataUrl, setGcashProofDataUrl] = useState('')

  const GCASH_COMPANY_NUMBER = '09538993345'
  const GCASH_COMPANY_NAME = 'Chawkani Jairi'

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

  const handleGcashProofChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setGcashProofFile(null)
      setGcashProofDataUrl('')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, etc.).')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be 5MB or smaller.')
      e.target.value = ''
      return
    }
    setGcashProofFile(file)
    const reader = new FileReader()
    reader.onload = () => setGcashProofDataUrl(String(reader.result || ''))
    reader.onerror = () => {
      setGcashProofFile(null)
      setGcashProofDataUrl('')
      alert('Could not read the file. Try another image.')
    }
    reader.readAsDataURL(file)
  }

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value
    setPaymentMethod(value)
    if (value !== 'gcash') {
      setGcashProofFile(null)
      setGcashProofDataUrl('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (localStorage.getItem('role') === 'admin') {
      navigate('/cart', { replace: true })
      return
    }
    if (paymentMethod === 'gcash' && !gcashProofDataUrl) {
      alert('Please upload a GCash payment proof screenshot before placing your order.')
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
        createdAt: new Date().toISOString(),
        ...(paymentMethod === 'gcash' && {
          gcashPayment: {
            payToNumber: GCASH_COMPANY_NUMBER,
            payToName: GCASH_COMPANY_NAME,
            proofDataUrl: gcashProofDataUrl,
            proofFileName: gcashProofFile?.name || 'payment-proof',
          },
        }),
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
      setAdminEmailNotifyIssue(null)
      const notifyResult = await notifyAdminNewOrder({
        order: {
          id: newOrder.id,
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
          shippingInfo: newOrder.shippingInfo,
          itemLines,
        },
        totalOrdersInStore: existingOrders.length,
      })
      if (!notifyResult.ok) {
        setAdminEmailNotifyIssue(
          notifyResult.detail ||
            "The store could not be notified by email. Your order is still saved."
        )
      }

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
        adminEmailNotifyIssue={adminEmailNotifyIssue}
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

                {paymentMethod === 'gcash' && (
                  <div className="mt-4 p-4 border border-amber-200 rounded-xl bg-amber-50/50 space-y-3">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold text-gray-900">Send payment to (GCash)</span>
                    </p>
                    <p className="text-base font-mono font-semibold text-[#664C36]"># {GCASH_COMPANY_NUMBER}</p>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">Name:</span> {GCASH_COMPANY_NAME}
                    </p>
                    <p className="text-xs text-gray-600">
                      After paying, upload a clear screenshot of your payment receipt. Required to place the order.
                    </p>
                    <div>
                      <label
                        htmlFor="gcash-proof"
                        className="block text-sm font-medium text-gray-800 mb-1"
                      >
                        Payment proof (image) <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="gcash-proof"
                        type="file"
                        accept="image/*"
                        onChange={handleGcashProofChange}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#664C36] file:text-white hover:file:bg-[#5a4230] cursor-pointer"
                      />
                    </div>
                    {gcashProofDataUrl && (
                      <div className="pt-1">
                        <p className="text-xs text-gray-600 mb-1">Preview</p>
                        <img
                          src={gcashProofDataUrl}
                          alt="Payment proof preview"
                          className="max-h-48 max-w-full rounded-lg border border-gray-200 object-contain bg-white"
                        />
                      </div>
                    )}
                  </div>
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