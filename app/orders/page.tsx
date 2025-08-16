"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Package, Truck, CheckCircle, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Address {
  id: string
  full_name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  shipping_address?: Address
  billing_address?: Address
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
  const [activeTab, setActiveTab] = useState("all")
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchOrders()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrders(activeTab)
    }
  }, [activeTab, user])

  const checkAuthAndFetchOrders = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login?redirect=/orders")
      return
    }

    setUser(user)
    await fetchOrders("all")
  }

  const fetchOrders = async (status = "all") => {
    try {
      const url = `/api/orders${status !== "all" ? `?status=${status}` : ""}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const cancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Order cancelled successfully")
        await fetchOrders(activeTab)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to cancel order")
      }
    } catch (error) {
      toast.error("Failed to cancel order")
    } finally {
      setCancellingOrder(null)
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
      case "cancelled":
        return <X className="h-4 w-4" />
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

  const formatAddress = (address?: Address) => {
    if (!address) return "Address not available"
    return `${address.full_name}, ${address.address_line_1}${address.address_line_2 ? `, ${address.address_line_2}` : ""}, ${address.city}, ${address.state} ${address.postal_code}`
  }

  const getOrderCounts = () => {
    return {
      all: orders.length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const counts = getOrderCounts()
  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({counts.confirmed})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({counts.processing})</TabsTrigger>
              <TabsTrigger value="shipped">Shipped ({counts.shipped})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({counts.delivered})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                {activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
              </h2>
              <p className="text-muted-foreground mb-8">
                {activeTab === "all"
                  ? "Start shopping to see your orders here."
                  : `You don't have any ${activeTab} orders.`}
              </p>
              <Button asChild>
                <Link href="/">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
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

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="border-t border-border pt-4">
                          <h4 className="font-medium text-foreground mb-2">Shipping Address</h4>
                          <p className="text-sm text-muted-foreground">{formatAddress(order.shipping_address)}</p>
                        </div>
                      )}

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
                        {["confirmed", "processing"].includes(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelOrder(order.id)}
                            disabled={cancellingOrder === order.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {cancellingOrder === order.id ? "Cancelling..." : "Cancel Order"}
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
