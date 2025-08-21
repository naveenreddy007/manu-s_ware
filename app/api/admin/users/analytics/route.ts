import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] User analytics API called")
    await requireAdmin()

    const supabase = createClient()

    // Get total users count
    const { count: totalUsers } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

    // Get new users this month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const { count: newUsersThisMonth } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonth.toISOString())

    // Get role counts
    const { data: roleData } = await supabase.from("user_profiles").select("role")

    const roleCounts =
      roleData?.reduce(
        (acc, user) => {
          const role = user.role || "user"
          acc[role] = (acc[role] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    const roleDistribution = Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
      percentage: totalUsers ? (count / totalUsers) * 100 : 0,
    }))

    const { data: ordersData } = await supabase
      .from("orders")
      .select("user_id, total_amount")
      .order("total_amount", { ascending: false })

    const { data: userProfilesData } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name, role")

    // Calculate spending per user
    const userSpending =
      ordersData?.reduce(
        (acc, order) => {
          if (!acc[order.user_id]) {
            acc[order.user_id] = { total: 0, count: 0 }
          }
          acc[order.user_id].total += order.total_amount || 0
          acc[order.user_id].count += 1
          return acc
        },
        {} as Record<string, { total: number; count: number }>,
      ) || {}

    const topSpenders = Object.entries(userSpending)
      .map(([userId, spending]) => {
        const profile = userProfilesData?.find((p) => p.user_id === userId)
        return {
          user_id: userId,
          first_name: profile?.first_name || "Unknown",
          last_name: profile?.last_name || "User",
          role: profile?.role || "user",
          activity: {
            orders_count: spending.count,
            total_spent: spending.total,
            inspirations_count: 0,
            likes_count: 0,
          },
        }
      })
      .sort((a, b) => b.activity.total_spent - a.activity.total_spent)
      .slice(0, 5)

    // Get recent signups
    const { data: recentSignups } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    console.log("[v0] User analytics data fetched successfully")
    return NextResponse.json(
      {
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0, // Simplified since we don't have is_active column
        newUsersThisMonth: newUsersThisMonth || 0,
        adminCount: roleCounts.admin || 0,
        moderatorCount: roleCounts.moderator || 0,
        userGrowthRate: newUsersThisMonth && totalUsers ? (newUsersThisMonth / totalUsers) * 100 : 0,
        topSpenders,
        recentSignups: recentSignups || [],
        roleDistribution,
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
    console.error("[v0] Error fetching user analytics:", error)
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
