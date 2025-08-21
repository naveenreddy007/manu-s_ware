"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WardrobeCompatibility } from "@/components/product/wardrobe-compatibility"
import { StylingSuggestions } from "@/components/product/styling-suggestions"
import { ProductReviews } from "@/components/product/product-reviews"
import { ProductSpecifications } from "@/components/product/product-specifications"
import { AccessoryRecommendations } from "@/components/product/accessory-recommendations"
import { WishlistButton } from "@/components/wishlist/wishlist-button"
import { SocialShareButtons } from "@/components/social/social-share-buttons"
import { ArrowLeft, ShoppingBag, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import type { Product } from "@/lib/types/database"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [wardrobeCompatibility, setWardrobeCompatibility] = useState<any>(null)
  const [stylingRecommendations, setStylingRecommendations] = useState<any[]>([])
  const [accessoryRecommendations, setAccessoryRecommendations] = useState<any[]>([])
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchProduct()
    fetchCartCount()
  }, [params.id])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
        setWardrobeCompatibility(data.wardrobe_compatibility)
        setStylingRecommendations(data.styling_recommendations || [])
        setAccessoryRecommendations(data.accessory_recommendations || [])

        // Set default size based on user preferences or first available
        if (data.product.sizes && data.product.sizes.length > 0) {
          // TODO: Get user's preferred size from profile
          setSelectedSize(data.product.sizes[0])
        }
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchCartCount = async () => {
    if (!user) return
    try {
      const response = await fetch("/api/cart/count")
      if (response.ok) {
        const data = await response.json()
        setCartItemCount(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
    }
  }

  const addToCart = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!selectedSize) {
      toast({
        title: "Size required",
        description: "Please select a size before adding to cart",
        variant: "destructive",
      })
      return
    }

    setAddingToCart(true)
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product?.id,
          size: selectedSize,
          quantity: 1,
        }),
      })

      if (response.ok) {
        setCartItemCount((prev) => prev + 1)

        toast({
          title: "Added to cart",
          description: `${product?.name} has been added to your cart`,
        })

        // Trigger cart update event for other components
        window.dispatchEvent(new CustomEvent("cartUpdated"))
      } else {
        throw new Error("Failed to add to cart")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const handleShare = async (platform: string) => {
    if (user && product) {
      try {
        await fetch("/api/social/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_type: "product",
            item_id: product.id,
            platform,
          }),
        })
      } catch (error) {
        console.error("Error tracking share:", error)
      }
    }
  }

  const nextImage = () => {
    if (product && product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product && product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-heading font-black text-primary">MANUS</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden group">
              <Image
                src={
                  product.images[selectedImageIndex] ||
                  "/placeholder.svg?height=600&width=480&query=premium menswear product"
                }
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === selectedImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {product.category}
                </Badge>
                <Badge className="bg-accent text-accent-foreground">New</Badge>
                {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                  <Badge variant="destructive">Only {product.stock_quantity} left</Badge>
                )}
              </div>
              <h1 className="text-3xl font-heading font-black text-foreground">{product.name}</h1>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(product.price)}</p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Size Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Size</label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock Status */}
            {product.stock_quantity === 0 ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">Out of Stock</p>
                <p className="text-sm text-muted-foreground">This item is currently unavailable</p>
              </div>
            ) : (
              /* Actions */
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={addToCart}
                  disabled={!selectedSize || addingToCart || product.stock_quantity === 0}
                >
                  {addingToCart ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ShoppingBag className="h-4 w-4 mr-2" />
                  )}
                  Add to Cart
                </Button>
                <WishlistButton productId={product.id} variant="outline" size="lg" />
                <SocialShareButtons
                  url={`/products/${product.id}`}
                  title={`Check out this ${product.name} from MANUS`}
                  description={product.description}
                  image={product.images[0]}
                  hashtags={["MANUS", "mensfashion", product.category, ...(product.tags || [])]}
                  variant="outline"
                  size="lg"
                />
              </div>
            )}

            {/* Product Features */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-foreground">Premium materials and construction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-foreground">Designed for versatility and style</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-foreground">Free shipping and returns</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Style Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {accessoryRecommendations.length > 0 && (
          <div className="mb-16">
            <AccessoryRecommendations recommendations={accessoryRecommendations} productName={product.name} />
          </div>
        )}

        {/* Product Specifications */}
        <div className="mb-16">
          <ProductSpecifications category={product.category} />
        </div>

        {/* Wardrobe Integration Section */}
        {user && wardrobeCompatibility && (
          <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WardrobeCompatibility
              totalItems={wardrobeCompatibility.total_items}
              compatibleItems={wardrobeCompatibility.compatible_items}
              compatibilityScore={wardrobeCompatibility.compatibility_score}
            />

            {stylingRecommendations.length > 0 && (
              <StylingSuggestions suggestions={stylingRecommendations} productName={product.name} />
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-16">
          <ProductReviews productId={product.id} />
        </div>

        {/* Call to Action for Non-Users */}
        {!user && (
          <div className="mt-16">
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">See How This Fits Your Wardrobe</h3>
                <p className="text-muted-foreground mb-6">
                  Create an account to see personalized styling suggestions and wardrobe compatibility
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/auth/sign-up">Create Account</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
