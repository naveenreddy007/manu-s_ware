import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const supabase = createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", params.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(params.id)

    if (authError) {
      console.error("Error fetching auth user:", authError)
    }

    // Get user activity data
    const { data: orders } = await supabase.from("orders").select("total_amount, created_at").eq("user_id", params.id)

    const { count: inspirationsCount } = await supabase
      .from("outfit_inspirations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", params.id)

    const { count: likesCount } = await supabase
      .from("inspiration_likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", params.id)

    const activity = {
      orders_count: orders?.length || 0,
      total_spent: orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
      last_order_date: orders?.[0]?.created_at,
      inspirations_count: inspirationsCount || 0,
      likes_count: likesCount || 0,
    }

    return NextResponse.json({
      ...profile,
      email: authUser?.user?.email || "Unknown",
      activity,
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
