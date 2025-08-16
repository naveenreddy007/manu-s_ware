"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Share, User } from "lucide-react"
import { SocialShareButtons } from "./social-share-buttons"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface OutfitShareCardProps {
  outfit: {
    id: string
    name: string
    description: string
    occasion: string
    season: string
    share_count: number
    created_at: string
    user_profiles: {
      first_name: string
      last_name: string
      avatar_url?: string
    }
    outfit_items: Array<{
      category: string
      item_type: "wardrobe" | "product"
      wardrobe_items?: { name: string; image_url: string }
      products?: { name: string; image_url: string }
    }>
    outfit_likes: Array<any>
  }
}

export function OutfitShareCard({ outfit }: OutfitShareCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(outfit.outfit_likes?.length || 0)

  const handleLike = async () => {
    try {
      const response = await fetch("/api/outfits/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfit_id: outfit.id }),
      })

      if (response.ok) {
        setLiked(!liked)
        setLikeCount(liked ? likeCount - 1 : likeCount + 1)
      }
    } catch (error) {
      console.error("Error liking outfit:", error)
    }
  }

  const getItemImage = (item: any) => {
    if (item.item_type === "wardrobe" && item.wardrobe_items) {
      return item.wardrobe_items.image_url
    }
    if (item.item_type === "product" && item.products) {
      return item.products.image_url
    }
    return "/placeholder.svg"
  }

  const getItemName = (item: any) => {
    if (item.item_type === "wardrobe" && item.wardrobe_items) {
      return item.wardrobe_items.name
    }
    if (item.item_type === "product" && item.products) {
      return item.products.name
    }
    return "Unknown Item"
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={outfit.user_profiles.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {outfit.user_profiles.first_name} {outfit.user_profiles.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{new Date(outfit.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Outfit Preview */}
        <div className="p-4">
          <h3 className="font-semibold mb-2">{outfit.name}</h3>
          {outfit.description && <p className="text-sm text-muted-foreground mb-3">{outfit.description}</p>}

          <div className="flex gap-2 mb-4">
            {outfit.occasion && (
              <Badge variant="secondary" className="text-xs">
                {outfit.occasion}
              </Badge>
            )}
            {outfit.season && (
              <Badge variant="outline" className="text-xs">
                {outfit.season}
              </Badge>
            )}
          </div>

          {/* Outfit Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {outfit.outfit_items.slice(0, 4).map((item, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={getItemImage(item) || "/placeholder.svg"}
                  alt={getItemName(item)}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-1 left-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-1">
                <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                <span className="text-sm">{likeCount}</span>
              </Button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Share className="h-4 w-4" />
                <span>{outfit.share_count}</span>
              </div>
            </div>

            <SocialShareButtons
              url={`/outfits/${outfit.id}`}
              title={`Check out this ${outfit.name} outfit on MANUS`}
              description={outfit.description || `A ${outfit.occasion} outfit for ${outfit.season}`}
              hashtags={["MANUS", "mensfashion", "outfit", outfit.occasion, outfit.season].filter(Boolean)}
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
