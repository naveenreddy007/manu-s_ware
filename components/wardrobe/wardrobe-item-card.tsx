"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar } from "lucide-react"
import type { WardrobeItem } from "@/lib/types/database"

interface WardrobeItemCardProps {
  item: WardrobeItem
  onEdit?: (item: WardrobeItem) => void
  onDelete?: (item: WardrobeItem) => void
}

export function WardrobeItemCard({ item, onEdit, onDelete }: WardrobeItemCardProps) {
  return (
    <Card className="group overflow-hidden border-0 bg-card hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={item.image_url || `/placeholder.svg?height=400&width=300&query=${item.category} ${item.color}`}
          alt={item.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
          {onEdit && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-white/90 hover:bg-white"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-white/90 hover:bg-white"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Badge className="absolute top-2 left-2 bg-muted text-muted-foreground capitalize">{item.category}</Badge>
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="space-y-1">
          <h3 className="font-medium text-card-foreground line-clamp-1">{item.name}</h3>
          {item.brand && <p className="text-sm text-muted-foreground">{item.brand}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {item.color && (
              <Badge variant="outline" className="text-xs capitalize">
                {item.color}
              </Badge>
            )}
            {item.size && (
              <Badge variant="outline" className="text-xs">
                {item.size}
              </Badge>
            )}
          </div>

          {item.purchase_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(item.purchase_date).getFullYear()}
            </div>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
