import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get creator earnings
    const { data: earnings, error: earningsError } = await supabase
      .from("creator_earnings")
      .select(`
        *,
        outfit_inspirations (
          title,
          image_url,
          created_at
        )
      `)
      .eq("creator_id", user.id)
      .order("updated_at", { ascending: false })

    if (earningsError) {
      console.error("Error fetching earnings:", earningsError)
      return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
    }

    // Get creator points
    const { data: points, error: pointsError } = await supabase
      .from("creator_points")
      .select("*")
      .eq("creator_id", user.id)
      .single()

    if (pointsError && pointsError.code !== "PGRST116") {
      console.error("Error fetching points:", pointsError)
    }

    // Calculate totals
    const totalEarnings =
      earnings?.reduce((sum, earning) => sum + Number.parseFloat(earning.total_commission || "0"), 0) || 0
    const pendingEarnings =
      earnings?.reduce((sum, earning) => sum + Number.parseFloat(earning.pending_commission || "0"), 0) || 0
    const paidEarnings =
      earnings?.reduce((sum, earning) => sum + Number.parseFloat(earning.paid_commission || "0"), 0) || 0

    return NextResponse.json({
      earnings: earnings || [],
      points: points || { points: 0, lifetime_points: 0, tier: "bronze" },
      summary: {
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        totalSales: earnings?.reduce((sum, earning) => sum + Number.parseFloat(earning.total_sales || "0"), 0) || 0,
      },
    })
  } catch (error) {
    console.error("Error in creator earnings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
