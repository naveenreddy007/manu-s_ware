import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: outfits, error: outfitsError } = await supabase
      .from("outfits")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (outfitsError) throw outfitsError

    // Fetch outfit items for each outfit
    const outfitsWithItems = await Promise.all(
      outfits.map(async (outfit) => {
        const { data: outfitItems, error: itemsError } = await supabase
          .from("outfit_items")
          .select("*")
          .eq("outfit_id", outfit.id)

        if (itemsError) throw itemsError

        // Fetch related wardrobe items and products
        const itemsWithDetails = await Promise.all(
          outfitItems.map(async (item) => {
            if (item.item_type === "wardrobe") {
              const { data: wardrobeItem } = await supabase
                .from("wardrobe_items")
                .select("*")
                .eq("id", item.item_id)
                .single()

              return {
                ...item,
                wardrobe_item: wardrobeItem,
              }
            } else if (item.item_type === "product") {
              const { data: product } = await supabase.from("products").select("*").eq("id", item.item_id).single()

              return {
                ...item,
                product: product,
              }
            }
            return item
          }),
        )

        return {
          ...outfit,
          outfit_items: itemsWithDetails,
        }
      }),
    )

    return NextResponse.json(outfitsWithItems)
  } catch (error) {
    console.error("Error fetching outfits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, occasion, season, items } = body

    const supabase = createClient()

    // Create the outfit
    const { data: outfit, error: outfitError } = await supabase
      .from("outfits")
      .insert([
        {
          user_id: user.id,
          name,
          description,
          occasion,
          season,
        },
      ])
      .select()
      .single()

    if (outfitError) throw outfitError

    // Add outfit items
    if (items && items.length > 0) {
      const outfitItems = items.map((item: any) => ({
        outfit_id: outfit.id,
        item_type: item.item_type,
        item_id: item.item_id,
        category: item.category,
      }))

      const { error: itemsError } = await supabase.from("outfit_items").insert(outfitItems)

      if (itemsError) throw itemsError
    }

    return NextResponse.json(outfit)
  } catch (error) {
    console.error("Error creating outfit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
