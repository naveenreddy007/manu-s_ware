import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")

  let query = supabase
    .from("wardrobe_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const { data: items, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    category,
    subcategory,
    brand,
    color,
    size,
    image_url,
    tags,
    notes,
    style,
    pattern,
    material,
    occasion,
    season,
    fit,
    neckline,
    sleeve_length,
    formality_score,
  } = body

  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .insert({
      user_id: user.id,
      name,
      category,
      subcategory,
      brand,
      color,
      size,
      image_url,
      tags: tags || [],
      notes,
      source: "manual",
      style,
      pattern,
      material,
      occasion,
      season,
      fit,
      neckline,
      sleeve_length,
      formality_score,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item })
}
