"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Store,
  Mail,
  Shield,
  Palette,
  CreditCard,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PlatformSettings {
  // General Settings
  site_name: string
  site_description: string
  site_logo_url: string
  site_favicon_url: string
  contact_email: string
  support_email: string
  phone_number: string
  address: string

  // Business Settings
  currency: string
  tax_rate: number
  shipping_fee: number
  free_shipping_threshold: number
  return_policy_days: number

  // Email Settings
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  email_from_name: string
  email_from_address: string

  // Security Settings
  enable_2fa: boolean
  session_timeout: number
  max_login_attempts: number
  password_min_length: number
  require_email_verification: boolean

  // Feature Flags
  enable_wishlist: boolean
  enable_reviews: boolean
  enable_inspirations: boolean
  enable_recommendations: boolean
  enable_notifications: boolean

  // Appearance Settings
  primary_color: string
  secondary_color: string
  accent_color: string
  theme_mode: string

  // Notification Settings
  email_notifications: boolean
  order_notifications: boolean
  low_stock_notifications: boolean
  new_user_notifications: boolean

  // Payment Settings
  payment_methods: string[]
  stripe_publishable_key: string
  stripe_secret_key: string
  razorpay_key_id: string
  razorpay_key_secret: string

  // Shipping Settings
  shipping_zones: Array<{
    name: string
    countries: string[]
    fee: number
    free_threshold: number
  }>

  // SEO Settings
  meta_title: string
  meta_description: string
  meta_keywords: string
  google_analytics_id: string
  facebook_pixel_id: string

  // Maintenance
  maintenance_mode: boolean
  maintenance_message: string
}

