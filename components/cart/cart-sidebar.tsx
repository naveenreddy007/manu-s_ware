"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ShoppingBag, Plus, Minus, X, CreditCard } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"

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

interface CartSidebarProps {
  itemCount?: number
}

export function CartSidebar({ itemCount = 0 }: CartSidebarProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    if (open) {
      fetchCartItems()
    }
  }, [open])

  useEffect(() => {
    const handleCartUpdate = () => {
      if (open) {
        fetchCartItems()
      } else {
        fetchCartCount()
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [open])

  const fetchCartItems = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/cart")
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        const count = data.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0
        setTotalItems(count)
      }
    } catch (error) {
      console.error("Failed to fetch cart items:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCartCount = async () => {
    try {
      const response = await fetch("/api/cart/count")
      if (response.ok) {
        const data = await response.json()
        setTotalItems(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
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
          setTotalItems((prev) => prev - items.find((item) => item.id === itemId)?.quantity || 0)
        } else {
          const data = await response.json()
          const oldQuantity = items.find((item) => item.id === itemId)?.quantity || 0
          setItems(items.map((item) => (item.id === itemId ? data.item : item)))
          setTotalItems((prev) => prev - oldQuantity + newQuantity)
        }

        // Trigger cart update event
        window.dispatchEvent(new CustomEvent("cartUpdated"))
      }
    } catch (error) {
      console.error("Failed to update cart item:", error)
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">Add some items to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border border-border rounded-lg">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                      <Image
                        src={item.product.images[0] || "/placeholder.svg?height=64&width=64&query=product"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(item.product.price)}</p>

                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, 0)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(totalPrice)}</span>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/checkout">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Checkout
                  </Link>
                </Button>

                <Button variant="outline" className="w-full bg-transparent" onClick={() => setOpen(false)}>
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
