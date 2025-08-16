import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = createClient()

    // Search products for suggestions
    const { data: products } = await supabase
      .from("products")
      .select("name, category")
      .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
      .limit(5)

    // Get unique categories that match
    const { data: categories } = await supabase
      .from("products")
      .select("category")
      .ilike("category", `%${query}%`)
      .limit(3)

    const suggestions = [
      ...(products?.map((p) => ({ type: "product", text: p.name, category: p.category })) || []),
      ...(categories?.map((c) => ({ type: "category", text: c.category, category: c.category })) || []),
    ]

    return NextResponse.json({ suggestions: suggestions.slice(0, 8) })
  } catch (error) {
    console.error("Error fetching search suggestions:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
