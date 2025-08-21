import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { image } = await request.json()

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Generate unique filename
    const filename = `${user.id}/${Date.now()}-wardrobe-item.jpg`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("images").upload(filename, buffer, {
      contentType: "image/jpeg",
      upsert: false,
    })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filename)

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
