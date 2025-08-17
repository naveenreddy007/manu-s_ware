import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { userIds } = await request.json()
    const supabase = createClient()

    let query = supabase.from("user_profiles").select("*").order("created_at", { ascending: false })

    if (userIds && userIds.length > 0) {
      query = query.in("user_id", userIds)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get auth users for email data
    const { data: authUsers } = await supabase.auth.admin.listUsers()

    const usersWithEmails = users.map((user) => {
      const authUser = authUsers.users.find((u) => u.id === user.user_id)
      return {
        ...user,
        email: authUser?.email || "Unknown",
      }
    })

    // Generate CSV content
    const csvHeaders = ["User ID", "First Name", "Last Name", "Email", "Phone", "Role", "Status", "Join Date"]

    const csvRows = usersWithEmails.map((user) => [
      user.user_id,
      user.first_name || "",
      user.last_name || "",
      user.email,
      user.phone || "",
      user.role,
      user.is_active ? "Active" : "Inactive",
      new Date(user.created_at).toLocaleDateString("en-IN"),
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
