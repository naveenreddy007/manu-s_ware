import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export function createClient() {
  const cookieStore = cookies()

  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set.")
    // Return a mock client for development
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    }
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
