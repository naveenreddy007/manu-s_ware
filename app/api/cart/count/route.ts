import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ count: 0 })
  }

  const { data: cartItems, error } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ count: 0 })
  }

  const totalCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return NextResponse.json({ count: totalCount })
}
