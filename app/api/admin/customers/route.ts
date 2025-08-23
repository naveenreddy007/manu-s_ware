import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    await requireAdmin()

    const supabase = createClient()

    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .in("role", ["user", "customer"])
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Error fetching customer profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    const customerIds = profiles.map((p) => p.user_id)

    const { data: orderStats, error: orderError } = await supabase
      .from("orders")
      .select("user_id, total_amount, created_at")
      .in("user_id", customerIds)

    const { data: inspirationStats, error: inspirationError } = await supabase
      .from("outfit_inspiration_posts")
      .select("user_id")
      .in("user_id", customerIds)

    const customersWithActivity = profiles.map((profile) => {
      const userOrders = orderStats?.filter((o) => o.user_id === profile.user_id) || []
      const userInspirations = inspirationStats?.filter((i) => i.user_id === profile.user_id) || []

      return {
        ...profile,
        email: `user-${profile.user_id.slice(0, 8)}@example.com`, // Fallback email
        activity: {
          orders_count: userOrders.length,
          total_spent: userOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          last_order_date:
            userOrders.length > 0
              ? userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                  .created_at
              : null,
          inspirations_count: userInspirations.length,
          likes_count: 0, // Could be enhanced with actual likes data
        },
      }
    })

    return NextResponse.json(customersWithActivity, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Error in customers API:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
