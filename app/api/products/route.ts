import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { apiCache, getCacheKey } from "@/lib/cache"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "12")
  const offset = (page - 1) * limit

  const cacheKey = getCacheKey.products(category || undefined, search || undefined)
  const cachedData = apiCache.get(cacheKey)
  if (cachedData) {
    return NextResponse.json(cachedData)
  }

  const supabase = createClient()

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data: products, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const response = {
    products: products || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }

  apiCache.set(cacheKey, response, 5)

  return NextResponse.json(response)
}
