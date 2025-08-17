import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const supabase = createClient()

    let queryBuilder = supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        images,
        category,
        subcategory,
        brand,
        color,
        sizes,
        tags,
        sku,
        stock_quantity,
        is_active
      `)
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .limit(limit)

    // Add search filters
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%,subcategory.ilike.%${query}%`,
      )
    }

    if (category) {
      queryBuilder = queryBuilder.eq("category", category)
    }

    const { data: products, error } = await queryBuilder

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      total: products?.length || 0,
    })
  } catch (error) {
    console.error("Error in products search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
