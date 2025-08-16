import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Sparkles } from "lucide-react"
import type { Product, WardrobeItem } from "@/lib/types/database"

interface ProductRecommendationCardProps {
  product: Product
  reason: string
  confidence_score: number
  complements: WardrobeItem[]
}

export function ProductRecommendationCard({
  product,
  reason,
  confidence_score,
  complements,
}: ProductRecommendationCardProps) {
  const confidenceLevel = confidence_score > 0.8 ? "high" : confidence_score > 0.6 ? "medium" : "low"
  const confidenceColor = {
    high: "bg-accent text-accent-foreground",
    medium: "bg-secondary text-secondary-foreground",
    low: "bg-muted text-muted-foreground",
  }

  return (
    <Card className="group overflow-hidden border-0 bg-card hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={product.images[0] || "/placeholder.svg?height=400&width=300&query=premium menswear product"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <Badge className={`absolute top-3 left-3 gap-1 ${confidenceColor[confidenceLevel]}`}>
          <Sparkles className="h-3 w-3" />
          {Math.round(confidence_score * 100)}% match
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-heading font-bold text-card-foreground line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{reason}</p>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold text-card-foreground">${product.price}</p>

          {complements.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pairs with your:</p>
              <div className="flex flex-wrap gap-1">
                {complements.slice(0, 2).map((item) => (
                  <Badge key={item.id} variant="outline" className="text-xs">
                    {item.name}
                  </Badge>
                ))}
                {complements.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{complements.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            View Details
          </Button>
          <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
            <ShoppingBag className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
