import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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

    const { action, product_id, commission_rate, sale_amount, inspiration_id } = await request.json()

    // Track affiliate interaction
    const { data, error } = await supabase
      .from("affiliate_interactions")
      .insert({
        user_id: user.id,
        action,
        product_id,
        commission_rate: commission_rate || 0.05,
        sale_amount: sale_amount || 0,
        inspiration_id,
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: request.headers.get("user-agent"),
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Error tracking affiliate interaction:", error)
      return NextResponse.json({ error: "Failed to track interaction" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Affiliate tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
