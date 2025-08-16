"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Loader2 } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/types/database"

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAddingToCart(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to your cart.",
          variant: "destructive",
        })
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          size: "M", // Default size - could be made dynamic
          quantity: 1,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add to cart")
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("Add to cart error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <Card className="group overflow-hidden border-0 bg-card hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <ImageWithFallback
            src={product.images?.[0] || "/placeholder.svg?height=400&width=300&query=premium menswear product"}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        {product.tags?.includes("new") && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">New</Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-heading font-bold text-card-foreground line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-card-foreground">${product.price}</p>
            <div className="flex gap-1">
              {product.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/products/${product.id}`}>View</Link>
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ShoppingBag className="h-4 w-4 mr-1" />
              )}
              {isAddingToCart ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
