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
    console.log("[v0] Starting user signup process...")

    // First, check if Supabase is properly configured
    const { data: testData, error: testError } = await supabase.from("user_profiles").select("count").limit(1)
    if (testError) {
      console.log("[v0] Database connection test failed:", testError.message)
      return { error: "Database connection failed. Please try again." }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/wardrobe`,
      },
    })

    if (error) {
      console.log("[v0] Auth signup error:", error.message)

      // Provide more specific error messages
      if (error.message.includes("User already registered")) {
        return { error: "An account with this email already exists. Please sign in instead." }
      }
      if (error.message.includes("Password")) {
        return { error: "Password must be at least 6 characters long." }
      }
      if (error.message.includes("Email")) {
        return { error: "Please enter a valid email address." }
      }

      return { error: error.message }
    }

    if (data.user) {
      console.log("[v0] User created successfully:", data.user.id)

      // The database trigger should handle profile creation, but let's add a fallback
      if (!data.user.email_confirmed_at) {
        console.log("[v0] User needs email confirmation")

        // Wait a moment for the trigger to execute
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if profile was created by trigger
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .single()

        if (!existingProfile) {
          console.log("[v0] Creating user profile as fallback...")

          try {
            const { error: profileError } = await supabase.from("user_profiles").insert({
              user_id: data.user.id,
              role: "user",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (profileError) {
              console.log("[v0] Fallback profile creation error:", profileError.message)
              // Don't fail signup for profile creation issues
            } else {
              console.log("[v0] Fallback user profile created successfully")
            }
          } catch (profileError) {
            console.log("[v0] Fallback profile creation exception:", profileError)
            // Don't fail signup for profile creation issues
          }
        } else {
          console.log("[v0] User profile already exists (created by trigger)")
        }
      }
    }

    console.log("[v0] Signup completed successfully")
    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
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

export async function signInWithGoogle() {
  const supabase = createActionClient()

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/wardrobe`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.log("[v0] Google OAuth error:", error.message)
      return { error: error.message }
    }

    if (data.url) {
      return { success: true, redirectUrl: data.url }
    }

    return { error: "No redirect URL received from Google" }
  } catch (error) {
    console.error("[v0] Google sign-in error:", error)
    return { error: "Failed to sign in with Google. Please try again." }
  }
}
