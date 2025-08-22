import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export function createClient() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    }
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Add retry configuration for failed requests
        retryAttempts: 3,
        // Handle network errors gracefully
        onAuthStateChange: (event, session) => {
          console.log("[v0] Auth state changed:", event, session?.user?.id || "no user")
        },
      },
      global: {
        // Add custom fetch with error handling
        fetch: async (url, options = {}) => {
          try {
            console.log("[v0] Supabase fetch attempt:", url)
            const response = await fetch(url, {
              ...options,
              // Add timeout to prevent hanging requests
              signal: AbortSignal.timeout(10000), // 10 second timeout
            })
            console.log("[v0] Supabase fetch success:", response.status)
            return response
          } catch (error) {
            console.error("[v0] Supabase fetch error:", error)
            // Return a mock response for failed auth requests to prevent crashes
            if (url.includes("/auth/")) {
              return new Response(JSON.stringify({ error: { message: "Network error" } }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              })
            }
            throw error
          }
        },
      },
    },
  )

  return client
}

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClient()
