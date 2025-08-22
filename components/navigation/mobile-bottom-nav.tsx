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
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/40 pb-safe shadow-lg">
          <div className="grid grid-cols-5 gap-0 px-2 py-2">
            {/* Home */}
            <Link
              href="/"
              className="flex flex-col items-center justify-center p-2 min-h-[64px] rounded-lg transition-all duration-200 hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200",
                  isActive("/") ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Home className="h-5 w-5" />
                <span className="text-xs font-medium leading-none">Home</span>
              </div>
            </Link>

            {/* Search */}
            <Link
              href="/search"
              className="flex flex-col items-center justify-center p-2 min-h-[64px] rounded-lg transition-all duration-200 hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200",
                  isActive("/search") ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Search className="h-5 w-5" />
                <span className="text-xs font-medium leading-none">Search</span>
              </div>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex flex-col items-center justify-center p-2 min-h-[64px] rounded-lg transition-all duration-200 hover:bg-muted/50 relative"
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200",
                  isActive("/cart") ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-2 border-background rounded-full">
                      {cartCount > 99 ? "99+" : cartCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium leading-none">Cart</span>
              </div>
            </Link>

            {/* Wishlist/Favorites */}
            {user ? (
              <Link
                href="/wishlist"
                className="flex flex-col items-center justify-center p-2 min-h-[64px] rounded-lg transition-all duration-200 hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-200",
                    isActive("/wishlist") ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-xs font-medium leading-none">Wishlist</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex flex-col items-center justify-center p-2 min-h-[64px] rounded-lg transition-all duration-200 hover:bg-muted/50"
              >
                <div className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <User className="h-5 w-5" />
                  <span className="text-xs font-medium leading-none">Login</span>
                </div>
              </Link>
            )}

            {/* More Menu */}
            <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center p-2 min-h-[64px] rounded-lg transition-all duration-200 hover:bg-muted/50">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Menu className="h-5 w-5" />
                    <span className="text-xs font-medium leading-none">More</span>
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl border-t-0">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                  {user && (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/wardrobe"
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Package className="h-7 w-7 text-primary" />
                        <span className="text-sm font-medium text-center">Wardrobe</span>
                      </Link>

                      <Link
                        href="/recommendations"
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Sparkles className="h-7 w-7 text-primary" />
                        <span className="text-sm font-medium text-center">AI Styling</span>
                      </Link>

                      <Link
                        href="/outfit-planner"
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Palette className="h-7 w-7 text-primary" />
                        <span className="text-sm font-medium text-center">Outfit Planner</span>
                      </Link>

                      <Link
                        href="/inspiration"
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Palette className="h-7 w-7 text-primary" />
                        <span className="text-sm font-medium text-center">Inspiration</span>
                      </Link>

                      <Link
                        href="/orders"
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <Package className="h-7 w-7 text-primary" />
                        <span className="text-sm font-medium text-center">Orders</span>
                      </Link>

                      <Link
                        href="/profile"
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <User className="h-7 w-7 text-primary" />
                        <span className="text-sm font-medium text-center">Profile</span>
                      </Link>
                    </div>
                  )}

                  {/* Quick Pay Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold text-foreground">Quick Pay</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {quickPayAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="lg"
                          className="h-16 flex flex-col gap-2 bg-transparent hover:bg-primary/5 hover:border-primary/30"
                          onClick={() => handleQuickPay(amount)}
                        >
                          <CreditCard className="h-5 w-5" />
                          <span className="text-sm font-medium">₹{amount}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-16 flex flex-col gap-2 bg-transparent hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("quickAddToCart"))
                          setIsMoreOpen(false)
                        }}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm font-medium">Quick Add</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="h-16 flex flex-col gap-2 bg-transparent hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => {
                          window.location.href = "/checkout"
                        }}
                      >
                        <Zap className="h-5 w-5" />
                        <span className="text-sm font-medium">Quick Buy</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="h-[88px] md:hidden" />
    </>
  )
}
