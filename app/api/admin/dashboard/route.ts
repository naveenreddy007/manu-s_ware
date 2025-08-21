import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Admin dashboard API called")
    await requireAdmin()

    const supabase = createClient()

    // Get comprehensive dashboard statistics
    const [
      { count: totalProducts },
      { count: totalOrders },
      { count: totalUsers },
      { count: totalCategories },
      { count: totalInspirations },
      { data: recentOrders },
      { data: recentUsers },
      { data: topProducts },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("outfit_inspirations").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("user_profiles").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select("*").order("created_at", { ascending: false }).limit(5),
    ])

    // Calculate revenue from orders
    const { data: orderTotals } = await supabase.from("orders").select("total_amount")
    const totalRevenue = orderTotals?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    // Get this month's data
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const [{ count: ordersThisMonth }, { count: usersThisMonth }] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", thisMonth.toISOString()),
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonth.toISOString()),
    ])

    console.log("[v0] Dashboard data fetched successfully")
    return NextResponse.json(
      {
        overview: {
          totalProducts: totalProducts || 0,
          totalOrders: totalOrders || 0,
          totalUsers: totalUsers || 0,
          totalCategories: totalCategories || 0,
          totalInspirations: totalInspirations || 0,
          totalRevenue,
          ordersThisMonth: ordersThisMonth || 0,
          usersThisMonth: usersThisMonth || 0,
        },
        recentActivity: {
          recentOrders: recentOrders || [],
          recentUsers: recentUsers || [],
          topProducts: topProducts || [],
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
