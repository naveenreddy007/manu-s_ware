import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email"
import { getUser } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = await emailService.sendOrderConfirmation(body)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error sending order confirmation email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