export function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({ title: "Error loading settings", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section?: string) => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, section }),
      })

      if (response.ok) {
        toast({ title: "Settings saved successfully" })
      } else {
        toast({ title: "Error saving settings", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({ title: "Error saving settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/reset", {
        method: "POST",
      })

      if (response.ok) {
        toast({ title: "Settings reset to defaults" })
        fetchSettings()
      } else {
        toast({ title: "Error resetting settings", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast({ title: "Error resetting settings", variant: "destructive" })
    }
  }

  const exportSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `platform-settings-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({ title: "Settings exported successfully" })
      }
    } catch (error) {
      console.error("Error exporting settings:", error)
      toast({ title: "Error exporting settings", variant: "destructive" })
    }
  }

  const updateSetting = (key: string, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load settings</h3>
        <Button onClick={fetchSettings}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground">Configure your MANUS platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={() => saveSettings()} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => updateSetting("site_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => updateSetting("contact_email", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => updateSetting("site_description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={settings.phone_number}
                    onChange={(e) => updateSetting("phone_number", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => updateSetting("support_email", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => updateSetting("address", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("general")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Business Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting("tax_rate", Number.parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping_fee">Default Shipping Fee</Label>
                  <Input
                    id="shipping_fee"
                    type="number"
                    value={settings.shipping_fee}
                    onChange={(e) => updateSetting("shipping_fee", Number.parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="free_shipping_threshold">Free Shipping Threshold</Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => updateSetting("free_shipping_threshold", Number.parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="return_policy_days">Return Policy (Days)</Label>
                <Input
                  id="return_policy_days"
                  type="number"
                  value={settings.return_policy_days}
                  onChange={(e) => updateSetting("return_policy_days", Number.parseInt(e.target.value))}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("business")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting("secondary_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting("secondary_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.accent_color}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="theme_mode">Theme Mode</Label>
                <Select value={settings.theme_mode} onValueChange={(value) => updateSetting("theme_mode", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("appearance")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_wishlist">Wishlist Feature</Label>
                    <p className="text-sm text-muted-foreground">Allow users to save products to wishlist</p>
                  </div>
                  <Switch
                    id="enable_wishlist"
                    checked={settings.enable_wishlist}
                    onCheckedChange={(checked) => updateSetting("enable_wishlist", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_reviews">Product Reviews</Label>
                    <p className="text-sm text-muted-foreground">Enable product reviews and ratings</p>
                  </div>
                  <Switch
                    id="enable_reviews"
                    checked={settings.enable_reviews}
                    onCheckedChange={(checked) => updateSetting("enable_reviews", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_inspirations">Outfit Inspirations</Label>
                    <p className="text-sm text-muted-foreground">Allow users to share outfit inspirations</p>
                  </div>
                  <Switch
                    id="enable_inspirations"
                    checked={settings.enable_inspirations}
                    onCheckedChange={(checked) => updateSetting("enable_inspirations", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_recommendations">Product Recommendations</Label>
                    <p className="text-sm text-muted-foreground">Show AI-powered product recommendations</p>
                  </div>
                  <Switch
                    id="enable_recommendations"
                    checked={settings.enable_recommendations}
                    onCheckedChange={(checked) => updateSetting("enable_recommendations", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable browser push notifications</p>
                  </div>
                  <Switch
                    id="enable_notifications"
                    checked={settings.enable_notifications}
                    onCheckedChange={(checked) => updateSetting("enable_notifications", checked)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("features")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Feature Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_2fa">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <Switch
                    id="enable_2fa"
                    checked={settings.enable_2fa}
                    onCheckedChange={(checked) => updateSetting("enable_2fa", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_email_verification">Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    id="require_email_verification"
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked) => updateSetting("require_email_verification", checked)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => updateSetting("session_timeout", Number.parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting("max_login_attempts", Number.parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="password_min_length">Min Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={settings.password_min_length}
                    onChange={(e) => updateSetting("password_min_length", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("security")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => updateSetting("smtp_host", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => updateSetting("smtp_port", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_username">SMTP Username</Label>
                  <Input
                    id="smtp_username"
                    value={settings.smtp_username}
                    onChange={(e) => updateSetting("smtp_username", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => updateSetting("smtp_password", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email_from_name">From Name</Label>
                  <Input
                    id="email_from_name"
                    value={settings.email_from_name}
                    onChange={(e) => updateSetting("email_from_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email_from_address">From Address</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    value={settings.email_from_address}
                    onChange={(e) => updateSetting("email_from_address", e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Notification Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order_notifications">Order Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify admins of new orders</p>
                    </div>
                    <Switch
                      id="order_notifications"
                      checked={settings.order_notifications}
                      onCheckedChange={(checked) => updateSetting("order_notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="low_stock_notifications">Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">Email alerts for low stock products</p>
                    </div>
                    <Switch
                      id="low_stock_notifications"
                      checked={settings.low_stock_notifications}
                      onCheckedChange={(checked) => updateSetting("low_stock_notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new_user_notifications">New User Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify admins of new user registrations</p>
                    </div>
                    <Switch
                      id="new_user_notifications"
                      checked={settings.new_user_notifications}
                      onCheckedChange={(checked) => updateSetting("new_user_notifications", checked)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("email")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Enabled Payment Methods</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {["stripe", "razorpay", "paypal", "cod"].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={method}
                        checked={settings.payment_methods.includes(method)}
                        onChange={(e) => {
                          const methods = e.target.checked
                            ? [...settings.payment_methods, method]
                            : settings.payment_methods.filter((m) => m !== method)
                          updateSetting("payment_methods", methods)
                        }}
                      />
                      <Label htmlFor={method} className="capitalize">
                        {method === "cod" ? "Cash on Delivery" : method}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Stripe Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
                    <Input
                      id="stripe_publishable_key"
                      value={settings.stripe_publishable_key}
                      onChange={(e) => updateSetting("stripe_publishable_key", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripe_secret_key">Secret Key</Label>
                    <Input
                      id="stripe_secret_key"
                      type="password"
                      value={settings.stripe_secret_key}
                      onChange={(e) => updateSetting("stripe_secret_key", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Razorpay Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razorpay_key_id">Key ID</Label>
                    <Input
                      id="razorpay_key_id"
                      value={settings.razorpay_key_id}
                      onChange={(e) => updateSetting("razorpay_key_id", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="razorpay_key_secret">Key Secret</Label>
                    <Input
                      id="razorpay_key_secret"
                      type="password"
                      value={settings.razorpay_key_secret}
                      onChange={(e) => updateSetting("razorpay_key_secret", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("payments")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
                    </div>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => updateSetting("maintenance_mode", checked)}
                  />
                </div>
                {settings.maintenance_mode && (
                  <div>
                    <Label htmlFor="maintenance_message">Maintenance Message</Label>
                    <Textarea
                      id="maintenance_message"
                      value={settings.maintenance_message}
                      onChange={(e) => updateSetting("maintenance_message", e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">SEO Settings</h4>
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={settings.meta_title}
                    onChange={(e) => updateSetting("meta_title", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={settings.meta_description}
                    onChange={(e) => updateSetting("meta_description", e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    value={settings.meta_keywords}
                    onChange={(e) => updateSetting("meta_keywords", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                    <Input
                      id="google_analytics_id"
                      value={settings.google_analytics_id}
                      onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                    <Input
                      id="facebook_pixel_id"
                      value={settings.facebook_pixel_id}
                      onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("advanced")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Advanced Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
