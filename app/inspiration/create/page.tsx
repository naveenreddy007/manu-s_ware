"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Plus, Save, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductTagger } from "@/components/inspiration/product-tagger"

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
  file: File
  preview: string
  tags: ProductTag[]
}

interface DraftData {
  id?: string
  title: string
  description: string
  images: ImageData[]
  isPublic: boolean
  styleTags: string[]
  occasionTags: string[]
}

export default function CreateInspirationPage() {
  const [draft, setDraft] = useState<DraftData>({
    title: "",
    description: "",
    images: [],
    isPublic: true,
    styleTags: [],
    occasionTags: [],
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const interval = setInterval(() => {
      if (draft.title || draft.description || draft.images.length > 0) {
        saveDraftLocally(true) // Only save locally, never to database
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [draft])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      if (draft.images.length >= 5) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: ImageData = {
          file,
          preview: e.target?.result as string,
          tags: [],
        }
        setDraft((prev) => ({
          ...prev,
          images: [...prev.images, newImage],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
    if (currentImageIndex >= draft.images.length - 1) {
      setCurrentImageIndex(Math.max(0, draft.images.length - 2))
    }
  }

  const updateCurrentImageTags = (tags: ProductTag[]) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((img, index) =>
        index === currentImageIndex
          ? { ...img, tags: tags.map((tag) => ({ ...tag, imageIndex: currentImageIndex })) }
          : img,
      ),
    }))
  }

  const saveDraftLocally = async (silent = false) => {
    if (!silent) setSavingDraft(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (!silent) throw new Error("Please log in to save drafts")
        return
      }

      const draftData = {
        ...draft,
        userId: user.id,
        lastSaved: new Date().toISOString(),
        images: draft.images.map((img) => ({
          ...img,
          file: null, // Don't store file in localStorage
          preview: img.preview,
        })),
      }
      localStorage.setItem(`inspiration_draft_${user.id}`, JSON.stringify(draftData))

      if (!silent) {
        setSuccess("Draft saved locally!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (error: any) {
      if (!silent) setError(error.message)
    } finally {
      if (!silent) setSavingDraft(false)
    }
  }

  useEffect(() => {
    const loadDraft = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const savedDraft = localStorage.getItem(`inspiration_draft_${user.id}`)
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft)
          const lastSaved = new Date(parsedDraft.lastSaved)
          const now = new Date()
          if (now.getTime() - lastSaved.getTime() < 24 * 60 * 60 * 1000) {
            setDraft(parsedDraft)
          }
        } catch (error) {
          console.error("Error loading draft:", error)
        }
      }
    }
    loadDraft()
  }, [])

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title || draft.images.length === 0) return

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Starting inspiration post creation...")

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Please log in to create inspiration posts")
      }

      console.log("[v0] User authenticated, uploading images...")

      const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!
          const img = new Image()

          img.onload = () => {
            const maxWidth = 1200
            const maxHeight = 1200
            let { width, height } = img

            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height
                height = maxHeight
              }
            }

            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
              (blob) => {
                const compressedFile = new File([blob!], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              },
              "image/jpeg",
              0.8,
            )
          }

          img.src = URL.createObjectURL(file)
        })
      }

      const uploadedImages: string[] = []
      for (let i = 0; i < draft.images.length; i++) {
        const image = draft.images[i]

        const compressedFile = await compressImage(image.file)
        const fileExt = "jpg"
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

        try {
          const { data: buckets } = await supabase.storage.listBuckets()
          const imagesBucket = buckets?.find((bucket) => bucket.name === "images")

          if (!imagesBucket) {
            console.log("[v0] Creating images bucket...")
            const { error: bucketError } = await supabase.storage.createBucket("images", {
              public: true,
              allowedMimeTypes: ["image/*"],
              fileSizeLimit: 5242880, // 5MB
            })
            if (bucketError) {
              console.warn("[v0] Bucket creation warning:", bucketError.message)
            }
          }

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, compressedFile, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error("[v0] Upload error details:", uploadError)
            throw uploadError
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("images").getPublicUrl(fileName)

          uploadedImages.push(publicUrl)
          console.log(`[v0] Image ${i + 1} uploaded successfully to:`, publicUrl)
        } catch (uploadError: any) {
          console.error("[v0] Upload error:", uploadError)
          throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`)
        }
      }

      console.log("[v0] All images uploaded successfully, creating inspiration post...")

      const { data: postData, error: insertError } = await supabase
        .from("outfit_inspirations")
        .insert({
          user_id: user.id,
          title: draft.title,
          description: draft.description,
          image_url: uploadedImages[0],
          is_public: draft.isPublic,
          tags: [...draft.styleTags, ...draft.occasionTags],
        })
        .select()
        .single()

      if (insertError || !postData?.id) {
        console.error("[v0] Insert error:", insertError)
        throw new Error(`Failed to create post: ${insertError?.message || "No data returned"}`)
      }

      console.log("[v0] Post created successfully with ID:", postData.id)

      if (uploadedImages.length > 1) {
        const additionalImageItems = uploadedImages.slice(1).map((imageUrl, index) => ({
          inspiration_id: postData.id,
          product_id: null,
          position_x: 0,
          position_y: 0,
          image_url: imageUrl,
          item_type: "image",
        }))

        const { error: itemsError } = await supabase.from("outfit_inspiration_items").insert(additionalImageItems)

        if (itemsError) {
          console.error("[v0] Additional images error:", itemsError)
          // Don't throw error for additional images, just log it
        } else {
          console.log("[v0] Additional images stored successfully")
        }
      }

      const allTags = draft.images.flatMap((img, imgIndex) =>
        img.tags.map((tag) => ({
          inspiration_id: postData.id,
          product_id: tag.product.id,
          position_x: tag.x,
          position_y: tag.y,
          item_type: "product",
        })),
      )

      if (allTags.length > 0) {
        const { error: tagsError } = await supabase.from("outfit_inspiration_items").insert(allTags)

        if (tagsError) {
          console.error("[v0] Tags error:", tagsError)
          // Don't throw error for tags, just log it
        } else {
          console.log("[v0] Product tags added successfully")
        }
      }

      localStorage.removeItem(`inspiration_draft_${user.id}`)

      console.log("[v0] Inspiration post published successfully!")
      setSuccess("Inspiration post published successfully!")

      setTimeout(() => {
        router.push("/inspiration")
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error creating inspiration post:", error)
      setError(error.message || "Failed to create inspiration post")
    } finally {
      setLoading(false)
    }
  }

  const currentImage = draft.images[currentImageIndex]
  const totalTags = draft.images.reduce((sum, img) => sum + img.tags.length, 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Share Your Style</h1>
        <p className="text-muted-foreground">Create an outfit inspiration post and help others discover great style</p>
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

      <form onSubmit={handlePublish} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Outfit Details
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => saveDraftLocally()}
                  disabled={savingDraft}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingDraft ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraft((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
                >
                  {draft.isPublic ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  {draft.isPublic ? "Public" : "Private"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Give your outfit a catchy title..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your style, occasion, or inspiration..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Outfit Photos ({draft.images.length}/5)
              {totalTags > 0 && (
                <Badge variant="secondary">
                  {totalTags} product{totalTags !== 1 ? "s" : ""} tagged
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {draft.images.length === 0 ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Upload your outfit photos</p>
                <p className="text-sm text-muted-foreground">Click to browse or drag and drop (up to 5 images)</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Images will be staged locally for tagging - nothing uploads until you publish
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {draft.images.map((img, index) => (
                    <div key={index} className="relative">
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex ? "border-primary" : "border-muted"
                        }`}
                      >
                        <img
                          src={img.preview || "/placeholder.svg"}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      {img.tags.length > 0 && (
                        <Badge className="absolute -bottom-2 -right-2 text-xs px-1 py-0">{img.tags.length}</Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {draft.images.length < 5 && (
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
                      imageUrl={currentImage.preview}
                      tags={currentImage.tags}
                      onTagsChange={updateCurrentImageTags}
                      isEditing={true}
                    />
                  </div>
                )}
              </div>
            )}

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
          <Button type="submit" disabled={loading || !draft.title || draft.images.length === 0} className="flex-1">
            {loading ? "Publishing..." : "Publish Inspiration"}
          </Button>
          <Button type="button" variant="outline" onClick={() => saveDraftLocally()} disabled={savingDraft}>
            {savingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
