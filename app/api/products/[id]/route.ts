import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { RecommendationEngine } from "@/lib/recommendation-engine"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  // Get the product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("is_active", true)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  // Check if user is authenticated to get wardrobe compatibility
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let wardrobeCompatibility = null
  let stylingRecommendations = null
  let accessoryRecommendations = []

  if (user) {
    // Get user's wardrobe items
    const { data: wardrobeItems } = await supabase.from("wardrobe_items").select("*").eq("user_id", user.id)

    if (wardrobeItems && wardrobeItems.length > 0) {
      // Find compatible wardrobe items
      const compatibleItems = wardrobeItems.filter((item) =>
        RecommendationEngine["areProductItemCompatible"](product, item),
      )

      wardrobeCompatibility = {
        total_items: wardrobeItems.length,
        compatible_items: compatibleItems.slice(0, 6),
        compatibility_score: compatibleItems.length / wardrobeItems.length,
      }

      // Generate styling suggestions
      stylingRecommendations = RecommendationEngine.generateOutfitRecommendations(wardrobeItems, [product], {}).slice(
        0,
        3,
      )
    }
  }

  const { data: accessories } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .in("category", getAccessoryCategories(product.category))
    .neq("id", product.id)
    .limit(6)

  if (accessories) {
    accessoryRecommendations = accessories
      .map((accessory) => ({
        ...accessory,
        compatibility_score: calculateCompatibilityScore(product, accessory),
      }))
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
  }

  return NextResponse.json({
    product,
    wardrobe_compatibility: wardrobeCompatibility,
    styling_recommendations: stylingRecommendations,
    accessory_recommendations: accessoryRecommendations,
  })
}

function getAccessoryCategories(productCategory: string): string[] {
  const categoryMap: Record<string, string[]> = {
    shirts: ["ties", "cufflinks", "watches", "belts"],
    pants: ["belts", "shoes", "watches"],
    jackets: ["ties", "pocket-squares", "watches", "cufflinks"],
    suits: ["ties", "cufflinks", "watches", "shoes", "belts"],
    shoes: ["socks", "shoe-care"],
    accessories: ["watches", "sunglasses", "bags"],
  }

  return categoryMap[productCategory] || ["accessories", "watches", "belts"]
}

function calculateCompatibilityScore(product: any, accessory: any): number {
  let score = 0.5 // Base compatibility

  // Color compatibility
  if (product.color && accessory.color) {
    const compatibleColors = {
      navy: ["white", "light-blue", "brown", "burgundy"],
      black: ["white", "gray", "silver"],
      white: ["navy", "black", "brown", "any"],
      brown: ["navy", "white", "cream", "tan"],
    }

    if (compatibleColors[product.color]?.includes(accessory.color)) {
      score += 0.3
    }
  }

  // Style compatibility
  if (product.tags && accessory.tags) {
    const commonTags = product.tags.filter((tag: string) => accessory.tags.includes(tag))
    score += commonTags.length * 0.1
  }

  return Math.min(score, 1.0)
}
