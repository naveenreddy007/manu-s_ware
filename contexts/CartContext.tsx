"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface CartContextType {
  cartCount: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = async () => {
    try {
      const response = await fetch("/api/cart/count")
      if (response.ok) {
        const data = await response.json()
        setCartCount(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
    }
  }

  const refreshCart = async () => {
    await fetchCartCount()
  }

  useEffect(() => {
    fetchCartCount()

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [])

  return <CartContext.Provider value={{ cartCount, refreshCart }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
