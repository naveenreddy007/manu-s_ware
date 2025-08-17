"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductTagger } from "@/components/inspiration/product-tagger"
import Link from "next/link"

interface ProductTag {
  id: string
  product: {
    id: string
    name: string
    price: number
    images: string[]
    brand: string
    category: string
    color: string
    stock_quantity: number
  }
  x: number
  y: number
  imageIndex: number
}

interface ImageData {
  file?: File
  preview: string
  tags: ProductTag[]
  isExisting?: boolean
  url?: string
}

interface PostData {
  id: string
  title: string
  description: string
  images: ImageData[]
  isPublic: boolean
  styleTags: string[]
  occasionTags: string[]
}

export default function EditInspirationPage() {
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<PostData>({
    id: "",
    title: "",
    description: "",
    images: [],
    isPublic: true,
    styleTags: [],
    occasionTags: [],
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Load the main post
      const { data: postData, error: postError } = await supabase
        .from("outfit_inspiration_posts")
        .select("*")
        .eq("id", postId)
        .eq("user_id", user.id) // Ensure user owns this post
        .single()

      if (postError || !postData) {
        throw new Error("Post not found or you don't have permission to edit it")
      }

      // Load product tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("inspiration_product_tags")
        .select(`
          *,
          products (
            id, name, price, images, brand, category, color, stock_quantity
          )
        `)
        .eq("inspiration_id", postId)

      if (tagsError) {
        console.error("Error loading tags:", tagsError)
      }

      // Create the main image with tags
      const mainImage: ImageData = {
        preview: postData.image_url,
        url: postData.image_url,
        isExisting: true,
        tags: (tagsData || []).map((tag: any) => ({
          id: tag.id,
          product: tag.products,
          x: tag.x_position,
          y: tag.y_position,
          imageIndex: 0,
        })),
      }

      setPost({
        id: postData.id,
        title: postData.title || "",
        description: postData.description || "",
        images: [mainImage],
        isPublic: postData.is_public,
        styleTags: postData.style_tags || [],
        occasionTags: postData.occasion_tags || [],
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      if (post.images.length >= 5) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: ImageData = {
          file,
          preview: e.target?.result as string,
          tags: [],
          isExisting: false,
        }
        setPost((prev) => ({
          ...prev,
          images: [...prev.images, newImage],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    if (index === 0) {
      setError("Cannot remove the main image. You can replace it by uploading a new one.")
      return
    }

    setPost((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
    if (currentImageIndex >= post.images.length - 1) {
      setCurrentImageIndex(Math.max(0, post.images.length - 2))
    }
  }

  const updateCurrentImageTags = (tags: ProductTag[]) => {
    setPost((prev) => ({
      ...prev,
      images: prev.images.map((img, index) =>
        index === currentImageIndex
          ? { ...img, tags: tags.map((tag) => ({ ...tag, imageIndex: currentImageIndex })) }
          : img,
      ),
    }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post.title || post.images.length === 0) return

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Starting inspiration post update...")

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Please log in to update inspiration posts")
      }

      // Upload new images if any
      const uploadedImages: string[] = []
      for (let i = 0; i < post.images.length; i++) {
        const image = post.images[i]

        if (image.isExisting && image.url) {
          // Keep existing image
          uploadedImages.push(image.url)
        } else if (image.file) {
          // Upload new image
          const fileExt = image.file.name.split(".").pop()
          const fileName = `inspiration/${user.id}/${Date.now()}-${i}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, image.file)

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from("images").getPublicUrl(fileName)

          uploadedImages.push(publicUrl)
        }
      }

      console.log("[v0] Images processed, updating inspiration post...")

      // Update the main post
      const { error: updateError } = await supabase
        .from("outfit_inspiration_posts")
        .update({
          title: post.title,
          description: post.description,
          image_url: uploadedImages[0], // Main image
          is_public: post.isPublic,
          style_tags: post.styleTags,
          occasion_tags: post.occasionTags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)

      if (updateError) {
        console.error("[v0] Update error:", updateError)
        throw new Error(`Failed to update post: ${updateError.message}`)
      }

      // Delete existing product tags
      await supabase.from("inspiration_product_tags").delete().eq("inspiration_id", postId)

      // Insert updated product tags
      const allTags = post.images.flatMap((img, imgIndex) =>
        img.tags.map((tag) => ({
          inspiration_id: postId,
          product_id: tag.product.id,
          x_position: tag.x,
          y_position: tag.y,
        })),
      )

      if (allTags.length > 0) {
        const { error: tagsError } = await supabase.from("inspiration_product_tags").insert(allTags)

        if (tagsError) {
          console.error("[v0] Tags error:", tagsError)
        } else {
          console.log("[v0] Product tags updated successfully")
        }
      }

      console.log("[v0] Inspiration post updated successfully!")
      setSuccess("Inspiration post updated successfully!")

      setTimeout(() => {
        router.push("/inspiration?tab=my-posts")
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error updating inspiration post:", error)
      setError(error.message || "Failed to update inspiration post")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const currentImage = post.images[currentImageIndex]
  const totalTags = post.images.reduce((sum, img) => sum + img.tags.length, 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/inspiration?tab=my-posts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Posts
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Edit Your Style Post</h1>
        <p className="text-muted-foreground">Update your outfit inspiration and product tags</p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-green-500">
          <CardContent className="pt-6">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Outfit Details
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPost((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
              >
                {post.isPublic ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {post.isPublic ? "Public" : "Private"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={post.title}
                onChange={(e) => setPost((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Give your outfit a catchy title..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={post.description}
                onChange={(e) => setPost((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your style, occasion, or inspiration..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Outfit Photos ({post.images.length}/5)
              {totalTags > 0 && (
                <Badge variant="secondary">
                  {totalTags} product{totalTags !== 1 ? "s" : ""} tagged
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {post.images.map((img, index) => (
                  <div key={index} className="relative">
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? "border-primary" : "border-muted"
                      }`}
                    >
                      <img
                        src={img.preview || img.url || "/placeholder.svg"}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {img.tags.length > 0 && (
                      <Badge className="absolute -bottom-2 -right-2 text-xs px-1 py-0">{img.tags.length}</Badge>
                    )}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {post.images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </button>
                )}
              </div>

              {currentImage && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Image {currentImageIndex + 1} - Product Tagging</h3>
                    <p className="text-sm text-muted-foreground">Click on products in the image to tag them</p>
                  </div>
                  <ProductTagger
                    imageUrl={currentImage.preview || currentImage.url || ""}
                    tags={currentImage.tags}
                    onTagsChange={updateCurrentImageTags}
                    isEditing={true}
                  />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !post.title || post.images.length === 0} className="flex-1">
            {loading ? "Updating..." : "Update Inspiration"}
          </Button>
          <Link href="/inspiration?tab=my-posts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
