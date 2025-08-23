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
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchNotifications()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
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
      <main className="pb-[80px] md:pb-0 min-h-[calc(100vh-140px)]">{children}</main>
      <MobileBottomNav user={user} />
    </div>
  )
}
