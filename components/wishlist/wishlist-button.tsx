"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface WishlistButtonProps {
  productId: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function WishlistButton({ productId, variant = "ghost", size = "icon", className }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      checkWishlistStatus()
    }
  }, [user, productId])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkWishlistStatus = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single()

      if (!error && data) {
        setIsInWishlist(true)
      }
    } catch (error) {
      // Item not in wishlist
      setIsInWishlist(false)
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/wishlist", {
        method: isInWishlist ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
      })

      if (response.ok) {
        setIsInWishlist(!isInWishlist)
        toast({
          title: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
          description: isInWishlist ? "Item removed from your wishlist" : "Item added to your wishlist successfully",
        })
      } else {
        const data = await response.json()
        if (response.status === 409) {
          setIsInWishlist(true)
        } else {
          throw new Error(data.error || "Failed to update wishlist")
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wishlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={toggleWishlist} disabled={loading}>
      <Heart
        className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"} ${
          loading ? "animate-pulse" : ""
        }`}
      />
      {size !== "icon" && <span className="ml-2">{isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</span>}
    </Button>
  )
}
