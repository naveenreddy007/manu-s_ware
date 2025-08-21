import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Create quick payment session
    const { data: paymentSession, error } = await supabase
      .from("payment_sessions")
      .insert({
        user_id: user.id,
        amount,
        currency: "INR",
        payment_type: "quick_pay",
        status: "pending",
        metadata: {
          created_via: "mobile_quick_pay",
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating payment session:", error)
      return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 })
    }

    // In a real implementation, you would integrate with a payment gateway like Razorpay
    // For now, we'll return a mock checkout URL
    const checkoutUrl = `/checkout/quick-pay/${paymentSession.id}`

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      session_id: paymentSession.id,
    })
  } catch (error) {
    console.error("Quick payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
