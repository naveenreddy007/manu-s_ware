import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  try {
    const { direction } = await request.json()
    const { id } = params

    // Get current category
    const { data: currentCategory, error: currentError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single()

    if (currentError || !currentCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Get sibling categories (same parent)
    const { data: siblings, error: siblingsError } = await supabase
      .from("categories")
      .select("*")
      .eq("parent_category", currentCategory.parent_category || null)
      .order("display_order", { ascending: true })

    if (siblingsError || !siblings) {
      return NextResponse.json({ error: "Error fetching sibling categories" }, { status: 500 })
    }

    const currentIndex = siblings.findIndex((cat) => cat.id === id)
    if (currentIndex === -1) {
      return NextResponse.json({ error: "Category not found in siblings" }, { status: 404 })
    }

    let targetIndex: number
    if (direction === "up") {
      targetIndex = Math.max(0, currentIndex - 1)
    } else {
      targetIndex = Math.min(siblings.length - 1, currentIndex + 1)
    }

    if (targetIndex === currentIndex) {
      return NextResponse.json({ success: true }) // No change needed
    }

    // Swap display orders
    const targetCategory = siblings[targetIndex]
    const updates = [
      {
        id: currentCategory.id,
        display_order: targetCategory.display_order,
      },
      {
        id: targetCategory.id,
        display_order: currentCategory.display_order,
      },
    ]

    // Update both categories
    for (const update of updates) {
      const { error } = await supabase
        .from("categories")
        .update({ display_order: update.display_order })
        .eq("id", update.id)

      if (error) {
        console.error("Error updating category order:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
