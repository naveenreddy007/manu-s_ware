"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Eye } from "lucide-react"
import type { WardrobeItem } from "@/lib/types/database"

interface WardrobeCompatibilityProps {
  totalItems: number
  compatibleItems: WardrobeItem[]
  compatibilityScore: number
}

export function WardrobeCompatibility({ totalItems, compatibleItems, compatibilityScore }: WardrobeCompatibilityProps) {
  const scoreLevel = compatibilityScore > 0.7 ? "high" : compatibilityScore > 0.4 ? "medium" : "low"
  const scoreColor = {
    high: "text-accent",
    medium: "text-secondary",
    low: "text-muted-foreground",
  }

  const scoreBg = {
    high: "bg-accent/10 border-accent/20",
    medium: "bg-secondary/10 border-secondary/20",
    low: "bg-muted border-border",
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-primary" />
          Wardrobe Compatibility
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compatibility Score */}
        <div className={`p-4 rounded-lg border ${scoreBg[scoreLevel]}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Compatibility Score</span>
            <span className={`text-2xl font-bold ${scoreColor[scoreLevel]}`}>
              {Math.round(compatibilityScore * 100)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            This item pairs well with {compatibleItems.length} of your {totalItems} wardrobe pieces
          </p>
        </div>

        {/* Compatible Items Preview */}
        {compatibleItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Pairs perfectly with:</h4>
            <div className="grid grid-cols-3 gap-2">
              {compatibleItems.slice(0, 6).map((item) => (
                <div key={item.id} className="relative aspect-square rounded-md overflow-hidden border border-border">
                  <Image
                    src={item.image_url || `/placeholder.svg?height=100&width=100&query=${item.category}`}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <Badge className="absolute bottom-1 left-1 text-xs bg-white/90 text-foreground">
                    {item.category}
                  </Badge>
                </div>
              ))}
            </div>

            {compatibleItems.length > 6 && (
              <p className="text-xs text-muted-foreground">
                +{compatibleItems.length - 6} more compatible items in your wardrobe
              </p>
            )}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full bg-transparent">
          <Eye className="h-4 w-4 mr-2" />
          View All Compatible Items
        </Button>
      </CardContent>
    </Card>
  )
}
