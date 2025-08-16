import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

  return profile
}

export async function isAdmin(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  // Check user profile table first
  const profile = await getUserProfile(userId)
  if (profile?.role === "admin") {
    return true
  }

  // Fallback: check auth metadata
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.user_metadata?.role === "admin" || user?.raw_user_meta_data?.role === "admin") {
    return true
  }

  return false
}
