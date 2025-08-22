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

import imageCompression from "browser-image-compression"

interface CameraUploadDialogProps {
  onAdd: (item: any) => void
  categories: string[]
}

export function CameraUploadDialog({ onAdd, categories }: CameraUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    color: "",
    size: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)

  const processImage = async (file: File) => {
    if (!file) {
      alert("No file selected. Please try again.")
      return
    }

    console.log("[v0] Processing image file:", file.name, file.size)
    setProcessing(true)

    try {
      // Compression options
      const options = {
        maxSizeMB: 1, // Maximum file size in MB
        maxWidthOrHeight: 1024, // Maximum width or height
        useWebWorker: true, // Use web worker for better performance
        fileType: "image/jpeg" as const,
        initialQuality: 0.8,
      }

      console.log("[v0] Starting image compression...")

      // Compress the image using browser-image-compression
      const compressedFile = await imageCompression(file, options)

      console.log("[v0] Image compressed successfully:", {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + "%",
      })

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile)
      setImage(previewUrl)
      setCompressedFile(compressedFile)

      // Convert to base64 for analysis
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          await analyzeImage(base64)
        }
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error("[v0] Error processing image:", error)
      alert(`Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`)
    } finally {
      setProcessing(false)
    }
  }

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] Camera capture triggered")
    const file = event.target.files?.[0]
    if (file) {
      console.log("[v0] File selected from camera:", file.name)
      await processImage(file)
    } else {
      console.log("[v0] No file selected from camera")
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ""
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] File upload triggered")
    const file = event.target.files?.[0]
    if (file) {
      console.log("[v0] File selected for upload:", file.name)
      await processImage(file)
    } else {
      console.log("[v0] No file selected for upload")
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ""
  }

  const analyzeImage = async (imageDataUrl: string) => {
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/") || imageDataUrl.length < 100) {
      console.warn("[v0] Invalid image data for analysis")
      return
    }

    setAnalyzing(true)
    try {
      console.log("[v0] Starting image analysis...")

      const response = await fetch("/api/wardrobe/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      })

      if (response.ok) {
        const analysis = await response.json()
        console.log("[v0] Image analysis completed:", analysis)

        setFormData({
          name: analysis.name || "",
          category: analysis.category || "",
          brand: analysis.brand || "",
          color: analysis.color || "",
          size: analysis.size || "",
        })
      } else {
        const errorData = await response.json()
        console.error("[v0] Image analysis failed:", errorData)
        // Don't show alert for analysis failures, just continue without auto-fill
      }
    } catch (error) {
      console.error("[v0] Failed to analyze image:", error)
      // Don't show alert for analysis failures, just continue without auto-fill
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compressedFile) {
      alert("No image selected. Please take a photo or upload an image first.")
      return
    }

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
        resetDialog()
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
    if (image) {
      URL.revokeObjectURL(image) // Clean up object URL
    }
    setImage(null)
    setCompressedFile(null)
    setFormData({ name: "", category: "", brand: "", color: "", size: "" })
    setProcessing(false)
    setAnalyzing(false)
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

        {!image && !processing && (
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

        {processing && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <div className="text-center">
              <p className="font-medium">Processing image...</p>
              <p className="text-sm text-muted-foreground">Compressing and optimizing</p>
            </div>
          </div>
        )}

        {image && !processing && (
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
      </DialogContent>
    </Dialog>
  )
}
