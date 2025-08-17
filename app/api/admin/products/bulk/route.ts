import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productIds } = await request.json()
    const supabase = createClient()

    const { error } = await supabase.from("products").delete().in("id", productIds)

    if (error) throw error

    return NextResponse.json({ success: true, deletedCount: productIds.length })
  } catch (error) {
    console.error("Error bulk deleting products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productIds, updates } = await request.json()
    const supabase = createClient()

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("products").update(updateData).in("id", productIds)

    if (error) throw error

    return NextResponse.json({ success: true, updatedCount: productIds.length })
  } catch (error) {
    console.error("Error bulk updating products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
