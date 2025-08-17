import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    const supabase = createClient()

    // Get public outfits first
    const { data: outfits, error } = await supabase
      .from("outfits")
      .select(`
        *,
        outfit_likes (count)
      `)
      .eq("is_public", true)
      .order("shared_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get outfit items for each outfit
    const outfitIds = outfits?.map((outfit) => outfit.id) || []
    const { data: outfitItems, error: itemsError } = await supabase
      .from("outfit_items")
      .select("*")
      .in("outfit_id", outfitIds)

    if (itemsError) {
      console.error("Error fetching outfit items:", itemsError)
    }

    // Get related wardrobe items and products based on item_type
    const wardrobeItemIds =
      outfitItems?.filter((item) => item.item_type === "wardrobe").map((item) => item.item_id) || []
    const productIds = outfitItems?.filter((item) => item.item_type === "product").map((item) => item.item_id) || []

    const { data: wardrobeItems } = await supabase.from("wardrobe_items").select("*").in("id", wardrobeItemIds)

    const { data: products } = await supabase.from("products").select("*").in("id", productIds)

    // Combine the data
    const enrichedOutfits =
      outfits?.map((outfit) => {
        const items = outfitItems?.filter((item) => item.outfit_id === outfit.id) || []
        const enrichedItems = items.map((item) => {
          if (item.item_type === "wardrobe") {
            const wardrobeItem = wardrobeItems?.find((w) => w.id === item.item_id)
            return { ...item, wardrobe_items: wardrobeItem ? [wardrobeItem] : [], products: [] }
          } else {
            const product = products?.find((p) => p.id === item.item_id)
            return { ...item, wardrobe_items: [], products: product ? [product] : [] }
          }
        })
        return { ...outfit, outfit_items: enrichedItems }
      }) || []

    const userIds = [...new Set(enrichedOutfits?.map((outfit) => outfit.user_id) || [])]
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds)

    const outfitsWithUsers =
      enrichedOutfits?.map((outfit) => ({
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
