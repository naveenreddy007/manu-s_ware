import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { orderId, affiliateCode, amount } = await request.json()

    const supabase = createServerClient()

    // Get affiliate information
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("user_id, commission_rate, payment_method")
      .eq("code", affiliateCode)
      .single()

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 400 })
    }

    // Calculate commission
    const commissionAmount = amount * (affiliate.commission_rate / 100)
    const platformAmount = amount - commissionAmount

    // In a real implementation, this would integrate with payment processors
    // to split payments between affiliate and platform
    const paymentResult = await processDirectPayment({
      affiliateUserId: affiliate.user_id,
      commissionAmount,
      platformAmount,
      orderId,
      paymentMethod: affiliate.payment_method,
    })

    // Record the transaction
    await supabase.from("affiliate_transactions").insert({
      affiliate_id: affiliate.user_id,
      order_id: orderId,
      commission_amount: commissionAmount,
      status: paymentResult.success ? "completed" : "failed",
      payment_reference: paymentResult.reference,
    })

    return NextResponse.json({
      success: paymentResult.success,
      commissionAmount,
      platformAmount,
      paymentReference: paymentResult.reference,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}

async function processDirectPayment({
  affiliateUserId,
  commissionAmount,
  platformAmount,
  orderId,
  paymentMethod,
}: {
  affiliateUserId: string
  commissionAmount: number
  platformAmount: number
  orderId: string
  paymentMethod: string
}) {
  // This would integrate with payment processors like Stripe Connect, PayPal, etc.
  // to directly transfer commission to affiliate's account

  try {
    // Simulate payment processing
    // In production, this would call actual payment APIs
    const reference = `pay_${Date.now()}_${orderId}`

    // Log the payment for tracking
    console.log(`[v0] Direct payment processed:`, {
      affiliate: affiliateUserId,
      commission: commissionAmount,
      platform: platformAmount,
      reference,
    })

    return {
      success: true,
      reference,
    }
  } catch (error) {
    console.error("Direct payment failed:", error)
    return {
      success: false,
      reference: null,
    }
  }
}
