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

  return NextResponse.json({
    product,
    wardrobe_compatibility: wardrobeCompatibility,
    styling_recommendations: stylingRecommendations,
  })
}
