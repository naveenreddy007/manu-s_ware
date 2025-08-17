import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

export async function GET() {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: settings, error } = await supabase.from("platform_settings").select("*").single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      exported_by: user.id,
      settings: settings?.settings || {},
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="platform-settings-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
