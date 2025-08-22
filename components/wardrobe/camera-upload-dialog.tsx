"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Camera, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

interface CameraUploadDialogProps {
  onAdd: (item: any) => void
  categories: string[]
}

export function CameraUploadDialog({ onAdd, categories }: CameraUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    color: "",
    size: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)

  const compressImage = (canvas: HTMLCanvasElement, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `wardrobe-item-${Date.now()}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(file)
          }
        },
        "image/jpeg",
        quality,
      )
    })
  }

  const processImage = async (file: File) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = async () => {
      try {
        const maxSize = 1024
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8)
          setImage(compressedDataUrl)

          const compressedFile = await compressImage(canvas, 0.8)
          setCompressedFile(compressedFile)

          analyzeImage(compressedDataUrl)
        }
      } catch (error) {
        console.error("Error processing image:", error)
        alert("Failed to process image. Please try again.")
      }
    }

    img.onerror = () => {
      alert("Failed to load image. Please select a valid image file.")
    }

    img.src = URL.createObjectURL(file)
  }

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processImage(file)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processImage(file)
    }
  }

  const analyzeImage = async (imageDataUrl: string) => {
    setAnalyzing(true)
    try {
      const response = await fetch("/api/wardrobe/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      })

      if (response.ok) {
        const analysis = await response.json()
        setFormData({
          name: analysis.name || "",
          category: analysis.category || "",
          brand: analysis.brand || "",
          color: analysis.color || "",
          size: analysis.size || "",
        })
      }
    } catch (error) {
      console.error("Failed to analyze image:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compressedFile) return

    setUploading(true)
    try {
      console.log("[v0] Starting wardrobe item upload")

      const uploadFormData = new FormData()
      uploadFormData.append("file", compressedFile)

      const uploadResponse = await fetch("/api/wardrobe/upload-image", {
        method: "POST",
        body: uploadFormData,
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResponse.ok) {
        console.error("[v0] Upload failed:", uploadResult)
        alert(`Upload failed: ${uploadResult.details || uploadResult.error}`)
        return
      }

      console.log("[v0] Image uploaded successfully:", uploadResult.imageUrl)

      const response = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image_url: uploadResult.imageUrl }),
      })

      if (response.ok) {
        const { item } = await response.json()
        console.log("[v0] Wardrobe item created:", item)
        onAdd(item)
        setOpen(false)
        setImage(null)
        setCompressedFile(null)
        setFormData({ name: "", category: "", brand: "", color: "", size: "" })
      } else {
        const errorData = await response.json()
        console.error("[v0] Failed to create wardrobe item:", errorData)
        alert(`Failed to create item: ${errorData.error}`)
      }
    } catch (error) {
      console.error("[v0] Failed to upload item:", error)
      alert("Failed to upload item. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const resetDialog = () => {
    setImage(null)
    setCompressedFile(null)
    setFormData({ name: "", category: "", brand: "", color: "", size: "" })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Item with Camera</DialogTitle>
          <DialogDescription>Take a photo or upload an image to add to your wardrobe</DialogDescription>
        </DialogHeader>

        {!image && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => cameraInputRef.current?.click()} className="flex-col h-20">
                <Camera className="h-6 w-6 mb-2" />
                Take Photo
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-col h-20">
                <Upload className="h-6 w-6 mb-2" />
                Upload Image
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>
        )}

        {image && (
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={image || "/placeholder.svg"} alt="Captured item" fill className="object-cover" />
            </div>

            {analyzing && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Analyzing image...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Navy Blazer"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="capitalize">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., MANUS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Navy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., M, 32"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetDialog} className="flex-1 bg-transparent">
                  Retake
                </Button>
                <Button type="submit" disabled={uploading} className="flex-1 bg-primary hover:bg-primary/90">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
