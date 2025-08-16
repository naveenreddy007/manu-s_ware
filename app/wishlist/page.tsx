"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WishlistButton } from "@/components/wishlist/wishlist-button"
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WishlistItem {
  id: string
  created_at: string
  product: {
    id: string
    name: string
    price: number
    images: string[]
    category: string
    description: string
  }
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchWishlist()
  }, [])

  const checkAuthAndFetchWishlist = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login?redirect=/wishlist")
      return
    }

    setUser(user)
    await fetchWishlist()
  }

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist")
      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemRemoved = (productId: string) => {
    setWishlistItems(wishlistItems.filter((item) => item.product.id !== productId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-black text-foreground flex items-center gap-2">
                <Heart className="h-8 w-8 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved for later
              </p>
            </div>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Save items you love by clicking the heart icon on any product. They'll appear here for easy access.
              </p>
              <Button asChild size="lg">
                <Link href="/">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Start Shopping
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={item.product.images[0] || "/placeholder.svg?height=400&width=300&query=product"}
                      alt={item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <WishlistButton
                        productId={item.product.id}
                        variant="ghost"
                        className="bg-white/80 hover:bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-heading font-bold text-foreground line-clamp-2">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{item.product.category}</p>
                      <p className="text-lg font-bold text-foreground">${item.product.price}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button asChild className="flex-1">
                        <Link href={`/products/${item.product.id}`}>View Product</Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/products/${item.product.id}`}>
                          <ShoppingBag className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
