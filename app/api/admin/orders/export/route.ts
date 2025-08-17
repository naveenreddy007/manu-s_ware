import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderIds } = await request.json()
    const supabase = createClient()

    let query = supabase
      .from("orders")
      .select(`
        *,
        user_profiles!inner(first_name, last_name, email, phone)
      `)
      .order("created_at", { ascending: false })

    if (orderIds && orderIds.length > 0) {
      query = query.in("id", orderIds)
    }

    const { data: orders, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate CSV content
    const csvHeaders = [
      "Order Number",
      "Customer Name",
      "Email",
      "Phone",
      "Status",
      "Total Amount",
      "Order Date",
      "Shipping Address",
      "Tracking Number",
    ]

    const csvRows = orders.map((order) => [
      order.order_number,
      `${order.shipping_first_name} ${order.shipping_last_name}`,
      order.shipping_email,
      order.shipping_phone || "",
      order.status,
      order.total_amount,
      new Date(order.created_at).toLocaleDateString("en-IN"),
      `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`,
      order.tracking_number || "",
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
