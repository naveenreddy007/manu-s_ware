import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email"

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
    const {
      shipping_address,
      billing_address,
      payment_method = "credit_card",
      same_as_shipping = false,
      save_shipping_address = false,
      save_billing_address = false,
      shipping_is_default = false,
      billing_is_default = false,
    } = body

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

    // Get user profile for email
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single()

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shippingCost = subtotal > 100 ? 0 : 15 // Free shipping over $100
    const taxRate = 0.08 // 8% tax
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + shippingCost + taxAmount

    // Generate order number
    const { data: orderNumberResult } = await supabase.rpc("generate_order_number")
    const orderNumber = orderNumberResult || `MAN-${Date.now()}`

    let shippingAddressId = null
    let billingAddressId = null

    if (save_shipping_address && shipping_address) {
      // If marking as default, unset other default shipping addresses
      if (shipping_is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("type", "shipping")
      }

      const { data: savedShippingAddress, error: shippingAddressError } = await supabase
        .from("customer_addresses")
        .insert({
          user_id: user.id,
          type: "shipping",
          full_name: `${shipping_address.first_name} ${shipping_address.last_name}`,
          company: shipping_address.company || null,
          address_line_1: shipping_address.address_line1,
          address_line_2: shipping_address.address_line2 || null,
          city: shipping_address.city,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country || "US",
          phone: shipping_address.phone || null,
          is_default: shipping_is_default,
        })
        .select()
        .single()

      if (!shippingAddressError && savedShippingAddress) {
        shippingAddressId = savedShippingAddress.id
      }
    }

    if (save_billing_address && !same_as_shipping && billing_address) {
      // If marking as default, unset other default billing addresses
      if (billing_is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("type", "billing")
      }

      const { data: savedBillingAddress, error: billingAddressError } = await supabase
        .from("customer_addresses")
        .insert({
          user_id: user.id,
          type: "billing",
          full_name: `${billing_address.first_name} ${billing_address.last_name}`,
          company: billing_address.company || null,
          address_line_1: billing_address.address_line1,
          address_line_2: billing_address.address_line2 || null,
          city: billing_address.city,
          state: billing_address.state,
          postal_code: billing_address.postal_code,
          country: billing_address.country || "US",
          phone: billing_address.phone || null,
          is_default: billing_is_default,
        })
        .select()
        .single()

      if (!billingAddressError && savedBillingAddress) {
        billingAddressId = savedBillingAddress.id
      }
    }

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
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId,
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

    try {
      const customerName = userProfile
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : `${shipping_address.first_name} ${shipping_address.last_name}`

      await emailService.sendOrderConfirmation({
        orderNumber: orderNumber,
        customerName: customerName,
        customerEmail: user.email!,
        items: cartItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          image_url: item.product.images?.[0] || "/placeholder.svg",
        })),
        subtotal: subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total: totalAmount,
        shippingAddress: {
          full_name: `${shipping_address.first_name} ${shipping_address.last_name}`,
          address_line_1: shipping_address.address_line1,
          address_line_2: shipping_address.address_line2,
          city: shipping_address.city,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country || "US",
        },
      })
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError)
      // Don't fail the order if email fails
    }

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
