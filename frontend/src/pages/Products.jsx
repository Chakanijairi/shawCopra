import { useState, useEffect } from "react"
import { Link, useSearchParams, useLocation } from "react-router-dom"
import { getProducts, productImageUrl } from "../lib/api"
import { useCart } from "../context/CartContext"
import { isAdmin } from "../lib/roles"
import { useSignInModal } from "../context/SignInModalContext"
import SmartBackButton from "../components/SmartBackButton"
import { PRODUCTS_SCROLL_STORAGE_KEY } from "../lib/navigationKeys"

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const q = searchParams.get("q") ?? ""
  const { addToCart } = useCart()
  const { openSignIn } = useSignInModal()
  const [addedProducts, setAddedProducts] = useState({})

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem(PRODUCTS_SCROLL_STORAGE_KEY)
    if (raw == null) return
    const y = Number.parseInt(raw, 10)
    sessionStorage.removeItem(PRODUCTS_SCROLL_STORAGE_KEY)
    if (!Number.isFinite(y) || y < 0) return
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, y)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    const added = addToCart(product)
    if (added === false) {
      return
    }
    setAddedProducts((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedProducts((prev) => ({ ...prev, [product.id]: false }))
    }, 2000)
  }

  const adminUser = isAdmin()

  const setQuery = (value) => {
    const next = new URLSearchParams(searchParams)
    const trimmed = value.trim()
    if (trimmed) next.set("q", trimmed)
    else next.delete("q")
    setSearchParams(next, { replace: true })
  }

  const saveProductsScroll = () => {
    sessionStorage.setItem(PRODUCTS_SCROLL_STORAGE_KEY, String(window.scrollY))
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <Link to="/" className="text-xl sm:text-2xl font-semibold text-[#664C36] shrink-0" style={{ fontFamily: "cursive" }}>
            Shaw&apos;s Copra
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-wrap justify-start sm:justify-end text-sm sm:text-base min-w-0">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium nav-link-underline py-1.5">Home</Link>
            <Link to="/products" className="text-gray-900 font-semibold border-b-2 border-[#664C36] py-1.5">Products</Link>
            <Link to="/cart" className="text-gray-600 hover:text-gray-900 font-medium nav-link-underline py-1.5">Cart</Link>
            <button
              type="button"
              onClick={openSignIn}
              className="text-sm font-medium text-[#664C36] hover:text-[#5a4230] px-2 py-2 rounded-lg hover:bg-[#664C36]/10 min-h-9"
            >
              Sign in
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#664C36] to-[#8B6E54] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 right-16 w-24 h-24 rounded-full bg-white/5 animate-float-slow" />
          <div className="absolute bottom-4 left-20 w-16 h-16 rounded-full bg-white/5 animate-float-reverse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Our Products</h1>
          <p className="text-white/80 text-base sm:text-lg">Quality coconut products from Zamboanga del Sur</p>

          {adminUser && (
            <p className="mt-4 text-sm text-amber-100 bg-black/20 rounded-lg px-4 py-2 inline-block max-w-xl">
              You&apos;re signed in as an administrator. You can browse the shop; purchasing is only available to customer accounts.
            </p>
          )}

          {/* Search + Sort Row */}
          <div className="mt-6 max-w-lg relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Product Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <p className="text-sm text-gray-500">
          {loading ? "Loading..." : `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""}`}
          {q && <span className="ml-1">for "<span className="font-medium text-gray-700">{q}</span>"</span>}
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#664C36] rounded-full animate-spin" />
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 text-lg font-medium">No products found</p>
            <p className="text-gray-400 mt-1 text-sm">Try a different search term</p>
            {q && (
              <button type="button" onClick={() => setQuery("")} className="mt-4 text-[#664C36] font-medium hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden card-lift img-zoom group"
              >
                <Link
                  to={{ pathname: `/products/${product.id}`, search: location.search }}
                  onClick={saveProductsScroll}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#664C36] focus-visible:ring-offset-2 rounded-t-xl"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    {product.image_path ? (
                      <img
                        src={productImageUrl(product.image_path)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
                      <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        View details
                      </span>
                    </div>
                  </div>

                  {/* Product Info (preview) */}
                  <div className="p-4 pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#664C36] transition-colors">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </Link>

                <div className="p-4 pt-3">
                  <div className="flex items-center justify-between mt-0 pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold text-[#664C36]">
                      ₱{Number(product.price).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      disabled={adminUser}
                      title={adminUser ? "Administrators cannot add items to cart" : undefined}
                      onClick={() => handleAddToCart(product)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 btn-press ${
                        adminUser
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : addedProducts[product.id]
                            ? "bg-green-500 text-white scale-105"
                            : "bg-[#664C36] text-white hover:bg-[#5a4230]"
                      }`}
                    >
                      {adminUser ? "Purchase disabled" : addedProducts[product.id] ? "✓ Added!" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to top */}
      <div className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <SmartBackButton
            fallbackTo="/"
            className="text-[#664C36] font-medium hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </SmartBackButton>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1 transition-colors"
          >
            Back to top
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Products
