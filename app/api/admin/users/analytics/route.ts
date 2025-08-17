import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    await requireAdmin()

    const supabase = createClient()

    // Get total users count
    const { count: totalUsers } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

    // Get active users count
    const { count: activeUsers } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

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
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    const roleDistribution = Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
      percentage: totalUsers ? (count / totalUsers) * 100 : 0,
    }))

    // Get top spenders
    const { data: topSpendersData } = await supabase
      .from("user_profiles")
      .select(`
        *,
        orders!inner(total_amount)
      `)
      .limit(5)

    const topSpenders =
      topSpendersData
        ?.map((user) => ({
          ...user,
          activity: {
            orders_count: user.orders?.length || 0,
            total_spent: user.orders?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0,
            inspirations_count: 0,
            likes_count: 0,
          },
        }))
        .sort((a, b) => b.activity.total_spent - a.activity.total_spent)
        .slice(0, 5) || []

    // Get recent signups
    const { data: recentSignups } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      adminCount: roleCounts.admin || 0,
      moderatorCount: roleCounts.moderator || 0,
      userGrowthRate: 0, // Placeholder for growth rate calculation
      topSpenders,
      recentSignups: recentSignups || [],
      roleDistribution,
    })
  } catch (error) {
    console.error("Error fetching user analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
