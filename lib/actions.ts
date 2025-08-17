"use server"
import { redirect } from "next/navigation"
import { createActionClient } from "@/lib/supabase/server"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createActionClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createActionClient()

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/wardrobe`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createActionClient()

  await supabase.auth.signOut()
  redirect("/")
}

export async function updateUserRole(prevState: any, formData: FormData) {
  const userId = formData.get("userId")
  const role = formData.get("role")

  if (!userId || !role) {
    return { error: "User ID and role are required" }
  }

  const supabase = createActionClient()

  try {
    // Check if current user is admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) {
      return { error: "Not authenticated" }
    }

    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", currentUser.id)
      .single()

    if (currentProfile?.role !== "admin") {
      return { error: "Not authorized" }
    }

    // Update user role
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: role.toString() })
      .eq("user_id", userId.toString())

    if (error) {
      return { error: error.message }
    }

    return { success: "User role updated successfully" }
  } catch (error) {
    console.error("Update role error:", error)
    return { error: "An unexpected error occurred" }
  }
}
