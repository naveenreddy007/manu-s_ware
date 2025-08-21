import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] System health check API called")
    await requireAdmin()

    const supabase = createClient()
    const startTime = Date.now()

    // Test database connectivity
    const { data: dbTest, error: dbError } = await supabase.from("user_profiles").select("count").limit(1)

    const dbResponseTime = Date.now() - startTime

    // Check storage bucket
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

    // System health metrics
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbError ? "error" : "healthy",
          responseTime: dbResponseTime,
          error: dbError?.message || null,
        },
        storage: {
          status: storageError ? "error" : "healthy",
          bucketsCount: buckets?.length || 0,
          error: storageError?.message || null,
        },
        auth: {
          status: "healthy", // If we got here, auth is working
          responseTime: 0,
        },
      },
      performance: {
        averageResponseTime: dbResponseTime,
        uptime: "99.9%", // Placeholder
      },
    }

    // Determine overall status
    const hasErrors = Object.values(health.services).some((service) => service.status === "error")
    health.status = hasErrors ? "degraded" : "healthy"

    console.log("[v0] System health check completed:", health.status)
    return NextResponse.json(health, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in system health check:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          database: { status: "error", error: error.message },
          storage: { status: "unknown" },
          auth: { status: "error", error: error.message },
        },
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
