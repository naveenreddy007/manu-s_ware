import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    const { shipping_address, billing_address, payment_method = "credit_card", same_as_shipping = false } = body

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(*)
      `)
      .eq("user_id", user.id)

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shippingCost = subtotal > 100 ? 0 : 15 // Free shipping over $100
    const taxRate = 0.08 // 8% tax
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + shippingCost + taxAmount

    // Generate order number
    const { data: orderNumberResult } = await supabase.rpc("generate_order_number")
    const orderNumber = orderNumberResult || `MAN-${Date.now()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        shipping_first_name: shipping_address.first_name,
        shipping_last_name: shipping_address.last_name,
        shipping_address_line1: shipping_address.address_line1,
        shipping_address_line2: shipping_address.address_line2,
        shipping_city: shipping_address.city,
        shipping_state: shipping_address.state,
        shipping_postal_code: shipping_address.postal_code,
        shipping_country: shipping_address.country || "US",
        shipping_phone: shipping_address.phone,
        billing_first_name: same_as_shipping ? shipping_address.first_name : billing_address.first_name,
        billing_last_name: same_as_shipping ? shipping_address.last_name : billing_address.last_name,
        billing_address_line1: same_as_shipping ? shipping_address.address_line1 : billing_address.address_line1,
        billing_address_line2: same_as_shipping ? shipping_address.address_line2 : billing_address.address_line2,
        billing_city: same_as_shipping ? shipping_address.city : billing_address.city,
        billing_state: same_as_shipping ? shipping_address.state : billing_address.state,
        billing_postal_code: same_as_shipping ? shipping_address.postal_code : billing_address.postal_code,
        billing_country: same_as_shipping ? shipping_address.country || "US" : billing_address.country || "US",
        payment_method: payment_method,
        status: "confirmed",
        payment_status: "paid", // Simplified for demo
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
    }))

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems)

    if (orderItemsError) {
      return NextResponse.json({ error: orderItemsError.message }, { status: 500 })
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user.id)

    return NextResponse.json({
      order: {
        ...order,
        items: orderItems,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
