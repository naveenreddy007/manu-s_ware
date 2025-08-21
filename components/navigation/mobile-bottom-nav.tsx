"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Search,
  ShoppingBag,
  Heart,
  User,
  Sparkles,
  Palette,
  Package,
  CreditCard,
  Zap,
  Plus,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileBottomNavProps {
  user?: any
  cartCount?: number
}

export function MobileBottomNav({ user, cartCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [quickPayAmount, setQuickPayAmount] = useState(0)
  const [showQuickPay, setShowQuickPay] = useState(false)

  // Quick payment amounts for micro-transactions
  const quickPayAmounts = [10, 25, 50, 100, 250, 500]

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  const handleQuickPay = async (amount: number) => {
    try {
      // Implement quick payment logic here
      const response = await fetch("/api/payments/quick-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        const data = await response.json()
        // Handle payment success
        window.location.href = data.checkout_url
      }
    } catch (error) {
      console.error("Quick payment failed:", error)
    }
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-background/95 backdrop-blur-md border-t border-border">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {/* Home */}
            <Link href="/" className="flex flex-col items-center justify-center p-2">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive("/") ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Home className="h-5 w-5" />
                <span className="text-xs font-medium">Home</span>
              </div>
            </Link>

            {/* Search */}
            <Link href="/search" className="flex flex-col items-center justify-center p-2">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive("/search") ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Search className="h-5 w-5" />
                <span className="text-xs font-medium">Search</span>
              </div>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="flex flex-col items-center justify-center p-2 relative">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive("/cart") ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                      {cartCount > 99 ? "99+" : cartCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">Cart</span>
              </div>
            </Link>

            {/* Wishlist/Favorites */}
            {user ? (
              <Link href="/wishlist" className="flex flex-col items-center justify-center p-2">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors",
                    isActive("/wishlist") ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-xs font-medium">Wishlist</span>
                </div>
              </Link>
            ) : (
              <Link href="/auth/login" className="flex flex-col items-center justify-center p-2">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <User className="h-5 w-5" />
                  <span className="text-xs font-medium">Login</span>
                </div>
              </Link>
            )}

            {/* More Menu */}
            <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center p-2">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Menu className="h-5 w-5" />
                    <span className="text-xs font-medium">More</span>
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {user && (
                    <>
                      <Link
                        href="/wardrobe"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Package className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Wardrobe</span>
                      </Link>

                      <Link
                        href="/recommendations"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Sparkles className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">AI Styling</span>
                      </Link>

                      <Link
                        href="/outfit-planner"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Palette className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Outfit Planner</span>
                      </Link>

                      <Link
                        href="/inspiration"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Palette className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Inspiration</span>
                      </Link>

                      <Link
                        href="/orders"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Package className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Orders</span>
                      </Link>

                      <Link
                        href="/profile"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <User className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">Profile</span>
                      </Link>
                    </>
                  )}

                  {/* Quick Pay Section */}
                  <div className="col-span-2 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">Quick Pay</h3>
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {quickPayAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          className="h-12 flex flex-col gap-1 bg-transparent"
                          onClick={() => handleQuickPay(amount)}
                        >
                          <CreditCard className="h-4 w-4" />
                          <span className="text-xs">₹{amount}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="col-span-2 mt-4">
                    <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex items-center gap-2 bg-transparent"
                        onClick={() => {
                          // Add to cart last viewed item
                          window.dispatchEvent(new CustomEvent("quickAddToCart"))
                          setIsMoreOpen(false)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-xs">Quick Add</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex items-center gap-2 bg-transparent"
                        onClick={() => {
                          // Quick checkout
                          window.location.href = "/checkout"
                        }}
                      >
                        <Zap className="h-4 w-4" />
                        <span className="text-xs">Quick Buy</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Bottom padding for content */}
      <div className="h-20 md:hidden" />
    </>
  )
}
