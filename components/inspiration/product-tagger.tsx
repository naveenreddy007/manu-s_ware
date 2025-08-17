"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, X, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils/currency"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  brand: string
  category: string
  color: string
  stock_quantity: number
}

interface ProductTag {
  id: string
  product: Product
  x: number
  y: number
}

interface ProductTaggerProps {
  imageUrl: string
  tags: ProductTag[]
  onTagsChange: (tags: ProductTag[]) => void
  isEditing?: boolean
}

export function ProductTagger({ imageUrl, tags, onTagsChange, isEditing = false }: ProductTaggerProps) {
  const [isTagging, setIsTagging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts(searchQuery)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchProducts = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products || [])
      } else {
        console.error("Failed to fetch products")
        setSearchResults([])
      }
    } catch (error) {
      console.error("Error searching products:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isTagging || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setPendingPosition({ x, y })
    setShowSearch(true)
    setSearchQuery("")
  }

  const handleProductSelect = (product: Product) => {
    if (!pendingPosition) return

    const newTag: ProductTag = {
      id: `tag-${Date.now()}`,
      product,
      x: pendingPosition.x,
      y: pendingPosition.y,
    }

    onTagsChange([...tags, newTag])
    setPendingPosition(null)
    setShowSearch(false)
    setIsTagging(false)
    setSearchQuery("")
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(tags.filter((tag) => tag.id !== tagId))
  }

  return (
    <div className="relative">
      {/* Image with tags */}
      <div className="relative inline-block">
        <img
          ref={imageRef}
          src={imageUrl || "/placeholder.svg"}
          alt="Outfit inspiration"
          className={cn("max-w-full h-auto rounded-lg", isTagging && "cursor-crosshair")}
          onClick={handleImageClick}
        />

        {/* Product tags */}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                <Plus className="w-3 h-3" />
              </div>

              {/* Product info tooltip */}
              <Card className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {tag.product.images?.[0] && (
                      <img
                        src={tag.product.images[0] || "/placeholder.svg"}
                        alt={tag.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{tag.product.name}</p>
                      <p className="text-xs text-muted-foreground">{tag.product.brand}</p>
                      <p className="font-semibold text-sm">{formatPrice(tag.product.price)}</p>
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-2 w-full pointer-events-auto"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}

        {/* Pending tag position */}
        {pendingPosition && (
          <div
            className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: `${pendingPosition.x}%`, top: `${pendingPosition.y}%` }}
          />
        )}
      </div>

      {/* Controls */}
      {isEditing && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setIsTagging(!isTagging)} variant={isTagging ? "default" : "outline"} size="sm">
            <Tag className="w-4 h-4 mr-2" />
            {isTagging ? "Cancel Tagging" : "Add Product Tag"}
          </Button>

          {tags.length > 0 && (
            <Badge variant="secondary">
              {tags.length} product{tags.length !== 1 ? "s" : ""} tagged
            </Badge>
          )}
        </div>
      )}

      {/* Product search modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Tag a Product</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowSearch(false)
                    setPendingPosition(null)
                    setIsTagging(false)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading && <div className="text-center py-4 text-muted-foreground">Searching products...</div>}

                {!loading && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="text-center py-4 text-muted-foreground">No products found</div>
                )}

                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleProductSelect(product)}
                  >
                    {product.images?.[0] && (
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="font-semibold text-sm">{formatPrice(product.price)}</p>
                        <Badge variant="outline" className="text-xs">
                          {product.stock_quantity} in stock
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
