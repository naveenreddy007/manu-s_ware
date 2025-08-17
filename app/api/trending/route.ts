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

    // Get order items to calculate popular categories
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("product_id")
      .order("created_at", { ascending: false })
      .limit(50)

    let trendingCategories: { category: string; count: number }[] = []

    if (!orderError && orderItems) {
      // Get product categories for trending calculation
      const productIds = [...new Set(orderItems.map((item) => item.product_id))]
      if (productIds.length > 0) {
        const { data: products } = await supabase.from("products").select("id, category").in("id", productIds)

        // Calculate trending categories
        const categoryCount: Record<string, number> = {}
        products?.forEach((product) => {
          if (product.category) {
            categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
          }
        })

        trendingCategories = Object.entries(categoryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }))
      }
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

    // Get style trends from recent wardrobe additions
    const { data: styleTrends, error: styleError } = await supabase
      .from("wardrobe_items")
      .select("tags")
      .order("created_at", { ascending: false })
      .limit(100)

    let trendingStyles: { style: string; count: number }[] = []

    if (!styleError && styleTrends) {
      // Calculate trending styles
      const styleCount: Record<string, number> = {}
      styleTrends.forEach((item: any) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            styleCount[tag] = (styleCount[tag] || 0) + 1
          })
        }
      })

      trendingStyles = Object.entries(styleCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([style, count]) => ({ style, count }))
    }

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
        error: "Failed to fetch trending data",
        trending_products: [],
        trending_categories: [],
        popular_outfits: [],
        trending_styles: [],
        last_updated: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
