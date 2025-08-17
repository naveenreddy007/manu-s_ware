import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get trending products based on recent activity
    const { data: trendingProducts, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8)

    if (productsError) {
      console.error("Error fetching trending products:", productsError)
    }

    // Get popular categories with better error handling
    const { data: categoryData, error: categoryError } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)

    let trendingCategories: string[] = []

    if (!categoryError && categoryData) {
      const categoryCounts = categoryData.reduce((acc: Record<string, number>, item) => {
        if (item.category) {
          acc[item.category] = (acc[item.category] || 0) + 1
        }
        return acc
      }, {})

      trendingCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([category]) => category)
    }

    if (trendingCategories.length === 0) {
      trendingCategories = ["shirts", "pants", "shoes", "accessories", "outerwear"]
    }

    return NextResponse.json({
      trendingProducts: trendingProducts || [],
      trendingCategories,
    })
  } catch (error) {
    console.error("Error fetching trending data:", error)
    return NextResponse.json({
      trendingProducts: [],
      trendingCategories: ["shirts", "pants", "shoes", "accessories", "outerwear"],
    })
  }
}
