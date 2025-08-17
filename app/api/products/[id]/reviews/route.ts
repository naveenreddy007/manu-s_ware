import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sortBy = searchParams.get("sort") || "newest"
    const offset = (page - 1) * limit

    let orderBy: { column: string; ascending: boolean }
    switch (sortBy) {
      case "oldest":
        orderBy = { column: "created_at", ascending: true }
        break
      case "highest":
        orderBy = { column: "rating", ascending: false }
        break
      case "lowest":
        orderBy = { column: "rating", ascending: true }
        break
      case "helpful":
        orderBy = { column: "helpful_count", ascending: false }
        break
      default:
        orderBy = { column: "created_at", ascending: false }
    }

    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", params.id)
      .order(orderBy.column, { ascending: orderBy.ascending })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Reviews fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = reviews?.map((review) => review.user_id) || []
    const { data: userProfiles } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds)

    // Get review statistics
    const { data: stats } = await supabase.from("product_reviews").select("rating").eq("product_id", params.id)

    const totalReviews = stats?.length || 0
    const averageRating = totalReviews > 0 ? stats!.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: stats?.filter((review) => review.rating === rating).length || 0,
    }))

    return NextResponse.json({
      reviews:
        reviews?.map((review) => {
          const userProfile = userProfiles?.find((profile) => profile.user_id === review.user_id)
          return {
            ...review,
            user: {
              id: review.user_id,
              name: userProfile
                ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() || "Anonymous"
                : "Anonymous",
            },
          }
        }) || [],
      pagination: {
        page,
        limit,
        total: totalReviews,
        hasMore: offset + limit < totalReviews,
      },
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    })
  } catch (error) {
    console.error("Reviews API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rating, title, comment } = await request.json()

    if (!rating || !title || !comment) {
      return NextResponse.json({ error: "Rating, title, and comment are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if user has purchased this product (simplified check)
    const { data: orders } = await supabase
      .from("order_items")
      .select("id, order:orders!inner(user_id)")
      .eq("product_id", params.id)
      .eq("order.user_id", user.id)

    const verifiedPurchase = orders && orders.length > 0

    const { data: review, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: params.id,
        user_id: user.id,
        rating,
        title,
        comment,
        verified_purchase: verifiedPurchase,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Review insert error:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      review: {
        ...review,
        user: {
          id: user.id,
          name: userProfile
            ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() || "Anonymous"
            : "Anonymous",
        },
      },
    })
  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
