import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days

    // Get affiliate earnings summary
    const { data: earnings, error } = await supabase
      .from("affiliate_interactions")
      .select(`
        *,
        products (
          name,
          price,
          images
        )
      `)
      .eq("user_id", user.id)
      .eq("action", "purchase_completed")
      .gte("created_at", new Date(Date.now() - Number.parseInt(period) * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching affiliate earnings:", error)
      return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
    }

    // Calculate totals
    const totalEarnings = earnings.reduce((sum, interaction) => {
      return sum + interaction.sale_amount * interaction.commission_rate
    }, 0)

    const totalSales = earnings.length
    const averageCommission =
      earnings.length > 0
        ? earnings.reduce((sum, interaction) => sum + interaction.commission_rate, 0) / earnings.length
        : 0

    return NextResponse.json({
      earnings,
      summary: {
        totalEarnings,
        totalSales,
        averageCommission,
        period: Number.parseInt(period),
      },
    })
  } catch (error) {
    console.error("Affiliate earnings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
