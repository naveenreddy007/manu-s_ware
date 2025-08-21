"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ShoppingBag, Eye } from "lucide-react"
import type { WardrobeItem, Product } from "@/lib/types/database"
import { useCurrency } from "@/hooks/useCurrency"

interface OutfitRecommendationProps {
  id: string
  name: string
  occasion: string
  confidence_score: number
  wardrobe_items: WardrobeItem[]
  recommended_products: Product[]
  styling_notes: string
}

export function OutfitRecommendationCard({
  name,
  occasion,
  confidence_score,
  wardrobe_items,
  recommended_products,
  styling_notes,
}: OutfitRecommendationProps) {
  const { formatCurrency } = useCurrency()
  const confidenceLevel = confidence_score > 0.8 ? "high" : confidence_score > 0.6 ? "medium" : "low"
  const confidenceColor = {
    high: "bg-accent text-accent-foreground",
    medium: "bg-secondary text-secondary-foreground",
    low: "bg-muted text-muted-foreground",
  }

  const totalPrice = recommended_products.reduce((sum, product) => sum + product.price, 0)

  const handleShopItems = () => {
    // Add recommended products to cart
    recommended_products.forEach((product) => {
      // Dispatch custom event to add to cart
      window.dispatchEvent(
        new CustomEvent("addToCart", {
          detail: { productId: product.id, quantity: 1 },
        }),
      )
    })
  }

  return (
    <Card className="overflow-hidden border-0 bg-card hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading font-bold text-card-foreground">{name}</CardTitle>
          <Badge className={`gap-1 ${confidenceColor[confidenceLevel]}`}>
            <Sparkles className="h-3 w-3" />
            {Math.round(confidence_score * 100)}%
          </Badge>
        </div>
        <Badge variant="outline" className="w-fit capitalize">
          {occasion}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outfit Preview */}
        <div className="grid grid-cols-4 gap-2">
          {/* Wardrobe Items */}
          {wardrobe_items.slice(0, 2).map((item) => (
            <div key={item.id} className="relative aspect-square rounded-md overflow-hidden border border-border">
              <Image
                src={item.image_url || `/placeholder.svg?height=100&width=100&query=${item.category}`}
                alt={item.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <Badge className="absolute bottom-1 left-1 text-xs bg-muted text-muted-foreground">Your</Badge>
            </div>
          ))}

          {/* Recommended Products */}
          {recommended_products.slice(0, 2).map((product) => (
            <div key={product.id} className="relative aspect-square rounded-md overflow-hidden border-2 border-primary">
              <Image
                src={product.images[0] || "/placeholder.svg?height=100&width=100&query=premium menswear"}
                alt={product.name}
                fill
                className="object-cover"
              />
              <Badge className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground">New</Badge>
            </div>
          ))}
        </div>

        {/* Styling Notes */}
        <p className="text-sm text-muted-foreground">{styling_notes}</p>

        {/* Enhanced Recommended Products List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-card-foreground">Recommended additions:</h4>
            <span className="text-sm font-bold text-primary">{formatCurrency(totalPrice)}</span>
          </div>
          {recommended_products.map((product) => (
            <div key={product.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground truncate flex-1">{product.name}</span>
              <span className="font-medium text-card-foreground ml-2">{formatCurrency(product.price)}</span>
            </div>
          ))}
        </div>

        {/* Enhanced Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Eye className="h-4 w-4 mr-1" />
            View Outfit
          </Button>
          <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90" onClick={handleShopItems}>
            <ShoppingBag className="h-4 w-4 mr-1" />
            Add All to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
