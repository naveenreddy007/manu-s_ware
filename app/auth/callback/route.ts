import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/wardrobe"

  if (code) {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.user) {
        console.log("[v0] OAuth callback - User authenticated:", data.user.id)

        // Check if user profile exists, create if not
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .single()

        if (!existingProfile) {
          console.log("[v0] Creating user profile for OAuth user...")

          const { error: profileError } = await supabase.from("user_profiles").insert({
            user_id: data.user.id,
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (profileError) {
            console.log("[v0] Profile creation error:", profileError.message)
          } else {
            console.log("[v0] User profile created successfully")
          }
        }

        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error("[v0] OAuth callback error:", error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
