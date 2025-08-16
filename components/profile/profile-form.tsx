"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  preferred_style?: string
  size_shirt?: string
  size_pants?: string
  size_shoes?: string
  notification_preferences?: {
    email_recommendations: boolean
    email_promotions: boolean
    push_notifications: boolean
  }
}

interface UserData {
  id: string
  email: string
  created_at: string
}

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileData>({})
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()

      if (response.ok) {
        setProfile(data.profile || {})
        setUser(data.user)
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = (field: keyof ProfileData, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const updateNotificationPreference = (key: string, value: boolean) => {
    setProfile((prev) => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="member-since">Member Since</Label>
              <Input
                id="member-since"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Tell us more about yourself</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={profile.first_name || ""}
                onChange={(e) => updateProfile("first_name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={profile.last_name || ""}
                onChange={(e) => updateProfile("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => updateProfile("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-of-birth">Date of Birth</Label>
              <Input
                id="date-of-birth"
                type="date"
                value={profile.date_of_birth || ""}
                onChange={(e) => updateProfile("date_of_birth", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preferred-style">Preferred Style</Label>
            <Select
              value={profile.preferred_style || ""}
              onValueChange={(value) => updateProfile("preferred_style", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preferred style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="streetwear">Streetwear</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Size Information */}
      <Card>
        <CardHeader>
          <CardTitle>Size Information</CardTitle>
          <CardDescription>Help us recommend the right sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="size-shirt">Shirt Size</Label>
              <Select value={profile.size_shirt || ""} onValueChange={(value) => updateProfile("size_shirt", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="size-pants">Pants Size</Label>
              <Input
                id="size-pants"
                placeholder="e.g., 32x34"
                value={profile.size_pants || ""}
                onChange={(e) => updateProfile("size_pants", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="size-shoes">Shoe Size</Label>
              <Input
                id="size-shoes"
                placeholder="e.g., 10.5"
                value={profile.size_shoes || ""}
                onChange={(e) => updateProfile("size_shoes", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you'd like to hear from us</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Recommendations</Label>
              <p className="text-sm text-muted-foreground">Receive personalized styling recommendations via email</p>
            </div>
            <Switch
              checked={profile.notification_preferences?.email_recommendations ?? true}
              onCheckedChange={(checked) => updateNotificationPreference("email_recommendations", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Promotional Emails</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about sales, new arrivals, and special offers
              </p>
            </div>
            <Switch
              checked={profile.notification_preferences?.email_promotions ?? false}
              onCheckedChange={(checked) => updateNotificationPreference("email_promotions", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your orders and recommendations
              </p>
            </div>
            <Switch
              checked={profile.notification_preferences?.push_notifications ?? true}
              onCheckedChange={(checked) => updateNotificationPreference("push_notifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  )
}
