"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShopLookButtonProps {
  postId: string
  products: Array<{
    id: string
    name: string
    price: number
    size?: string
  }>
  type: "complete_look" | "individual_item"
  className?: string
}

export function ShopLookButton({ postId, products, type, className }: ShopLookButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleShopLook = async () => {
    setIsLoading(true)

    try {
      const items = products.map((product) => ({
        product_id: product.id,
        quantity: 1,
        size: product.size || "M",
      }))

      const response = await fetch(`/api/inspiration/${postId}/shop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          type,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Added to Cart!",
          description: data.message,
        })
      } else {
        throw new Error(data.error || "Failed to add items to cart")
      }
    } catch (error) {
      console.error("Error shopping look:", error)
      toast({
        title: "Error",
        description: "Failed to add items to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleShopLook} disabled={isLoading} className={className} size="sm">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
      {type === "complete_look" ? "Shop Look" : "Add to Cart"}
    </Button>
  )
}
