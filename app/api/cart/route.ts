import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Get cart items
export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      product:products(*)
    `)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: cartItems || [] })
}

// Add item to cart
export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { product_id, size, quantity = 1 } = await request.json()

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .eq("size", size)
    .single()

  if (existingItem) {
    // Update quantity
    const { data: updatedItem, error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id)
      .select(`
        *,
        product:products(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: updatedItem })
  } else {
    // Add new item
    const { data: newItem, error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id,
        size,
        quantity,
      })
      .select(`
        *,
        product:products(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: newItem })
  }
}

// Update cart item
export async function PUT(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { item_id, quantity } = await request.json()

  if (quantity <= 0) {
    // Remove item
    const { error } = await supabase.from("cart_items").delete().eq("id", item_id).eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } else {
    // Update quantity
    const { data: updatedItem, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", item_id)
      .eq("user_id", user.id)
      .select(`
        *,
        product:products(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: updatedItem })
  }
}
