import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { CartProvider } from "./context/CartContext"
import { SignInModalProvider } from "./context/SignInModalContext"
import LandingPage from "./pages/LandingPage"
import RegisterRedirect from "./pages/Register"
import PassportOAuthHandler from "./components/PassportOAuthHandler"
import AdminDashboard from "./pages/AdminDashboard"
import AdminRoute from "./components/AdminRoute"
import Products from "./pages/Products"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import AccountSettings from "./pages/AccountSettings"
import Checkout from "./pages/Checkout"
import OrderSuccess from "./pages/OrderSuccess"
import Orders from "./pages/Orders"

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

function AppRoutes() {
  return (
    <CartProvider>
      <PassportOAuthHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<RegisterRedirect />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </CartProvider>
  )
}

export default function App() {
  const shell = (
    <div className="min-h-dvh w-full max-w-[100vw]">
      <AppRoutes />
    </div>
  )

  if (!googleClientId) {
    return (
      <BrowserRouter>
        <SignInModalProvider>{shell}</SignInModalProvider>
      </BrowserRouter>
    )
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <SignInModalProvider>{shell}</SignInModalProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
