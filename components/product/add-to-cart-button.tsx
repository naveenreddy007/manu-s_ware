"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Loader2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/CartContext"

interface Product {
  id: string
  name: string
  price: number
}

interface AddToCartButtonProps {
  product: Product
  size?: "sm" | "default" | "lg"
  className?: string
}

export default function AddToCartButton({ product, size = "sm", className }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const { toast } = useToast()
  const { refreshCart } = useCart()

  const handleAddToCart = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/cart/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          size: "M", // Default size, could be made configurable
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add item to cart")
      }

      setAdded(true)
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      })

      await refreshCart()

      setTimeout(() => setAdded(false), 2000)
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size={size} className={className} onClick={handleAddToCart} disabled={loading || added}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : added ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added!
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
