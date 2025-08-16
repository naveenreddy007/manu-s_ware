import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    const supabase = createClient()

    // Get public outfits with user info and like counts
    const { data: outfits, error } = await supabase
      .from("outfits")
      .select(`
        *,
        user_profiles!inner(first_name, last_name, avatar_url),
        outfit_items (
          *,
          wardrobe_items:wardrobe_items!outfit_items_item_id_fkey (*),
          products:products!outfit_items_item_id_fkey (*)
        ),
        outfit_likes (count)
      `)
      .eq("is_public", true)
      .order("shared_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get total count for pagination
    const { count } = await supabase.from("outfits").select("*", { count: "exact", head: true }).eq("is_public", true)

    return NextResponse.json({
      outfits: outfits || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching public outfits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
