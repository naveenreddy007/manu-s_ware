import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UserRole = "user" | "moderator" | "admin"

export interface UserProfile {
  user_id: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  phone: string | null
  created_at: string
}

export async function getUser() {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  const supabase = createClient()

  try {
    let targetUserId = userId

    if (!targetUserId) {
      const user = await getUser()
      if (!user) return null
      targetUserId = user.id
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single()

    if (error || !profile) {
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: targetUserId,
          role: "user",
          first_name: null,
          last_name: null,
          phone: null,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating user profile:", createError)
        return null
      }

      return newProfile
    }

    return profile
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  return { user, profile }
}

export async function isAdmin(userId?: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId)
    return profile?.role === "admin" || false
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export async function hasRole(role: UserRole, userId?: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId)
    return profile?.role === role || false
  } catch (error) {
    console.error("Error checking role:", error)
    return false
  }
}
