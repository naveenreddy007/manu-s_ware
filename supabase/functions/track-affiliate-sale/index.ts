import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    // Parse the webhook payload
    const payload = await req.json()
    console.log("[v0] Webhook payload received:", payload)

    // Extract order data from webhook
    const { record: order } = payload
    if (!order) {
      throw new Error("No order record found in webhook payload")
    }

    const { id: order_id, total_price, metadata } = order
    console.log("[v0] Processing order:", { order_id, total_price, metadata })

    const creator_id = metadata?.creator_id
    if (!creator_id) {
      console.log("[v0] No creator_id found in order metadata, skipping affiliate tracking")
      return new Response(JSON.stringify({ message: "No affiliate creator found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log("[v0] Using creator_id from metadata:", creator_id)

    // Calculate commission amount (10% of total_price)
    const commission_amount = Math.round(total_price * 0.1 * 100) / 100 // Round to 2 decimal places

    // Insert affiliate sale record
    const { data: affiliateSale, error: insertError } = await supabaseClient
      .from("affiliate_sales")
      .insert({
        creator_id,
        order_id,
        commission_amount,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting affiliate sale:", insertError)
      throw new Error("Failed to create affiliate sale record")
    }

    console.log("[v0] Affiliate sale tracked successfully:", affiliateSale)

    return new Response(
      JSON.stringify({
        success: true,
        affiliate_sale: affiliateSale,
        message: "Affiliate sale tracked successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] Error in track-affiliate-sale function:", error)

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
