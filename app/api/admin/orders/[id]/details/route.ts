import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get order with detailed information
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        user_profiles!inner(first_name, last_name, email, phone)
      `)
      .eq("id", params.id)
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Get order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products!inner(name, image_url, category)
      `)
      .eq("order_id", params.id)

    if (itemsError) {
      console.error("Error fetching order items:", itemsError)
    }

    return NextResponse.json({
      ...order,
      order_items: orderItems || [],
    })
  } catch (error) {
    console.error("Error fetching order details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
