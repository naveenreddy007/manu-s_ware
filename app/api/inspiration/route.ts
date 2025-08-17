import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const tags = searchParams.get("tags")?.split(",") || []

    let query = supabase
      .from("outfit_inspirations")
      .select(`
        *,
        outfit_inspiration_items (
          id,
          product_id,
          position_x,
          position_y,
          products (
            name,
            price
          )
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })

    if (tags.length > 0) {
      query = query.overlaps("tags", tags)
    }

    const { data: inspirations, error } = await query

    if (error) {
      console.error("Error fetching inspirations:", error)
      return NextResponse.json({ inspirations: [], error: error.message }, { status: 500 })
    }

    // Get user profiles for creator names
    const userIds = [...new Set(inspirations?.map((i) => i.user_id) || [])]
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds)

    const profileMap = new Map(profiles?.map((p) => [p.user_id, `${p.first_name} ${p.last_name}`]) || [])

    const formattedInspirations =
      inspirations?.map((inspiration) => ({
        ...inspiration,
        creator_name: profileMap.get(inspiration.user_id) || "Anonymous",
        items:
          inspiration.outfit_inspiration_items?.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.products?.name || "Unknown Product",
            product_price: item.products?.price || 0,
            position_x: item.position_x,
            position_y: item.position_y,
          })) || [],
      })) || []

    return NextResponse.json({ inspirations: formattedInspirations })
  } catch (error) {
    console.error("Error in inspiration API:", error)
    return NextResponse.json({ inspirations: [], error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, image_url, product_tags, tags } = body

    const { data: inspiration, error: insertError } = await supabase
      .from("outfit_inspirations")
      .insert({
        user_id: user.id,
        title,
        description,
        image_url,
        tags: tags || [],
        is_public: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating inspiration:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Insert product tags as inspiration items
    if (product_tags && product_tags.length > 0) {
      const items = product_tags.map((tag: any) => ({
        outfit_inspiration_id: inspiration.id,
        product_id: tag.product_id,
        position_x: tag.x,
        position_y: tag.y,
      }))

      const { error: itemsError } = await supabase.from("outfit_inspiration_items").insert(items)

      if (itemsError) {
        console.error("Error creating inspiration items:", itemsError)
      }
    }

    return NextResponse.json({ inspiration })
  } catch (error) {
    console.error("Error in inspiration POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
