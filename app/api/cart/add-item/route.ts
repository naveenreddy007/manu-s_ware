import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { product_id, quantity, size } = await request.json()

    // Validate required fields
    if (!product_id || !quantity) {
      return NextResponse.json({ error: "Product ID and quantity are required" }, { status: 400 })
    }

    // Create Supabase client with cookies for authentication
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if the product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("id", product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .eq("size", size || "M")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if item doesn't exist
      throw checkError
    }

    if (existingItem) {
      // Update existing cart item quantity
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)

      if (updateError) throw updateError

      return NextResponse.json({
        message: "Cart item quantity updated",
        item: {
          product_id,
          quantity: existingItem.quantity + quantity,
          size: size || "M",
        },
      })
    } else {
      const { data: newItem, error: insertError } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id,
          quantity,
          size: size || "M",
          price: product.price,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({
        message: "Item added to cart",
        item: newItem,
      })
    }
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}
