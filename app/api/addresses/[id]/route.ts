import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const addressData = await request.json()

    // If this is set as default, unset all other defaults
    if (addressData.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .update(addressData)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating address:", error)
      return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error in address PUT API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("addresses").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting address:", error)
      return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in address DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
