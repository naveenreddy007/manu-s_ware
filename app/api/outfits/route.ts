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
    const { data: outfits, error } = await supabase
      .from("outfits")
      .select(`
        *,
        outfit_items (
          *,
          wardrobe_items:wardrobe_items!outfit_items_item_id_fkey (*),
          products:products!outfit_items_item_id_fkey (*)
        )
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(outfits)
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
