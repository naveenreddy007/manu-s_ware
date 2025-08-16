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

    const userIds = [...new Set(outfits?.map((outfit) => outfit.user_id) || [])]
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds)

    const outfitsWithUsers =
      outfits?.map((outfit) => ({
        ...outfit,
        user_profiles: userProfiles?.find((profile) => profile.user_id === outfit.user_id) || {
          first_name: "Anonymous",
          last_name: "User",
        },
      })) || []

    // Get total count for pagination
    const { count } = await supabase.from("outfits").select("*", { count: "exact", head: true }).eq("is_public", true)

    return NextResponse.json({
      outfits: outfitsWithUsers,
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
