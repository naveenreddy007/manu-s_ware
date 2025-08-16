"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ProductRecommendationCard } from "@/components/recommendations/product-recommendation-card"
import { OutfitRecommendationCard } from "@/components/recommendations/outfit-recommendation-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Sparkles, Filter, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProductRecommendation {
  product: any
  reason: string
  confidence_score: number
  complements: any[]
}

interface OutfitRecommendation {
  id: string
  name: string
  occasion: string
  confidence_score: number
  wardrobe_items: any[]
  recommended_products: any[]
  styling_notes: string
}

export default function RecommendationsPage() {
  const [productRecommendations, setProductRecommendations] = useState<ProductRecommendation[]>([])
  const [outfitRecommendations, setOutfitRecommendations] = useState<OutfitRecommendation[]>([])
  const [activeTab, setActiveTab] = useState<"products" | "outfits">("products")
  const [selectedOccasion, setSelectedOccasion] = useState("all")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const occasions = ["all", "casual", "professional", "formal", "smart-casual"]

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchRecommendations()
    }
  }, [user, activeTab, selectedOccasion])

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

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeTab,
        ...(selectedOccasion !== "all" && { occasion: selectedOccasion }),
      })

      const response = await fetch(`/api/recommendations?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (activeTab === "products") {
          setProductRecommendations(data.recommendations || [])
        } else {
          setOutfitRecommendations(data.recommendations || [])
        }
      } else if (response.status === 401) {
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error)
    } finally {
      setLoading(false)
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
                <h1 className="text-xl font-heading font-black text-primary">AI Recommendations</h1>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={fetchRecommendations} disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-1 border border-border rounded-md p-1">
            <Button
              variant={activeTab === "products" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("products")}
              className="text-sm"
            >
              Product Matches
            </Button>
            <Button
              variant={activeTab === "outfits" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("outfits")}
              className="text-sm"
            >
              Complete Outfits
            </Button>
          </div>

          {/* Occasion Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {occasions.map((occasion) => (
                <Badge
                  key={occasion}
                  variant={selectedOccasion === occasion ? "default" : "outline"}
                  className={`cursor-pointer transition-colors capitalize ${
                    selectedOccasion === occasion
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedOccasion(occasion)}
                >
                  {occasion}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-[3/4] rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "products" ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground">Products Perfect for Your Wardrobe</h2>
              <p className="text-muted-foreground">{productRecommendations.length} recommendations</p>
            </div>

            {productRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productRecommendations.map((rec, index) => (
                  <ProductRecommendationCard key={index} {...rec} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No product recommendations available. Add more items to your wardrobe to get better suggestions.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/wardrobe">Manage Wardrobe</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground">Complete Outfit Ideas</h2>
              <p className="text-muted-foreground">{outfitRecommendations.length} outfits</p>
            </div>

            {outfitRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outfitRecommendations.map((outfit) => (
                  <OutfitRecommendationCard key={outfit.id} {...outfit} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No outfit recommendations available. Add more items to your wardrobe to get complete outfit
                  suggestions.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/wardrobe">Manage Wardrobe</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
