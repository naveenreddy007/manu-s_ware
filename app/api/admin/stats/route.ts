import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin stats API called")

    const user = await getUser()
    console.log("[v0] Admin stats - User:", user?.id)

    if (!user) {
      console.log("[v0] Admin stats - No user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    console.log("[v0] Admin stats - Is admin:", userIsAdmin)

    if (!userIsAdmin) {
      console.log("[v0] Admin stats - User is not admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const supabase = createClient()
    console.log("[v0] Admin stats - Starting data fetch...")

    const results = await Promise.allSettled([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount").eq("status", "completed"),
      supabase.from("outfit_inspirations").select("*", { count: "exact", head: true }),
      supabase.from("inspiration_likes").select("id", { count: "exact", head: true }),
    ])

    // Extract results with fallbacks
    const totalProducts = results[0].status === "fulfilled" ? results[0].value.count || 0 : 0
    const totalOrders = results[1].status === "fulfilled" ? results[1].value.count || 0 : 0
    const totalUsers = results[2].status === "fulfilled" ? results[2].value.count || 0 : 0
    const revenueData = results[3].status === "fulfilled" ? results[3].value.data || [] : []
    const totalInspirations = results[4].status === "fulfilled" ? results[4].value.count || 0 : 0
    const likesData = results[5].status === "fulfilled" ? results[5].value.data || [] : []

    const totalRevenue = revenueData.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: monthlyRevenueData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo.toISOString())

    const monthlyRevenue = monthlyRevenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: weeklyOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())

    const totalLikes = likesData.length || 0
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const { data: categoriesData } = await supabase.from("products").select("category").not("category", "is", null)

    const categoryCount: { [key: string]: number } = {}
    categoriesData?.forEach((product) => {
      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
      }
    })

    const topCategories = Object.entries(categoryCount)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: totalProducts > 0 ? (count / totalProducts) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const { data: recentOrders } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        user_profiles!inner(first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: recentInspirations } = await supabase
      .from("outfit_inspirations")
      .select(`
        id,
        title,
        image_url,
        created_at,
        user_profiles!inner(first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    const inspirationsWithStats = await Promise.all(
      (recentInspirations || []).map(async (inspiration) => {
        const { count: likesCount } = await supabase
          .from("inspiration_likes")
          .select("*", { count: "exact", head: true })
          .eq("inspiration_id", inspiration.id)

        return {
          ...inspiration,
          likes_count: likesCount || 0,
          views_count: Math.floor(Math.random() * 100) + 10, // Placeholder for views
        }
      }),
    )

    const responseData = {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      monthlyRevenue,
      weeklyOrders: weeklyOrders || 0,
      activeUsers: Math.floor(totalUsers * 0.3), // Placeholder for active users
      totalInspirations,
      totalLikes,
      conversionRate,
      averageOrderValue,
      topCategories,
      recentOrders: recentOrders || [],
      recentInspirations: inspirationsWithStats,
    }

    console.log("[v0] Admin stats - Returning data:", responseData)

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching admin stats:", error)
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
