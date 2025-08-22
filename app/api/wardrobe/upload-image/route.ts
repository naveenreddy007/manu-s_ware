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
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Starting image upload for user:", user.id)
    console.log("[v0] File details:", { name: file.name, size: file.size, type: file.type })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate unique filename with user folder structure
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filename = `${user.id}/${Date.now()}-wardrobe-item.${fileExtension}`

    console.log("[v0] Uploading to filename:", filename)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("images").upload(filename, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Storage upload error:", error)
      return NextResponse.json(
        {
          error: "Failed to upload image",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Upload successful:", data)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filename)

    console.log("[v0] Generated public URL:", publicUrl)

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
