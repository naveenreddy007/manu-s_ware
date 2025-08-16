// Database type definitions for MANUS platform
export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  subcategory: string | null
  brand: string
  color: string | null
  sizes: string[]
  images: string[]
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WardrobeItem {
  id: string
  user_id: string
  name: string
  category: string
  subcategory: string | null
  brand: string | null
  color: string | null
  size: string | null
  image_url: string | null
  tags: string[]
  purchase_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Outfit {
  id: string
  user_id: string
  name: string | null
  occasion: string | null
  season: string | null
  weather_conditions: string[]
  created_at: string
}

export interface OutfitItem {
  id: string
  outfit_id: string
  product_id: string | null
  wardrobe_item_id: string | null
  item_type: "product" | "wardrobe"
  created_at: string
  // Joined data
  product?: Product
  wardrobe_item?: WardrobeItem
}

export interface UserPreferences {
  id: string
  user_id: string
  style_preferences: string[]
  preferred_colors: string[]
  size_preferences: Record<string, any>
  budget_range: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  parent_category: string | null
  display_order: number
}
