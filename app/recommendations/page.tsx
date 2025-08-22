"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import AddToCartButton from "@/components/product/add-to-cart-button"

interface WardrobeItem {
  id: string
  name: string
  category: string
  color: string
  image_url: string
  style?: string
  pattern?: string
  material?: string
  occasion?: string
  season?: string
  fit?: string
  neckline?: string
  sleeve_length?: string
  formality_score?: number
}

interface Product {
  id: string
  name: string
  category: string
  color: string
  price: number
  images: string[]
  style?: string
  pattern?: string
  material?: string
  occasion?: string
  season?: string
  fit?: string
  neckline?: string
  sleeve_length?: string
  formality_score?: number
}

export default function RecommendationsPage() {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null)
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Category compatibility mapping
  const categoryCompatibility: Record<string, string[]> = {
    tops: ["bottoms", "outerwear", "accessories"],
    bottoms: ["tops", "outerwear", "accessories", "footwear"],
    dresses: ["outerwear", "accessories", "footwear"],
    outerwear: ["tops", "bottoms", "dresses", "accessories"],
    footwear: ["bottoms", "dresses", "accessories"],
    accessories: ["tops", "bottoms", "dresses", "outerwear", "footwear"],
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchWardrobeItems()
    }
  }, [user])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUser(user)
  }

  const fetchWardrobeItems = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setWardrobeItems(data || [])
    } catch (error) {
      console.error("Failed to fetch wardrobe items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelect = async (item: WardrobeItem) => {
    setSelectedItem(item)
    setAiLoading(true)
    setRecommendedProducts([])

    try {
      const compatibleCategories = categoryCompatibility[item.category.toLowerCase()] || []

      const supabase = createClient()
      const { data: candidateProducts, error } = await supabase
        .from("products")
        .select("*")
        .in("category", compatibleCategories)
        .limit(20)

      if (error) throw error

      if (!candidateProducts || candidateProducts.length === 0) {
        setRecommendedProducts([])
        return
      }

      const response = await fetch("/api/recommendations/rank-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryItem: item,
          candidateItems: candidateProducts,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI recommendations")
      }

      const { ranked_ids } = await response.json()

      const rankedProducts = ranked_ids
        .map((id: string) => candidateProducts.find((p) => p.id === id))
        .filter(Boolean)
        .slice(0, 5)

      setRecommendedProducts(rankedProducts)
    } catch (error) {
      console.error("Failed to get recommendations:", error)
      setRecommendedProducts([])
    } finally {
      setAiLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/wardrobe">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-heading font-black text-primary">AI Outfit Stylist</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            Get AI-Powered Outfit Recommendations
          </h2>
          <p className="text-muted-foreground">
            Select an item from your wardrobe to discover perfectly matched products styled by AI
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Your Wardrobe</h3>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-square rounded-lg mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : wardrobeItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {wardrobeItems.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedItem?.id === item.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square relative mb-2 rounded-md overflow-hidden">
                      <Image
                        src={item.image_url || "/placeholder.svg?height=150&width=150"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {item.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No wardrobe items found. Add items to your wardrobe to get recommendations.
              </p>
              <Button variant="outline" asChild>
                <Link href="/wardrobe">Add Wardrobe Items</Link>
              </Button>
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="border-t pt-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Styled Recommendations for "{selectedItem.name}"</h3>
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">AI is analyzing your style...</p>
                </div>
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {recommendedProducts.map((product, index) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] relative mb-3 rounded-md overflow-hidden">
                        <Image
                          src={product.images?.[0] || "/placeholder.svg?height=300&width=200"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                          #{index + 1} Match
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h4>
                      <p className="text-lg font-bold text-primary mb-2">₹{product.price}</p>
                      <div className="flex gap-1 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.style && (
                          <Badge variant="outline" className="text-xs">
                            {product.style}
                          </Badge>
                        )}
                      </div>
                      <AddToCartButton product={product} size="sm" className="w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No compatible products found for this wardrobe item.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
