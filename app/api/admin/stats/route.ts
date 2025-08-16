import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get total products
    const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })

    // Get total orders
    const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })

    // Get total users
    const { count: totalUsers } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

    // Get total revenue
    const { data: revenueData } = await supabase.from("orders").select("total_amount").eq("status", "completed")

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from("orders")
      .select(`
        *,
        user_profiles!inner(first_name, last_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalUsers: totalUsers || 0,
      totalRevenue,
      recentOrders: recentOrders || [],
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
