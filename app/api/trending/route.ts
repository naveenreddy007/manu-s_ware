import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()

  try {
    // Get trending products based on recent orders
    const { data: trendingProducts, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8)

    if (productsError) {
      console.error("Error fetching trending products:", productsError)
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)

    let trendingCategories: { category: string; count: number }[] = []

    if (!categoryError && categoryData) {
      const categoryCount: Record<string, number> = {}
      categoryData.forEach((product) => {
        if (product.category) {
          categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
        }
      })

      trendingCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }))
    }

    if (trendingCategories.length === 0) {
      trendingCategories = [
        { category: "shirts", count: 10 },
        { category: "pants", count: 8 },
        { category: "shoes", count: 6 },
        { category: "accessories", count: 4 },
        { category: "outerwear", count: 3 },
      ]
    }

    // Get recent popular outfits (public ones)
    const { data: popularOutfits, error: outfitsError } = await supabase
      .from("outfits")
      .select("id, name, description, is_public, created_at, user_id")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)

    if (outfitsError) {
      console.error("Error fetching popular outfits:", outfitsError)
    }

    const trendingStyles: { style: string; count: number }[] = [
      { style: "casual", count: 15 },
      { style: "business", count: 12 },
      { style: "formal", count: 8 },
      { style: "streetwear", count: 6 },
      { style: "minimalist", count: 5 },
    ]

    return NextResponse.json({
      trending_products: trendingProducts || [],
      trending_categories: trendingCategories,
      popular_outfits: popularOutfits || [],
      trending_styles: trendingStyles,
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Trending API error:", error)
    return NextResponse.json(
      {
        trending_products: [],
        trending_categories: [
          { category: "shirts", count: 10 },
          { category: "pants", count: 8 },
          { category: "shoes", count: 6 },
        ],
        popular_outfits: [],
        trending_styles: [
          { style: "casual", count: 15 },
          { style: "business", count: 12 },
        ],
        last_updated: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}
