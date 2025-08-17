import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { status, tracking_number, notes } = body
    const orderId = params.id

    const supabase = createClient()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data, error } = await supabase.from("orders").update(updateData).eq("id", orderId).select().single()

    if (error) {
      console.error("[v0] Error updating order:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in order update API:", error)
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
