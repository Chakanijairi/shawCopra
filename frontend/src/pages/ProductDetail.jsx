import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { getProduct } from "../lib/api"
import { useCart } from "../context/CartContext"
import { isAdmin } from "../lib/roles"
import { useSignInModal } from "../context/SignInModalContext"
import SmartBackButton from "../components/SmartBackButton"

function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const { openSignIn } = useSignInModal()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [added, setAdded] = useState(false)
  const adminUser = isAdmin()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    getProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p)
      })
      .catch(() => {
        if (!cancelled) setError("Product not found.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleAdd = () => {
    if (!product || adminUser) return
    const ok = addToCart(product)
    if (ok === false) return
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <Link to="/" className="text-xl sm:text-2xl font-semibold text-[#664C36] shrink-0" style={{ fontFamily: "cursive" }}>
            Shaw&apos;s Copra
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-wrap justify-start sm:justify-end text-sm min-w-0">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium nav-link-underline">
              Home
            </Link>
            <Link to="/products" className="text-gray-900 font-semibold border-b-2 border-[#664C36]">
              Products
            </Link>
            <Link to="/cart" className="text-gray-600 hover:text-gray-900 font-medium nav-link-underline">
              Cart
            </Link>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SmartBackButton
          fallbackTo="/products"
          className="text-[#664C36] hover:text-[#5a4230] font-medium mb-6 flex items-center gap-1"
        >
          ← Back
        </SmartBackButton>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#664C36] rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-700 mb-4">{error}</p>
            <Link to="/products" className="text-[#664C36] font-medium hover:underline">
              Browse all products
            </Link>
          </div>
        )}

        {!loading && product && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="aspect-square md:aspect-[4/3] bg-gray-100 max-h-[420px]">
              {product.image_path ? (
                <img
                  src={product.image_path}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-[#664C36] mb-4">₱{Number(product.price).toFixed(2)}</p>
              {product.description && <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={adminUser}
                  onClick={handleAdd}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    adminUser
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : added
                        ? "bg-green-500 text-white"
                        : "bg-[#664C36] text-white hover:bg-[#5a4230]"
                  }`}
                >
                  {adminUser ? "Purchase disabled" : added ? "Added to cart" : "Add to cart"}
                </button>
                <Link
                  to="/cart"
                  className="inline-flex items-center px-6 py-3 rounded-lg border border-[#664C36] text-[#664C36] font-medium hover:bg-[#664C36]/5"
                >
                  View cart
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
