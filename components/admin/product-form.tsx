"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { IndianRupee, ImageIcon, Upload } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  subcategory?: string
  brand?: string
  image_url: string
  stock_quantity: number
  is_active: boolean
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

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

const categories = [
  { value: "clothing", label: "Clothing", subcategories: ["shirts", "pants", "dresses", "jackets", "tops"] },
  { value: "footwear", label: "Footwear", subcategories: ["sneakers", "boots", "sandals", "heels", "flats"] },
  { value: "accessories", label: "Accessories", subcategories: ["bags", "jewelry", "watches", "belts", "hats"] },
  { value: "beauty", label: "Beauty", subcategories: ["skincare", "makeup", "fragrance", "haircare"] },
]

const styleOptions = ["casual", "formal", "bohemian", "minimalist", "vintage", "streetwear", "preppy", "romantic"]
const patternOptions = ["solid", "striped", "floral", "geometric", "plaid", "polka-dot", "abstract", "animal-print"]
const materialOptions = ["cotton", "denim", "silk", "wool", "polyester", "linen", "leather", "cashmere", "chiffon"]
const occasionOptions = ["casual", "work", "formal", "party", "sports", "vacation", "date-night", "wedding"]
const seasonOptions = ["spring", "summer", "fall", "winter", "all-season"]
const fitOptions = ["slim", "regular", "loose", "oversized", "tailored", "relaxed", "fitted"]
const necklineOptions = ["crew", "v-neck", "scoop", "collar", "turtleneck", "off-shoulder", "halter", "none"]
const sleeveLengthOptions = ["short", "long", "sleeveless", "3/4", "cap", "bell", "none"]

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(product?.category || "")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number.parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      subcategory: formData.get("subcategory") as string,
      brand: formData.get("brand") as string,
      image_url: formData.get("image_url") as string,
      stock_quantity: Number.parseInt(formData.get("stock_quantity") as string),
      is_active: formData.get("is_active") === "on",
      style: formData.get("style") as string,
      pattern: formData.get("pattern") as string,
      material: formData.get("material") as string,
      occasion: formData.get("occasion") as string,
      season: formData.get("season") as string,
      fit: formData.get("fit") as string,
      neckline: formData.get("neckline") as string,
      sleeve_length: formData.get("sleeve_length") as string,
      formality_score: Number.parseInt(formData.get("formality_score") as string) || 3,
    }

    onSubmit(productData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} rows={3} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Price (INR) *</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              className="pl-10"
              defaultValue={product?.price}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            name="stock_quantity"
            type="number"
            defaultValue={product?.stock_quantity}
            required
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox id="is_active" name="is_active" defaultChecked={product?.is_active ?? true} />
          <Label htmlFor="is_active">Active Product</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select name="category" value={selectedCategory} onValueChange={setSelectedCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select name="subcategory" defaultValue={product?.subcategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {selectedCategory &&
                categories
                  .find((cat) => cat.value === selectedCategory)
                  ?.subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="image_url">Image URL *</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="image_url"
              name="image_url"
              type="url"
              className="pl-10"
              defaultValue={product?.image_url}
              required
            />
          </div>
          <Button type="button" variant="outline">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Rich Fashion Data Fields */}
      <div className="space-y-4 border-t pt-4">
        <Label className="text-base font-medium">Fashion Attributes</Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="style">Style</Label>
            <Select name="style" defaultValue={product?.style}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pattern">Pattern</Label>
            <Select name="pattern" defaultValue={product?.pattern}>
              <SelectTrigger>
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                {patternOptions.map((pattern) => (
                  <SelectItem key={pattern} value={pattern}>
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="material">Material</Label>
            <Select name="material" defaultValue={product?.material}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materialOptions.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material.charAt(0).toUpperCase() + material.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="occasion">Occasion</Label>
            <Select name="occasion" defaultValue={product?.occasion}>
              <SelectTrigger>
                <SelectValue placeholder="Select occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasionOptions.map((occasion) => (
                  <SelectItem key={occasion} value={occasion}>
                    {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="season">Season</Label>
            <Select name="season" defaultValue={product?.season}>
              <SelectTrigger>
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {seasonOptions.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fit">Fit</Label>
            <Select name="fit" defaultValue={product?.fit}>
              <SelectTrigger>
                <SelectValue placeholder="Select fit" />
              </SelectTrigger>
              <SelectContent>
                {fitOptions.map((fit) => (
                  <SelectItem key={fit} value={fit}>
                    {fit.charAt(0).toUpperCase() + fit.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="formality_score">Formality Score (1-5)</Label>
            <Select name="formality_score" defaultValue={product?.formality_score?.toString() || "3"}>
              <SelectTrigger>
                <SelectValue placeholder="Select formality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Casual</SelectItem>
                <SelectItem value="2">2 - Casual</SelectItem>
                <SelectItem value="3">3 - Smart Casual</SelectItem>
                <SelectItem value="4">4 - Business Formal</SelectItem>
                <SelectItem value="5">5 - Very Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="neckline">Neckline</Label>
            <Select name="neckline" defaultValue={product?.neckline}>
              <SelectTrigger>
                <SelectValue placeholder="Select neckline" />
              </SelectTrigger>
              <SelectContent>
                {necklineOptions.map((neckline) => (
                  <SelectItem key={neckline} value={neckline}>
                    {neckline.charAt(0).toUpperCase() + neckline.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sleeve_length">Sleeve Length</Label>
            <Select name="sleeve_length" defaultValue={product?.sleeve_length}>
              <SelectTrigger>
                <SelectValue placeholder="Select sleeve length" />
              </SelectTrigger>
              <SelectContent>
                {sleeveLengthOptions.map((length) => (
                  <SelectItem key={length} value={length}>
                    {length.charAt(0).toUpperCase() + length.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {product ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
