import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get("view") || "overview"

    const supabase = createClient()

    if (view === "low-stock") {
      // Get low stock alerts
      const { data: lowStockAlerts, error } = await supabase
        .from("low_stock_alerts")
        .select(`
          *,
          product:products(name, sku, stock_quantity, low_stock_threshold)
        `)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json(lowStockAlerts)
    }

    if (view === "logs") {
      // Get inventory logs
      const { data: inventoryLogs, error } = await supabase
        .from("inventory_logs")
        .select(`
          *,
          product:products(name, sku),
          order:orders(order_number)
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      return NextResponse.json(inventoryLogs)
    }

    // Default overview
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("track_inventory", true)
      .order("stock_quantity", { ascending: true })

    if (productsError) throw productsError

    // Get summary stats
    const lowStockCount = products.filter((p) => p.stock_quantity <= p.low_stock_threshold).length
    const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length
    const totalValue = products.reduce((sum, p) => sum + p.stock_quantity * p.price, 0)

    return NextResponse.json({
      products,
      stats: {
        totalProducts: products.length,
        lowStockCount,
        outOfStockCount,
        totalValue,
      },
    })
  } catch (error) {
    console.error("Error fetching inventory data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, productId, quantity, reason } = body

    const supabase = createClient()

    if (action === "adjust-stock") {
      // Get current stock
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productId)
        .single()

      if (productError) throw productError

      const previousQuantity = product.stock_quantity
      const newQuantity = Math.max(0, previousQuantity + quantity)

      // Update stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", productId)

      if (updateError) throw updateError

      // Log the change
      const { error: logError } = await supabase.from("inventory_logs").insert({
        product_id: productId,
        change_type: "adjustment",
        quantity_change: quantity,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: reason || "Manual adjustment",
        created_by: admin.id,
      })

      if (logError) throw logError

      return NextResponse.json({ success: true, newQuantity })
    }

    if (action === "resolve-alert") {
      const { alertId } = body

      const { error } = await supabase
        .from("low_stock_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating inventory:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
