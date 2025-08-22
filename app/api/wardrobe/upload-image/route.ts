import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Server-side routes can't set cookies, but we need this for the client interface
        },
        remove(name: string, options: any) {
          // Server-side routes can't remove cookies, but we need this for the client interface
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file || !(file instanceof File)) {
      console.log("[v0] No valid file found in FormData")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Starting image upload for user:", user.id)
    console.log("[v0] File details:", { name: file.name, size: file.size, type: file.type })

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    const fileExtension = file.type === "image/png" ? "png" : "jpg"
    const filename = `${user.id}/${Date.now()}-wardrobe-item.${fileExtension}`

    console.log("[v0] Uploading to filename:", filename)

    const { data, error } = await supabase.storage.from("images").upload(filename, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Storage upload error:", error)
      return NextResponse.json(
        {
          error: "Failed to upload image",
          details: error.message || "Storage upload failed",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Upload successful:", data)

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
