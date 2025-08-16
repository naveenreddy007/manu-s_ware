import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { RecommendationEngine } from "@/lib/recommendation-engine"

export async function GET(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "products" // 'products' or 'outfits'
  const occasion = searchParams.get("occasion")
  const season = searchParams.get("season")

  try {
    // Fetch user's wardrobe items
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", user.id)

    if (wardrobeError) {
      return NextResponse.json({ error: wardrobeError.message }, { status: 500 })
    }

    // Fetch available products
    const { data: products, error: productsError } = await supabase.from("products").select("*").eq("is_active", true)

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const context = {
      occasion: occasion || undefined,
      season: season || undefined,
    }

    if (type === "outfits") {
      const outfitRecommendations = RecommendationEngine.generateOutfitRecommendations(
        wardrobeItems || [],
        products || [],
        context,
      )
      return NextResponse.json({ recommendations: outfitRecommendations })
    } else {
      const productRecommendations = RecommendationEngine.generateProductRecommendations(
        wardrobeItems || [],
        products || [],
        context,
      )
      return NextResponse.json({ recommendations: productRecommendations })
    }
  } catch (error) {
    console.error("Recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
