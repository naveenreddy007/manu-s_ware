import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser, isAdmin } from "@/lib/auth-utils"

const defaultSettings = {
  // General Settings
  site_name: "MANUS",
  site_description: "Premium menswear and fashion platform",
  site_logo_url: "",
  site_favicon_url: "",
  contact_email: "contact@manus.com",
  support_email: "support@manus.com",
  phone_number: "+91 9876543210",
  address: "123 Fashion Street, Mumbai, Maharashtra 400001, India",

  // Business Settings
  currency: "INR",
  tax_rate: 18.0,
  shipping_fee: 99,
  free_shipping_threshold: 1999,
  return_policy_days: 30,

  // Email Settings
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  email_from_name: "MANUS",
  email_from_address: "noreply@manus.com",

  // Security Settings
  enable_2fa: false,
  session_timeout: 1440,
  max_login_attempts: 5,
  password_min_length: 8,
  require_email_verification: true,

  // Feature Flags
  enable_wishlist: true,
  enable_reviews: true,
  enable_inspirations: true,
  enable_recommendations: true,
  enable_notifications: true,

  // Appearance Settings
  primary_color: "#000000",
  secondary_color: "#666666",
  accent_color: "#ff6b35",
  theme_mode: "light",

  // Notification Settings
  email_notifications: true,
  order_notifications: true,
  low_stock_notifications: true,
  new_user_notifications: false,

  // Payment Settings
  payment_methods: ["stripe", "razorpay", "cod"],
  stripe_publishable_key: "",
  stripe_secret_key: "",
  razorpay_key_id: "",
  razorpay_key_secret: "",

  // Shipping Settings
  shipping_zones: [
    {
      name: "India",
      countries: ["IN"],
      fee: 99,
      free_threshold: 1999,
    },
  ],

  // SEO Settings
  meta_title: "MANUS - Premium Menswear & Fashion",
  meta_description: "Discover premium menswear and fashion at MANUS. Shop the latest trends and timeless classics.",
  meta_keywords: "menswear, fashion, clothing, premium, style",
  google_analytics_id: "",
  facebook_pixel_id: "",

  // Maintenance
  maintenance_mode: false,
  maintenance_message: "We're currently performing maintenance. Please check back soon.",
}

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

    // Return default settings if no settings exist
    if (!settings) {
      return NextResponse.json(defaultSettings)
    }

    // Merge with defaults to ensure all keys exist
    const mergedSettings = { ...defaultSettings, ...settings.settings }
    return NextResponse.json(mergedSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from("platform_settings")
      .upsert({
        id: 1,
        settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
