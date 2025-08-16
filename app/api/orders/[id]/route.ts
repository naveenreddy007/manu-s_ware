import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the specific order with all details
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (
            id,
            name,
            description,
            images
          )
        )
      `)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Database error:", error)
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
    }

    const formattedOrder = {
      ...order,
      shipping_address: {
        full_name: `${order.shipping_first_name || ""} ${order.shipping_last_name || ""}`.trim(),
        address_line_1: order.shipping_address_line1,
        address_line_2: order.shipping_address_line2,
        city: order.shipping_city,
        state: order.shipping_state,
        postal_code: order.shipping_postal_code,
        country: order.shipping_country,
        phone: order.shipping_phone,
      },
      billing_address: {
        full_name: `${order.billing_first_name || ""} ${order.billing_last_name || ""}`.trim(),
        address_line_1: order.billing_address_line1,
        address_line_2: order.billing_address_line2,
        city: order.billing_city,
        state: order.billing_state,
        postal_code: order.billing_postal_code,
        country: order.billing_country,
      },
    }

    return NextResponse.json({ order: formattedOrder })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
