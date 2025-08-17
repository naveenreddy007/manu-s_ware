import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Admin users API called")
    await requireAdmin()

    const supabase = createClient()

    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("[v0] Error fetching user profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const { data: authData, error: authError } = await supabase
      .from("user_profiles")
      .select(`
        *,
        auth_users:user_id (
          email
        )
      `)
      .order("created_at", { ascending: false })

    let users = profiles

    if (!authError && authData) {
      users = authData.map((profile) => ({
        ...profile,
        email: profile.auth_users?.email || `user-${profile.user_id.slice(0, 8)}@example.com`,
      }))
    } else {
      users = profiles.map((profile) => ({
        ...profile,
        email: `user-${profile.user_id.slice(0, 8)}@example.com`,
      }))
    }

    console.log("[v0] Successfully fetched", users.length, "users")
    return NextResponse.json(users, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in users API:", error)
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
