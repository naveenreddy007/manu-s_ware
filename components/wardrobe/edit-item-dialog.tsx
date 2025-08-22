"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { WardrobeItem } from "@/lib/types/database"

interface EditItemDialogProps {
  item: WardrobeItem
  categories: string[]
  onUpdate: (item: WardrobeItem) => void
  onClose: () => void
}

export function EditItemDialog({ item, categories, onUpdate, onClose }: EditItemDialogProps) {
  const [formData, setFormData] = useState({
    name: item.name || "",
    category: item.category || "",
    subcategory: item.subcategory || "",
    brand: item.brand || "",
    color: item.color || "",
    size: item.size || "",
    image_url: item.image_url || "",
    notes: item.notes || "",
    style: item.style || "",
    pattern: item.pattern || "",
    material: item.material || "",
    occasion: item.occasion || "",
    season: item.season || "",
    fit: item.fit || "",
    neckline: item.neckline || "",
    sleeve_length: item.sleeve_length || "",
    formality_score: item.formality_score || 3,
  })
  const [tags, setTags] = useState<string[]>(item.tags || [])
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/wardrobe/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tags }),
      })

      if (response.ok) {
        const { item: updatedItem } = await response.json()
        onUpdate(updatedItem)
      }
    } catch (error) {
      console.error("Failed to update item:", error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Wardrobe Item</DialogTitle>
          <DialogDescription>Update your wardrobe item details</DialogDescription>
        </DialogHeader>

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
              <Label htmlFor="category">Category *</Label>
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

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-muted-foreground">Fashion Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="streetwear">Streetwear</SelectItem>
                    <SelectItem value="bohemian">Bohemian</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="sporty">Sporty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Select
                  value={formData.pattern}
                  onValueChange={(value) => setFormData({ ...formData, pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="striped">Striped</SelectItem>
                    <SelectItem value="plaid">Plaid</SelectItem>
                    <SelectItem value="floral">Floral</SelectItem>
                    <SelectItem value="geometric">Geometric</SelectItem>
                    <SelectItem value="polka-dot">Polka Dot</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="animal-print">Animal Print</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => setFormData({ ...formData, material: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="wool">Wool</SelectItem>
                    <SelectItem value="silk">Silk</SelectItem>
                    <SelectItem value="linen">Linen</SelectItem>
                    <SelectItem value="polyester">Polyester</SelectItem>
                    <SelectItem value="denim">Denim</SelectItem>
                    <SelectItem value="leather">Leather</SelectItem>
                    <SelectItem value="cashmere">Cashmere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Select
                  value={formData.occasion}
                  onValueChange={(value) => setFormData({ ...formData, occasion: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyday">Everyday</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="formal-event">Formal Event</SelectItem>
                    <SelectItem value="date-night">Date Night</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="special-occasion">Special Occasion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="all-season">All Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fit">Fit</Label>
                <Select value={formData.fit} onValueChange={(value) => setFormData({ ...formData, fit: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slim">Slim</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="loose">Loose</SelectItem>
                    <SelectItem value="oversized">Oversized</SelectItem>
                    <SelectItem value="tailored">Tailored</SelectItem>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neckline">Neckline</Label>
                <Select
                  value={formData.neckline}
                  onValueChange={(value) => setFormData({ ...formData, neckline: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select neckline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crew">Crew</SelectItem>
                    <SelectItem value="v-neck">V-Neck</SelectItem>
                    <SelectItem value="scoop">Scoop</SelectItem>
                    <SelectItem value="boat">Boat</SelectItem>
                    <SelectItem value="off-shoulder">Off-Shoulder</SelectItem>
                    <SelectItem value="turtleneck">Turtleneck</SelectItem>
                    <SelectItem value="mock-neck">Mock Neck</SelectItem>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleeve_length">Sleeve Length</Label>
                <Select
                  value={formData.sleeve_length}
                  onValueChange={(value) => setFormData({ ...formData, sleeve_length: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sleeve length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sleeveless">Sleeveless</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="three-quarter">Three Quarter</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formality_score">Formality Level (1-5)</Label>
              <Select
                value={formData.formality_score.toString()}
                onValueChange={(value) => setFormData({ ...formData, formality_score: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select formality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Casual</SelectItem>
                  <SelectItem value="2">2 - Casual</SelectItem>
                  <SelectItem value="3">3 - Smart Casual</SelectItem>
                  <SelectItem value="4">4 - Business</SelectItem>
                  <SelectItem value="5">5 - Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
