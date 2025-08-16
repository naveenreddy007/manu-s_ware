"use client"

import { useState, useEffect } from "react"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/lib/contexts/cart-context"

export default function CheckoutPage() {
  const { items: cartItems, loading, totalPrice } = useCart()
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login?redirect=/checkout")
      return
    }

    setUser(user)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to your cart before checking out.</p>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = totalPrice

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-black text-foreground">Checkout</h1>
              <p className="text-muted-foreground">Complete your order</p>
            </div>
          </div>

          <CheckoutForm cartItems={cartItems} subtotal={subtotal} />
        </div>
      </div>
    </div>
  )
}
