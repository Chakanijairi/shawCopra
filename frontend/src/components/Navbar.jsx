import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { clearStoredAuth } from "../lib/api"
import { getStoredGoogleProfile } from "../lib/googleSession"
import { useSignInModal } from "../context/SignInModalContext"
import LogoutModal from "./LogoutModal"

function Navbar() {
  const { getCartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = getCartCount()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [googleProfile, setGoogleProfile] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { openSignIn } = useSignInModal()

  const syncAuthFromStorage = () => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")
    setIsLoggedIn(!!token)
    setUserRole(role)
    setGoogleProfile(getStoredGoogleProfile())
  }

  useEffect(() => {
    syncAuthFromStorage()
  }, [location.pathname])

  useEffect(() => {
    const onAuth = () => syncAuthFromStorage()
    window.addEventListener("shaw-auth-changed", onAuth)
    return () => window.removeEventListener("shaw-auth-changed", onAuth)
  }, [])

  const navLinks = [
    { label: "Home", href: "/", isRoute: true },
    { label: "Products", href: "/products", isRoute: true },
    { label: "About", href: "/#about", isRoute: false },
    { label: "Categories", href: "/#categories", isRoute: false },
    { label: "Reviews", href: "/#reviews", isRoute: false },
    { label: "Contact", href: "/#contact", isRoute: false },
  ]

  const handleLogout = () => {
    setIsMenuOpen(false)
    setShowLogoutModal(true)

    clearStoredAuth()
    setIsLoggedIn(false)
    setUserRole(null)
    setGoogleProfile(null)

    setTimeout(() => {
      navigate("/")
    }, 2000)
  }

  const closeLogoutModal = () => {
    setShowLogoutModal(false)
  }

  return (
    <>
      <LogoutModal isOpen={showLogoutModal} onClose={closeLogoutModal} />
      
      <nav className="sticky top-0 z-50 bg-white shadow-sm py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 min-w-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-900 tracking-tight min-w-0 shrink">
          <span className="font-[cursive] italic truncate">Shaw&apos;s Copra</span>
          <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </Link>

        {/* Center nav - hidden on small, flex on md+ */}
        <ul className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-6 list-none m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.isRoute ? (
                <Link to={link.href} className="text-gray-800 hover:text-amber-800 text-sm font-medium nav-link-underline">
                  {link.label}
                </Link>
              ) : (
                <a href={link.href} className="text-gray-800 hover:text-amber-800 text-sm font-medium nav-link-underline">
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* Right icons: cart, profile, vertical line, burger menu */}
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative p-2 text-gray-700 hover:text-amber-700 rounded-lg hover:bg-gray-100" aria-label="Cart">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {isLoggedIn ? (
            <Link
              to="/account"
              className="p-1 text-gray-700 hover:text-amber-700 rounded-full hover:bg-gray-100 overflow-hidden"
              aria-label="Profile"
            >
              {googleProfile?.picture ? (
                <img
                  src={googleProfile.picture}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="inline-flex p-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              )}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false)
                openSignIn()
              }}
              className="p-1 text-gray-700 hover:text-amber-700 rounded-full hover:bg-gray-100 overflow-hidden"
              aria-label="Sign in"
            >
              <span className="inline-flex p-1.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            </button>
          )}
          <span className="w-px h-6 bg-gray-300 mx-1" aria-hidden="true" />
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-amber-700 rounded-lg hover:bg-gray-100" 
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-[min(calc(100vw-1.5rem),288px)] sm:w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[min(85vh,32rem)] overflow-y-auto overscroll-contain">
                  <div className="px-2 pb-2 border-b border-gray-200 md:hidden">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Menu</p>
                    <ul className="flex flex-col gap-0.5">
                      {navLinks.map((link) => (
                        <li key={`dd-${link.label}`}>
                          {link.isRoute ? (
                            <Link
                              to={link.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                            >
                              {link.label}
                            </Link>
                          ) : (
                            <a
                              href={link.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                            >
                              {link.label}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {isLoggedIn ? (
                    <>
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                        {googleProfile?.picture ? (
                          <img
                            src={googleProfile.picture}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xs font-medium">
                            {(userRole || "?").toString().slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          {googleProfile ? (
                            <>
                              <p className="text-sm font-medium text-gray-900 truncate">{googleProfile.name}</p>
                              <p className="text-xs text-gray-500 truncate">{googleProfile.email}</p>
                              {userRole && (
                                <p className="text-xs text-[#664C36] font-semibold mt-0.5">{userRole.toUpperCase()}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">Logged in as</p>
                              <p className="text-sm text-[#664C36] font-semibold">{userRole?.toUpperCase()}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <Link
                        to="/account"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Account Settings</span>
                      </Link>

                      {userRole === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">Admin Dashboard</span>
                        </Link>
                      )}

              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">My Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/orders"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-medium text-gray-900">My Orders</span>
              </Link>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-sm font-medium text-red-600">Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Not Logged In */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm text-gray-600">Not logged in</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false)
                          openSignIn()
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Sign in</span>
                      </button>

                      <Link
                        to="/cart"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Cart</span>
                        {cartCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  )
}

export default Navbar
