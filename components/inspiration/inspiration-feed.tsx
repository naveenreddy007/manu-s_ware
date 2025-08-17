"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Bookmark, ShoppingBag, Share2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface InspirationPost {
  id: string
  title: string
  description: string
  image_url: string
  additional_images?: string[]
  user_id: string
  created_at: string
  creator_name: string
  tags: string[]
  items: {
    id: string
    product_id: string
    product_name: string
    product_price: number
    position_x: number
    position_y: number
    image_index?: number
  }[]
}

export function InspirationFeed() {
  const [posts, setPosts] = useState<InspirationPost[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [postId: string]: number }>({})
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data: inspirationData, error } = await supabase
        .from("outfit_inspirations")
        .select(`
          *,
          outfit_inspiration_items (
            id,
            product_id,
            position_x,
            position_y,
            products (
              id,
              name,
              price,
              images
            )
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching inspiration posts:", error)
        return
      }

      const userIds = inspirationData?.map((post) => post.user_id) || []
      const { data: userProfiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds)

      const userProfileMap = new Map(
        userProfiles?.map((profile) => [
          profile.user_id,
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Anonymous User",
        ]) || [],
      )

      const transformedPosts =
        inspirationData?.map((post) => {
          const productItems = post.outfit_inspiration_items || []

          return {
            id: post.id,
            title: post.title,
            description: post.description || "",
            image_url: post.image_url,
            additional_images: [], // No additional images stored in outfit_inspiration_items
            user_id: post.user_id,
            created_at: post.created_at,
            creator_name: userProfileMap.get(post.user_id) || "Anonymous User",
            tags: post.tags || [],
            items: productItems.map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.products?.name || "Unknown Product",
              product_price: item.products?.price || 0,
              position_x: item.position_x,
              position_y: item.position_y,
              image_index: 0, // All tags are on the main image
            })),
          }
        }) || []

      setPosts(transformedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const isLiked = likedPosts.has(postId)

      if (isLiked) {
        await supabase.from("inspiration_likes").delete().eq("user_id", user.user.id).eq("inspiration_id", postId)
      } else {
        await supabase.from("inspiration_likes").insert({
          user_id: user.user.id,
          inspiration_id: postId,
        })
      }

      setLikedPosts((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(postId)) {
          newSet.delete(postId)
        } else {
          newSet.add(postId)
        }
        return newSet
      })
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleSave = async (postId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const isSaved = savedPosts.has(postId)

      if (isSaved) {
        await supabase.from("inspiration_saves").delete().eq("user_id", user.user.id).eq("inspiration_id", postId)
      } else {
        await supabase.from("inspiration_saves").insert({
          user_id: user.user.id,
          inspiration_id: postId,
        })
      }

      setSavedPosts((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(postId)) {
          newSet.delete(postId)
        } else {
          newSet.add(postId)
        }
        return newSet
      })
    } catch (error) {
      console.error("Error toggling save:", error)
    }
  }

  const navigateImage = (postId: string, direction: "prev" | "next") => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const totalImages = 1 + (post.additional_images?.length || 0)
    const currentIndex = currentImageIndex[postId] || 0

    let newIndex = currentIndex
    if (direction === "next") {
      newIndex = (currentIndex + 1) % totalImages
    } else {
      newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1
    }

    setCurrentImageIndex((prev) => ({ ...prev, [postId]: newIndex }))
  }

  const getCurrentImage = (post: InspirationPost) => {
    const index = currentImageIndex[post.id] || 0
    if (index === 0) return post.image_url
    return post.additional_images?.[index - 1] || post.image_url
  }

  const getCurrentImageItems = (post: InspirationPost) => {
    const currentIndex = currentImageIndex[post.id] || 0
    return post.items.filter((item) => (item.image_index || 0) === currentIndex)
  }

  const handleAddToCart = async (productId: string, productName: string, price: number) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        alert("Please sign in to add items to cart")
        return
      }

      console.log("[v0] Adding product to cart:", { productId, productName, price })

      const { error } = await supabase.from("cart_items").insert({
        user_id: user.user.id,
        product_id: productId,
        quantity: 1,
        size: "M", // Default size - could be enhanced with size selector
      })

      if (error) {
        console.error("[v0] Cart error:", error)
        alert("Error adding item to cart")
        return
      }

      alert(`Added ${productName} to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert("Error adding item to cart")
    }
  }

  const handleShopLook = async (post: InspirationPost) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        alert("Please sign in to shop this look")
        return
      }

      let addedCount = 0
      for (const item of post.items) {
        try {
          await supabase.from("cart_items").insert({
            user_id: user.user.id,
            product_id: item.product_id,
            quantity: 1,
            size: "M", // Default size
          })
          addedCount++
        } catch (error) {
          console.error(`Error adding ${item.product_name} to cart:`, error)
        }
      }

      if (addedCount > 0) {
        alert(`Added ${addedCount} items to cart!`)
      } else {
        alert("No items could be added to cart")
      }
    } catch (error) {
      console.error("Error shopping look:", error)
      alert("Error adding items to cart")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-muted rounded-lg mb-4" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const totalImages = 1 + (post.additional_images?.length || 0)
        const currentIndex = currentImageIndex[post.id] || 0
        const currentImage = getCurrentImage(post)
        const currentItems = getCurrentImageItems(post)

        return (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {post.creator_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.creator_name}</p>
                    <p className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative group">
                <img src={currentImage || "/placeholder.svg"} alt={post.title} className="w-full h-auto" />

                {totalImages > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigateImage(post.id, "prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigateImage(post.id, "next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {Array.from({ length: totalImages }).map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {currentItems?.map((item, index) => (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ left: `${item.position_x}%`, top: `${item.position_y}%` }}
                    onClick={() => handleAddToCart(item.product_id, item.product_name, item.product_price)}
                  >
                    <div className="w-4 h-4 bg-white border-2 border-black rounded-full animate-pulse hover:scale-110 transition-transform" />
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap hover:bg-gray-800">
                      {item.product_name} - ${item.product_price}
                      <div className="text-xs opacity-75">Click to add to cart</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={likedPosts.has(post.id) ? "text-red-500" : ""}
                    >
                      <Heart className={`h-5 w-5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(post.id)}
                      className={savedPosts.has(post.id) ? "text-blue-500" : ""}
                    >
                      <Bookmark className={`h-5 w-5 ${savedPosts.has(post.id) ? "fill-current" : ""}`} />
                    </Button>

                    <Button variant="ghost" size="sm">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {post.items?.length > 0 && (
                    <Button onClick={() => handleShopLook(post)} className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Shop Look ({post.items.length} items)
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">{post.title}</h3>
                  {post.description && <p className="text-muted-foreground">{post.description}</p>}

                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {posts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No inspiration posts yet</p>
            <Link href="/inspiration/create">
              <Button>Create First Post</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
