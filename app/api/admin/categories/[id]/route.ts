import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  try {
    const { name, parent_category, display_order } = await request.json()
    const { id } = params

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        parent_category: parent_category || null,
        display_order: display_order || 0,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  try {
    const { id } = params

    // Check if category has subcategories
    const { data: subcategories } = await supabase.from("categories").select("id").eq("parent_category", id)

    if (subcategories && subcategories.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Delete subcategories first." },
        { status: 400 },
      )
    }

    // Check if category is used by products
    const { data: products } = await supabase.from("products").select("id").eq("category", id).limit(1)

    if (products && products.length > 0) {
      return NextResponse.json({ error: "Cannot delete category that is used by products." }, { status: 400 })
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
