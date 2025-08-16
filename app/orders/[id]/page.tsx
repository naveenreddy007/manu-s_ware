"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, CreditCard, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

interface OrderDetails {
  id: string
  order_number: string
  status: string
  total_amount: number
  shipping_cost: number
  tax_amount: number
  subtotal: number
  created_at: string
  shipping_address: {
    full_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
  billing_address: {
    full_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    size: string
    product: {
      id: string
      name: string
      images: string[]
      description: string
    }
  }>
}

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  useEffect(() => {
    checkAuthAndFetchOrder()
  }, [orderId])

  const checkAuthAndFetchOrder = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/auth/login?redirect=/orders/${orderId}`)
      return
    }

    await fetchOrderDetails()
  }

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        const orderData = data.order
        if (orderData.shipping_address && typeof orderData.shipping_address === "string") {
          orderData.shipping_address = JSON.parse(orderData.shipping_address)
        }
        if (orderData.billing_address && typeof orderData.billing_address === "string") {
          orderData.billing_address = JSON.parse(orderData.billing_address)
        }
        setOrder(orderData)
      } else if (response.status === 404) {
        setError("Order not found")
      } else {
        setError("Failed to load order details")
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error)
      setError("Failed to load order details")
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-3xl font-heading font-black text-foreground">Order Details</h1>
            </div>
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">{error || "Order not found"}</h2>
              <p className="text-muted-foreground mb-8">
                The order you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button asChild>
                <Link href="/orders">Back to Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-black text-foreground">Order {order.order_number}</h1>
              <p className="text-muted-foreground">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className="ml-auto">
              <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                {getStatusIcon(order.status)}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden">
                          <Image
                            src={item.product.images[0] || "/placeholder.svg?height=80&width=80&query=product"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.product.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Size: {item.size} • Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">${item.unit_price.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">${order.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">${order.tax_amount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="text-xl font-bold text-foreground">${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shipping_address ? (
                    <div className="text-sm">
                      <p className="font-medium">{order.shipping_address.full_name || "N/A"}</p>
                      <p>{order.shipping_address.address_line_1 || "N/A"}</p>
                      {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                      <p>
                        {order.shipping_address.city || "N/A"}, {order.shipping_address.state || "N/A"}{" "}
                        {order.shipping_address.postal_code || "N/A"}
                      </p>
                      <p>{order.shipping_address.country || "N/A"}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shipping address available</p>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.billing_address ? (
                    <div className="text-sm">
                      <p className="font-medium">{order.billing_address.full_name || "N/A"}</p>
                      <p>{order.billing_address.address_line_1 || "N/A"}</p>
                      {order.billing_address.address_line_2 && <p>{order.billing_address.address_line_2}</p>}
                      <p>
                        {order.billing_address.city || "N/A"}, {order.billing_address.state || "N/A"}{" "}
                        {order.billing_address.postal_code || "N/A"}
                      </p>
                      <p>{order.billing_address.country || "N/A"}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No billing address available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
