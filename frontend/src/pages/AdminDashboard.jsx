import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrderNotificationTemplates,
  getEmailConfig,
  sendOrderCustomerEmail,
  emailAdminOrdersSummary,
  API_URL,
  clearStoredAuth,
} from "../lib/api"
import GmailOpenLink from "../components/GmailOpenLink"

const SIDEBAR_LINKS = [
  { label: "Dashboard", id: "dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Orders", id: "orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Products", id: "products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7l8-4m0 10V7m0 0l8 4" },
]

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [ordersPage, setOrdersPage] = useState(1)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formStock, setFormStock] = useState("")
  const [formImage, setFormImage] = useState(null)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [orderEmailTemplates, setOrderEmailTemplates] = useState([])
  const [notifyTemplateByOrder, setNotifyTemplateByOrder] = useState({})
  const [sendingOrderId, setSendingOrderId] = useState(null)
  const [emailingDigest, setEmailingDigest] = useState(false)
  /** null = not loaded; false = API says Gmail env missing */
  const [gmailConfigured, setGmailConfigured] = useState(null)

  const ordersPerPage = 5

  useEffect(() => {
    if (activeTab !== "orders") return
    getEmailConfig()
      .then((d) => setGmailConfigured(!!d.gmailConfigured))
      .catch(() => setGmailConfigured(null))
    getOrderNotificationTemplates()
      .then((data) => setOrderEmailTemplates(data.templates || []))
      .catch(() =>
        setOrderEmailTemplates([
          { id: "delivery_in_10_min", label: "Delivering in ~10 minutes" },
          { id: "order_confirmed_preparing", label: "Order confirmed — preparing" },
          { id: "out_for_delivery", label: "Out for delivery" },
          { id: "delivered_complete", label: "Delivered — thank you" },
          { id: "order_delayed", label: "Order delayed (apology)" },
          { id: "payment_received", label: "Payment received" },
        ])
      )
  }, [activeTab])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProducts({ adminScope: true })
        setProducts(data)
      } catch {
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }
    load()
  }, [activeTab])

  useEffect(() => {
    // Load orders from localStorage
    const loadOrders = () => {
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      setOrders(storedOrders.reverse()) // Show newest first
    }
    loadOrders()
    
    // Refresh orders when switching to orders tab
    if (activeTab === 'orders') {
      loadOrders()
    }
  }, [activeTab])

  const totalOrdersPages = Math.ceil(orders.length / ordersPerPage)
  const paginatedOrders = orders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage)

  const updateOrderStatus = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    const updatedOrders = allOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    setOrders(updatedOrders.reverse())
  }

  const recordOrderEmailNotification = (orderId, templateId) => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]")
    const updatedOrders = allOrders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            emailUpdates: [
              ...(order.emailUpdates || []),
              { templateId, sentAt: new Date().toISOString() },
            ],
          }
        : order
    )
    localStorage.setItem("orders", JSON.stringify(updatedOrders))
    setOrders(updatedOrders.reverse())
  }

  const handleEmailOrdersSummary = async () => {
    let raw = []
    try {
      raw = JSON.parse(localStorage.getItem("orders") || "[]")
    } catch {
      raw = []
    }
    if (!Array.isArray(raw) || raw.length === 0) {
      alert("No orders to summarize.")
      return
    }
    setEmailingDigest(true)
    try {
      await emailAdminOrdersSummary(raw)
      alert("Summary sent to the admin inbox. Check Spam if needed.")
    } catch (e) {
      alert(e.message || "Failed to send summary email")
    } finally {
      setEmailingDigest(false)
    }
  }

  const handleSendOrderEmail = async (order) => {
    const templateId = notifyTemplateByOrder[order.id]
    if (!templateId) {
      alert("Choose an update message from the list first.")
      return
    }
    const email = order.shippingInfo?.email?.trim()
    if (!email) {
      alert("This order has no customer email.")
      return
    }
    setSendingOrderId(order.id)
    try {
      const res = await sendOrderCustomerEmail({
        email,
        customerName: order.shippingInfo?.fullName || "",
        orderId: order.id,
        templateId,
      })
      recordOrderEmailNotification(order.id, templateId)
      alert(
        (res.message || "Email sent.") +
          "\n\nThe customer should see it in their Gmail inbox (and Spam if needed)."
      )
    } catch (e) {
      alert(e.message || "Failed to send email")
    } finally {
      setSendingOrderId(null)
    }
  }

  const openAddProduct = () => {
    setEditingProduct(null)
    setFormName("")
    setFormDescription("")
    setFormPrice("")
    setFormStock("0")
    setFormImage(null)
    setFormError("")
    setShowProductModal(true)
  }

  const openEditProduct = (p) => {
    setEditingProduct(p)
    setFormName(p.name)
    setFormDescription(p.description || "")
    setFormPrice(String(p.price))
    setFormStock(String(p.stock ?? 0))
    setFormImage(null)
    setFormError("")
    setShowProductModal(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setFormError("")
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("name", formName)
      formData.append("description", formDescription)
      formData.append("price", parseFloat(formPrice) || 0)
      formData.append("stock", Math.max(0, Math.floor(Number.parseInt(String(formStock || "0"), 10) || 0)))
      if (formImage) formData.append("image", formImage)

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, formData)
        setProducts(products.map((p) => (p.id === editingProduct.id ? updated : p)))
      } else {
        const created = await createProduct(formData)
        setProducts([...products, created])
      }
      setShowProductModal(false)
    } catch (err) {
      setFormError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return
    try {
      await deleteProduct(id)
      setProducts(products.filter((p) => p.id !== id))
    } catch {
      alert("Failed to delete")
    }
  }

  const productImageUrl = (p) => (p.image_path ? `${API_URL}${p.image_path}` : null)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 bottom-0 z-30">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="text-xl font-semibold text-[#664C36]" style={{ fontFamily: "cursive" }}>
            Shaw&apos;s Copra
          </Link>
          <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${activeTab === link.id ? "bg-[#664C36] text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} /></svg>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            View Store
          </Link>
          <Link to="/" onClick={() => clearStoredAuth()} className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </Link>
        </div>
      </aside>

      {/* Main content — min-w-0 lets nested tables scroll horizontally inside the flex layout */}
      <main className="flex-1 ml-64 p-4 sm:p-8 min-w-0 max-w-full">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor and manage your store</p>
        </header>

        {activeTab === "dashboard" && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Sales", value: "₱124,500", sub: "This month", color: "bg-blue-500" },
                { label: "Orders", value: "48", sub: "Last 30 days", color: "bg-emerald-500" },
                { label: "Products", value: products.length, sub: "Active listings", color: "bg-amber-500" },
                { label: "Customers", value: "156", sub: "Registered", color: "bg-violet-500" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg ${card.color} opacity-90 mb-3`} />
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button type="button" onClick={() => setActiveTab("orders")} className="text-sm text-[#664C36] font-medium hover:underline">
                  View all
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="px-6 py-3 font-medium">Order ID</th>
                      <th className="px-6 py-3 font-medium">Customer</th>
                      <th className="px-6 py-3 font-medium">Total</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.slice(0, 5).map((order) => {
                        const orderDate = new Date(order.createdAt).toLocaleDateString()
                        const statusColors = {
                          pending: "bg-amber-100 text-amber-700",
                          completed: "bg-emerald-100 text-emerald-700",
                          cancelled: "bg-red-100 text-red-700"
                        }
                        return (
                          <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                            <td className="px-6 py-4 text-gray-600">{order.shippingInfo?.fullName || 'N/A'}</td>
                            <td className="px-6 py-4 text-gray-600">₱{order.total?.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm">{orderDate}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {ordersPage} of {totalOrdersPages}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOrdersPage((p) => Math.max(1, p - 1))} disabled={ordersPage === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50">
                    Previous
                  </button>
                  <button type="button" onClick={() => setOrdersPage((p) => Math.min(totalOrdersPages, p + 1))} disabled={ordersPage === totalOrdersPages} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Products preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                <button type="button" onClick={() => setActiveTab("products")} className="text-sm text-[#664C36] font-medium hover:underline">
                  Manage
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="px-6 py-3 font-medium">Image</th>
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium">Price</th>
                      <th className="px-6 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(productsLoading ? [] : products.slice(0, 3)).map((p) => (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="px-6 py-4">
                          {productImageUrl(p) ? (
                            <img src={productImageUrl(p)} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                        <td className="px-6 py-4 text-gray-600">₱{Number(p.price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">{p.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-full">
            {gmailConfigured === false && (
              <div
                className="px-4 sm:px-6 py-3 border-b border-red-200 bg-red-50 text-sm text-red-900"
                role="alert"
              >
                <strong className="font-semibold">Gmail is not configured on the API server.</strong> New-order
                alerts and “Send email” to customers will fail until you set{" "}
                <code className="text-xs bg-white px-1 rounded border border-red-200">GMAIL_USER</code> and{" "}
                <code className="text-xs bg-white px-1 rounded border border-red-200">GMAIL_APP_PASSWORD</code> in{" "}
                <code className="text-xs bg-white px-1 rounded border border-red-200">backend/.env</code> (local) or
                Render → Environment (production), then restart the API.
              </div>
            )}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Orders Management</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={emailingDigest || orders.length === 0}
                  onClick={handleEmailOrdersSummary}
                  className="text-sm font-medium px-3 py-2 rounded-lg border border-[#664C36] text-[#664C36] hover:bg-[#664C36]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailingDigest ? "Sending summary…" : "Email order summary"}
                </button>
                <GmailOpenLink className="shrink-0" />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-gray-100 text-sm text-slate-700 space-y-2">
              <p>
                <strong className="text-slate-900">Gmail on the server:</strong> Set{" "}
                <code className="text-xs bg-white px-1 rounded border">GMAIL_USER</code> and{" "}
                <code className="text-xs bg-white px-1 rounded border">GMAIL_APP_PASSWORD</code> in the API{" "}
                <code className="text-xs bg-white px-1 rounded border">.env</code> (Render → Environment). Without
                this, new-order alerts and customer emails will not send.
              </p>
              <p>
                <strong className="text-slate-900">When a customer orders:</strong> the address in{" "}
                <code className="text-xs bg-white px-1 rounded border">ADMIN_ORDER_NOTIFY_EMAIL</code> (or{" "}
                <code className="text-xs bg-white px-1 rounded border">ADMIN_GOOGLE_EMAIL</code>) receives a Gmail
                notification.
              </p>
              <p>
                <strong className="text-slate-900">Customer updates:</strong> choose a message under{" "}
                <em>Email customer</em>, then <em>Send email</em> — the buyer receives it at the email on the order.
              </p>
            </div>
            {orders.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium">No orders yet</p>
                <p className="text-sm mt-1">Orders will appear here when customers make purchases</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto overscroll-x-contain max-w-full touch-pan-x [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm">
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Order ID</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Customer</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Email</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Items</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Total</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Payment</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Date</th>
                        <th className="px-4 sm:px-6 py-3 font-medium min-w-[220px] whitespace-nowrap">Email customer</th>
                        <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order) => {
                        const orderDate = new Date(order.createdAt).toLocaleDateString()
                        const statusColors = {
                          pending: "bg-amber-100 text-amber-700",
                          completed: "bg-emerald-100 text-emerald-700",
                          cancelled: "bg-red-100 text-red-700"
                        }
                        return (
                          <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 sm:px-6 py-4 font-mono font-medium text-gray-900 text-sm whitespace-nowrap">#{order.id}</td>
                            <td className="px-4 sm:px-6 py-4 text-gray-900 whitespace-nowrap max-w-[160px] truncate" title={order.shippingInfo?.fullName}>{order.shippingInfo?.fullName || 'N/A'}</td>
                            <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm whitespace-nowrap max-w-[200px] truncate" title={order.shippingInfo?.email}>{order.shippingInfo?.email || 'N/A'}</td>
                            <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap">{order.items?.length || 0}</td>
                            <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">₱{Number(order.total ?? 0).toFixed(2)}</td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {order.paymentMethod === 'cod' ? 'COD' : 'GCash'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-gray-500 text-sm whitespace-nowrap">{orderDate}</td>
                            <td className="px-4 sm:px-6 py-4 align-top">
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <select
                                  value={notifyTemplateByOrder[order.id] || ""}
                                  onChange={(e) =>
                                    setNotifyTemplateByOrder((prev) => ({
                                      ...prev,
                                      [order.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
                                >
                                  <option value="">Choose update message…</option>
                                  {orderEmailTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={sendingOrderId === order.id}
                                  onClick={() => handleSendOrderEmail(order)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#664C36] text-white hover:bg-[#5a4230] disabled:opacity-50"
                                >
                                  {sendingOrderId === order.id ? "Sending…" : "Send email"}
                                </button>
                                {(order.emailUpdates?.length > 0) && (
                                  <p className="text-[10px] text-emerald-700">
                                    {order.emailUpdates.length} update
                                    {order.emailUpdates.length !== 1 ? "s" : ""} logged
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  const orderDetails = `
Order #${order.id}
Customer: ${order.shippingInfo?.fullName}
Email: ${order.shippingInfo?.email}
Phone: ${order.shippingInfo?.phone}
Address: ${order.shippingInfo?.address}, ${order.shippingInfo?.city}, ${order.shippingInfo?.zipCode}
Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'GCash'}
Total: ₱${order.total?.toFixed(2)}
Items: ${order.items?.map(item => `\n  - ${item.name} x${item.quantity} (₱${item.price})`).join('')}
Notes: ${order.shippingInfo?.notes || 'None'}
                                  `.trim()
                                  alert(orderDetails)
                                }}
                                className="text-[#664C36] hover:text-[#5a4230] font-medium text-sm"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-gray-500">
                    Showing {((ordersPage - 1) * ordersPerPage) + 1} to {Math.min(ordersPage * ordersPerPage, orders.length)} of {orders.length} orders
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))} 
                      disabled={ordersPage === 1} 
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setOrdersPage((p) => Math.min(totalOrdersPages, p + 1))} 
                      disabled={ordersPage === totalOrdersPages || totalOrdersPages === 0} 
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Product Management</h2>
                <p className="text-sm text-gray-500 mt-1">Add, edit, or remove products</p>
              </div>
              <button type="button" onClick={openAddProduct} className="px-4 py-2 rounded-lg bg-[#664C36] text-white text-sm font-medium hover:bg-[#5a4230] transition-colors inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm">
                    <th className="px-6 py-3 font-medium">Image</th>
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium min-w-[220px]">Price &amp; stock</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No products yet. Add one above.</td></tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          {productImageUrl(p) ? (
                            <img src={productImageUrl(p)} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm max-w-[240px] truncate">{p.description || "—"}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-gray-900">₱{Number(p.price).toFixed(2)}</span>
                            <span className="text-gray-300 hidden sm:inline" aria-hidden>|</span>
                            <span className="text-sm">
                              Stock: <strong className="text-gray-800">{Number(p.stock ?? 0)}</strong>
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                Number(p.stock ?? 0) > 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {Number(p.stock ?? 0) > 0 ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button type="button" onClick={() => openEditProduct(p)} className="p-2 text-gray-500 hover:text-[#664C36] hover:bg-gray-100 rounded-lg mr-1" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button type="button" onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowProductModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#664C36] focus:border-transparent" placeholder="Product name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#664C36] focus:border-transparent resize-none" placeholder="Product description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                <input type="number" step="0.01" min="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#664C36] focus:border-transparent" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock (units)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#664C36] focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">0 stock shows as Unavailable in the list.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input type="file" accept="image/*" onChange={(e) => setFormImage(e.target.files?.[0] || null)} className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                {editingProduct?.image_path && !formImage && (
                  <p className="text-xs text-gray-500 mt-1">Current: {editingProduct.image_path}. Choose a new file to replace.</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#664C36] text-white font-medium hover:bg-[#5a4230] disabled:opacity-60">
                  {saving ? "Saving..." : editingProduct ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
