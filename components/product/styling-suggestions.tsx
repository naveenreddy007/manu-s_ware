"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ShoppingBag } from "lucide-react"

interface OutfitSuggestion {
  id: string
  name: string
  occasion: string
  confidence_score: number
  wardrobe_items: any[]
  recommended_products: any[]
  styling_notes: string
}

interface StylingSuggestionsProps {
  suggestions: OutfitSuggestion[]
  productName: string
}

export function StylingSuggestions({ suggestions, productName }: StylingSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Style It With Your Wardrobe
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="space-y-3 pb-6 border-b border-border last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">{suggestion.name}</h4>
              <Badge variant="outline" className="capitalize">
                {suggestion.occasion}
              </Badge>
            </div>

            {/* Outfit Preview */}
            <div className="grid grid-cols-4 gap-2">
              {suggestion.wardrobe_items.slice(0, 2).map((item) => (
                <div key={item.id} className="relative aspect-square rounded-md overflow-hidden border border-border">
                  <Image
                    src={item.image_url || `/placeholder.svg?height=80&width=80&query=${item.category}`}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute bottom-1 left-1 text-xs bg-muted text-muted-foreground">Your</Badge>
                </div>
              ))}

              {suggestion.recommended_products.slice(0, 2).map((product) => (
                <div
                  key={product.id}
                  className="relative aspect-square rounded-md overflow-hidden border-2 border-primary"
                >
                  <Image
                    src={product.images[0] || "/placeholder.svg?height=80&width=80&query=premium menswear"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground">New</Badge>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{suggestion.styling_notes}</p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Confidence: {Math.round(suggestion.confidence_score * 100)}%
              </span>
              <Button size="sm" variant="outline">
                <ShoppingBag className="h-4 w-4 mr-1" />
                Complete Look
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
