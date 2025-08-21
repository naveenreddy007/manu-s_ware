"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MobileHeader } from "./mobile-header"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { createClient } from "@/lib/supabase/client"

interface MobileLayoutWrapperProps {
  children: React.ReactNode
}

export function MobileLayoutWrapper({ children }: MobileLayoutWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchCartCount()
    fetchNotifications()

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchCartCount = async () => {
    try {
      const response = await fetch("/api/cart/count")
      if (response.ok) {
        const data = await response.json()
        setCartCount(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
    }
  }

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/notifications/count")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader user={user} notifications={notifications} />
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileBottomNav user={user} cartCount={cartCount} />
    </div>
  )
}
