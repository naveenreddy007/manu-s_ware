"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Truck, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    size: string
    product: {
      id: string
      name: string
      images: string[]
    }
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchOrders()
  }, [])

  const checkAuthAndFetchOrders = async () => {
    try {
      console.log("[v0] Checking auth for orders page...")
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log("[v0] Orders page auth result:", { user: user?.id, error })

      if (!user) {
        console.log("[v0] No user found, redirecting to login")
        router.push("/auth/login?redirect=/orders")
        return
      }

      setUser(user)
      await fetchOrders()
    } catch (error) {
      console.error("[v0] Auth check failed on orders page:", error)
      router.push("/auth/login?redirect=/orders")
    }
  }

  const fetchOrders = async () => {
    try {
      console.log("[v0] Fetching orders...")
      const response = await fetch("/api/orders")

      if (response.status === 401) {
        console.log("[v0] Unauthorized access to orders")
        router.push("/auth/login?redirect=/orders")
        return
      }

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Orders loaded:", data.orders?.length || 0)
        setOrders(data.orders || [])
      } else {
        console.error("[v0] Failed to fetch orders:", response.status)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-black text-foreground">Order History</h1>
              <p className="text-muted-foreground">Track and manage your orders</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-8">Start shopping to see your orders here.</p>
              <Button asChild>
                <Link href="/">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order {order.order_number}</CardTitle>
                        <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden">
                              <Image
                                src={item.product.images[0] || "/placeholder.svg?height=64&width=64&query=product"}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{item.product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Size: {item.size} • Quantity: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">${item.unit_price.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Total */}
                      <div className="border-t border-border pt-4 flex items-center justify-between">
                        <span className="font-medium text-foreground">Total</span>
                        <span className="text-xl font-bold text-foreground">${order.total_amount.toFixed(2)}</span>
                      </div>

                      {/* Order Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders/${order.id}`}>View Details</Link>
                        </Button>
                        {order.status === "delivered" && (
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
