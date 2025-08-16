"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface CartItem {
  id: string
  product_id: string
  size: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    images: string[]
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  loading: boolean
  addToCart: (productId: string, size: string, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  useEffect(() => {
    checkAuthAndLoadCart()
  }, [])

  const checkAuthAndLoadCart = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log("[v0] Auth check result:", { user: user?.id, error })

      setUser(user)

      if (user) {
        await refreshCart()
      } else {
        setItems([])
        console.log("[v0] No user found, cart cleared")
      }
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
      setItems([])
    }
  }

  const refreshCart = async () => {
    if (!user) {
      console.log("[v0] No user, skipping cart refresh")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Fetching cart items...")
      const response = await fetch("/api/cart")

      if (response.status === 401) {
        console.log("[v0] Unauthorized, clearing cart")
        setItems([])
        setUser(null)
        return
      }

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Cart items loaded:", data.items?.length || 0)
        setItems(data.items || [])
      } else {
        console.error("[v0] Failed to fetch cart:", response.status)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch cart items:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string, size: string, quantity = 1) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Adding to cart:", { productId, size, quantity })
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, size, quantity }),
      })

      if (response.status === 401) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to add items to cart.",
          variant: "destructive",
        })
        return
      }

      if (response.ok) {
        await refreshCart() // Refresh cart to get updated state
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart.",
        })
        console.log("[v0] Item added to cart successfully")
      } else {
        throw new Error("Failed to add item to cart")
      }
    } catch (error) {
      console.error("[v0] Add to cart error:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, quantity: newQuantity }),
      })

      if (response.ok) {
        if (newQuantity <= 0) {
          setItems(items.filter((item) => item.id !== itemId))
        } else {
          const data = await response.json()
          setItems(items.map((item) => (item.id === itemId ? data.item : item)))
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      })
    }
  }

  const removeFromCart = async (itemId: string) => {
    await updateQuantity(itemId, 0)
  }

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      })

      if (response.ok) {
        setItems([])
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      })
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
