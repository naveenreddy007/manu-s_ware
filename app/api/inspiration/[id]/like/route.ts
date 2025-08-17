import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const inspirationId = params.id

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("inspiration_likes")
      .select("id")
      .eq("inspiration_id", inspirationId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 })
    }

    // Add like
    const { error: likeError } = await supabase.from("inspiration_likes").insert({
      inspiration_id: inspirationId,
      user_id: user.id,
    })

    if (likeError) {
      return NextResponse.json({ error: likeError.message }, { status: 500 })
    }

    // Update likes count
    const { error: updateError } = await supabase.rpc("increment_inspiration_likes", {
      inspiration_id: inspirationId,
    })

    if (updateError) {
      console.error("Error updating likes count:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error liking inspiration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const inspirationId = params.id

    // Remove like
    const { error: deleteError } = await supabase
      .from("inspiration_likes")
      .delete()
      .eq("inspiration_id", inspirationId)
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Update likes count
    const { error: updateError } = await supabase.rpc("decrement_inspiration_likes", {
      inspiration_id: inspirationId,
    })

    if (updateError) {
      console.error("Error updating likes count:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unliking inspiration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
