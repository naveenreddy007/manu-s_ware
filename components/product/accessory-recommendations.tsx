"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"

interface AccessoryRecommendation {
  id: string
  name: string
  price: number
  images: string[]
  category: string
  compatibility_score: number
}

interface AccessoryRecommendationsProps {
  recommendations: AccessoryRecommendation[]
  productName: string
}

export function AccessoryRecommendations({ recommendations, productName }: AccessoryRecommendationsProps) {
  const addToCart = async (productId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          size: "One Size", // Default for accessories
          quantity: 1,
        }),
      })

      if (response.ok) {
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent("cartUpdated"))
      }
    } catch (error) {
      console.error("Failed to add accessory to cart:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Complete Your Look
        </CardTitle>
        <p className="text-sm text-muted-foreground">Perfect accessories to pair with your {productName}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((accessory) => (
            <div
              key={accessory.id}
              className="group border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/products/${accessory.id}`} className="block">
                <div className="relative aspect-square">
                  <Image
                    src={accessory.images[0] || "/placeholder.svg?height=200&width=200&query=accessory"}
                    alt={accessory.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                    {Math.round(accessory.compatibility_score * 100)}% Match
                  </Badge>
                </div>
              </Link>

              <div className="p-3 space-y-2">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm line-clamp-1">{accessory.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{accessory.category}</p>
                  <p className="font-semibold text-sm">{formatCurrency(accessory.price)}</p>
                </div>

                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => addToCart(accessory.id)}
                >
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
