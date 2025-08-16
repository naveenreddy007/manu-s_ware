import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { item_type, item_id, platform } = body

    const supabase = createClient()

    // Record the share
    const { error } = await supabase.from("social_shares").insert([
      {
        user_id: user.id,
        item_type,
        item_id,
        platform,
      },
    ])

    if (error) throw error

    // Update share count for outfits
    if (item_type === "outfit") {
      await supabase.rpc("increment_outfit_shares", { outfit_id: item_id })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording share:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
