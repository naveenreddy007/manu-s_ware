import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get trending products based on recent activity (simplified - could be based on views, purchases, etc.)
    const { data: trendingProducts } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)

    // Get popular categories
    const { data: categoryData } = await supabase.from("products").select("category")

    const categoryCounts =
      categoryData?.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {}) || {}

    const trendingCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category]) => category)

    return NextResponse.json({
      trendingProducts: trendingProducts || [],
      trendingCategories,
    })
  } catch (error) {
    console.error("Error fetching trending data:", error)
    return NextResponse.json({ trendingProducts: [], trendingCategories: [] })
  }
}
