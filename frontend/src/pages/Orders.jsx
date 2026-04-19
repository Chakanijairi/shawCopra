import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSignInModal } from '../context/SignInModalContext'
import ProductImage from '../components/ProductImage'
import { priceNumber } from '../lib/prices'

function Orders() {
  const { openSignIn } = useSignInModal()
  const [orders, setOrders] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    if (token) {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      setOrders(savedOrders.sort((a, b) => b.id - a.id))
    }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    // Map 'completed' to 'Delivered' for display
    if (status === 'completed') return 'Delivered'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getPaymentMethodLabel = (method) => {
    return method === 'cod' ? 'Cash on Delivery' : 'GCash'
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your orders</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                type="button"
                onClick={openSignIn}
                className="inline-flex px-6 py-3 bg-[#664C36] text-white font-medium rounded-lg hover:bg-[#5a4230] transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'all'
                    ? 'border-b-2 border-[#664C36] text-[#664C36]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-[#664C36] text-[#664C36]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'delivered'
                    ? 'border-b-2 border-[#664C36] text-[#664C36]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Delivered ({orders.filter(o => o.status === 'completed' || o.status === 'delivered').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              to="/products"
              className="inline-flex px-6 py-3 bg-[#664C36] text-white font-medium rounded-lg hover:bg-[#5a4230] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders
              .filter(order => {
                if (activeTab === 'all') return true
                if (activeTab === 'delivered') return order.status === 'completed' || order.status === 'delivered'
                return order.status === activeTab
              })
              .map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-mono font-semibold text-gray-900">#{order.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-bold text-[#664C36]">₱{priceNumber(order.total).toFixed(2)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-4 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                            {item.image_path && (
                              <ProductImage
                                imagePath={item.image_path}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                            <p className="text-sm font-semibold text-[#664C36] mt-1">
                              ₱{(priceNumber(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Details */}
                    <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                        <p className="text-sm text-gray-600">
                          {order.shippingInfo.fullName}<br />
                          {order.shippingInfo.address}<br />
                          {order.shippingInfo.city}, {order.shippingInfo.zipCode}<br />
                          {order.shippingInfo.phone}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Payment Method</h4>
                        <p className="text-sm text-gray-600">{getPaymentMethodLabel(order.paymentMethod)}</p>
                        {order.notes && (
                          <>
                            <h4 className="font-semibold text-gray-900 mb-2 mt-4">Notes</h4>
                            <p className="text-sm text-gray-600">{order.notes}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-center">
              Based on your order history, check out our latest products!
            </p>
            <div className="text-center mt-4">
              <Link
                to="/products"
                className="inline-flex px-6 py-3 bg-[#664C36] text-white font-medium rounded-lg hover:bg-[#5a4230] transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders
