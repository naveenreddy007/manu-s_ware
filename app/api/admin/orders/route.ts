import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    console.log("[v0] Admin orders API called")
    await requireAdmin()

    const supabase = createClient()

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("[v0] Error fetching orders:", ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    const { data: userProfiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name, phone")

    if (profilesError) {
      console.error("[v0] Error fetching user profiles:", profilesError)
      // Continue without profiles rather than failing completely
    }

    const ordersWithProfiles =
      orders?.map((order) => {
        const profile = userProfiles?.find((p) => p.user_id === order.user_id)
        return {
          ...order,
          user_profiles: profile
            ? {
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                phone: profile.phone || "",
                email: `user-${order.user_id.slice(0, 8)}@example.com`, // Fallback email
              }
            : null,
        }
      }) || []

    console.log("[v0] Successfully fetched", ordersWithProfiles.length, "orders")
    return NextResponse.json(ordersWithProfiles, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in orders API:", error)
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
