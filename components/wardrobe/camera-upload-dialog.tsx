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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })
      setStream(mediaStream)
      setShowCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please use file upload instead.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)
        setImage(imageDataUrl)
        stopCamera()
        analyzeImage(imageDataUrl)
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Compress image before processing
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 800px width)
        const maxWidth = 800
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7)
          setImage(compressedDataUrl)
          analyzeImage(compressedDataUrl)
        }
      }

      img.src = URL.createObjectURL(file)
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
    if (!image) return

    setUploading(true)
    try {
      // Upload image to storage
      const uploadResponse = await fetch("/api/wardrobe/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      })

      if (uploadResponse.ok) {
        const { imageUrl } = await uploadResponse.json()

        // Create wardrobe item
        const response = await fetch("/api/wardrobe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, image_url: imageUrl }),
        })

        if (response.ok) {
          const { item } = await response.json()
          onAdd(item)
          setOpen(false)
          setImage(null)
          setFormData({ name: "", category: "", brand: "", color: "", size: "" })
        }
      }
    } catch (error) {
      console.error("Failed to upload item:", error)
    } finally {
      setUploading(false)
    }
  }

  const resetDialog = () => {
    setImage(null)
    setFormData({ name: "", category: "", brand: "", color: "", size: "" })
    stopCamera()
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

        {!image && !showCamera && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={startCamera} className="flex-col h-20">
                <Camera className="h-6 w-6 mb-2" />
                Take Photo
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-col h-20">
                <Upload className="h-6 w-6 mb-2" />
                Upload Image
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>
        )}

        {showCamera && (
          <div className="space-y-4">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
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
