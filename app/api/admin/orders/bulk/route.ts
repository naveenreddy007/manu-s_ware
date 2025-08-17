import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderIds, status } = await request.json()
    const supabase = createClient()

    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", orderIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedCount: orderIds.length })
  } catch (error) {
    console.error("Error bulk updating orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
