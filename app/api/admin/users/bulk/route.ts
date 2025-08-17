import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()

    const { userIds, updates } = await request.json()
    const supabase = createClient()

    const { error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("user_id", userIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedCount: userIds.length })
  } catch (error) {
    console.error("Error bulk updating users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
