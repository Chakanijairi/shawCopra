import { createContext, useContext, useState, useEffect } from 'react'
import { canPurchase } from '../lib/roles'
import { priceNumber } from '../lib/prices'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (!savedCart) return
    try {
      const parsed = JSON.parse(savedCart)
      if (!Array.isArray(parsed)) return
      setCart(
        parsed.map((item) => ({
          ...item,
          price: priceNumber(item?.price),
          quantity: Math.max(1, Math.floor(Number(item?.quantity)) || 1),
        }))
      )
    } catch {
      setCart([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product) => {
    if (!canPurchase()) return false
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prevCart,
        { ...product, price: priceNumber(product?.price), quantity: 1 },
      ]
    })
    return true
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => {
      if (!canPurchase()) {
        const item = prevCart.find((i) => i.id === productId)
        if (item && quantity > item.quantity) return prevCart
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + priceNumber(item.price) * item.quantity,
      0
    )
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
