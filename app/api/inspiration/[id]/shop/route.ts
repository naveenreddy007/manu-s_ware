import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items, type } = await request.json()
    const postId = params.id

    // Get inspiration post details
    const { data: post, error: postError } = await supabase
      .from("outfit_inspiration_posts")
      .select("creator_id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Add items to cart
    const cartItems = []
    for (const item of items) {
      const { data: cartItem, error: cartError } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          size: item.size || "M",
        })
        .select()
        .single()

      if (cartError) {
        console.error("Error adding to cart:", cartError)
        continue
      }

      cartItems.push(cartItem)

      // Track the shopping action for affiliate purposes
      const { data: product } = await supabase.from("products").select("price").eq("id", item.product_id).single()

      if (product) {
        await supabase.from("inspiration_purchases").insert({
          post_id: postId,
          buyer_id: user.id,
          creator_id: post.creator_id,
          product_id: item.product_id,
          purchase_type: type,
          quantity: item.quantity || 1,
          price: product.price * (item.quantity || 1),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${cartItems.length} items added to cart`,
      cartItems,
    })
  } catch (error) {
    console.error("Error shopping inspiration:", error)
    return NextResponse.json({ error: "Failed to add items to cart" }, { status: 500 })
  }
}
