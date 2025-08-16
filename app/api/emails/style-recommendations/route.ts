import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await emailService.sendStyleRecommendations(body)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error sending style recommendations email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
