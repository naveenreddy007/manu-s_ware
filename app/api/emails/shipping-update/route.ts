import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email"
import { isAdmin } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = await emailService.sendShippingUpdate(body)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error sending shipping update email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
