import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, unset all defaults
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)

    // Then set the new default
    const { data: address, error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error setting default address:", error)
      return NextResponse.json({ error: "Failed to set default address" }, { status: 500 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error in default address API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
