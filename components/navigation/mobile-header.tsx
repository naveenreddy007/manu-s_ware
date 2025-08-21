"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Search, X } from "lucide-react"
import Link from "next/link"
import { CartSidebar } from "@/components/cart/cart-sidebar"

interface MobileHeaderProps {
  user?: any
  notifications?: number
}

export function MobileHeader({ user, notifications = 0 }: MobileHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-heading font-black text-primary">MANUS</h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>

            {/* Notifications */}
            {user && (
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                    {notifications > 9 ? "9+" : notifications}
                  </Badge>
                )}
              </Button>
            )}

            {/* Cart */}
            <CartSidebar />
          </div>
        </div>

        {/* Expandable Search Bar */}
        {isSearchOpen && (
          <div className="border-t bg-background px-4 py-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products, brands, styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" className="px-4">
                Search
              </Button>
            </form>
          </div>
        )}
      </header>
    </>
  )
}
