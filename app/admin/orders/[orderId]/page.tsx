"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck, Save, Phone, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  size?: string
  products: {
    name: string
    image_url: string
    category: string
  }
}

interface OrderDetails {
  id: string
  order_number: string
  user_id: string
  status: string
  total_amount: number
  subtotal: number
  tax_amount: number
  shipping_cost: number
  payment_status: string
  payment_method: string
  tracking_number?: string
  shipping_first_name: string
  shipping_last_name: string
  shipping_email?: string
  shipping_phone?: string
  shipping_address_line1: string
  shipping_address_line2?: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string
  created_at: string
  updated_at: string
  estimated_delivery?: string
  user_profiles?: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  order_items: OrderItem[]
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

export default function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [status, setStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchOrderDetails()
  }, [params.orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.orderId}/details`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        setStatus(data.status)
        setTrackingNumber(data.tracking_number || "")
        setNotes(data.notes || "")
      } else {
        toast({
          title: "Error fetching order details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast({
        title: "Error fetching order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrder = async () => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          tracking_number: trackingNumber,
          notes,
        }),
      })

      if (response.ok) {
        toast({ title: "Order updated successfully" })
        fetchOrderDetails()
      } else {
        toast({ title: "Error updating order", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({ title: "Error updating order", variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Order not found</h3>
          <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
          <Link href="/admin/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
          <p className="text-muted-foreground">Placed on {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.order_items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={item.products.image_url || "/placeholder.svg?height=80&width=80&query=product"}
                      alt={item.products.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.products.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.products.category}</p>
                      {item.size && <p className="text-sm">Size: {item.size}</p>}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.unit_price)} each</p>
                          <p className="font-medium">{formatCurrency(item.total_price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p>
                    {order.shipping_first_name} {order.shipping_last_name}
                  </p>
                </div>
                {order.shipping_email && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <p>{order.shipping_email}</p>
                  </div>
                )}
                {order.shipping_phone && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <p>{order.shipping_phone}</p>
                  </div>
                )}
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
              <div className="space-y-1">
                <p>{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                <p>
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                </p>
                <p>{order.shipping_country}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Management */}
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Method</span>
                  <span className="capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Status</span>
                  <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Order Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this order"
                  rows={3}
                />
              </div>

              <Button onClick={handleUpdateOrder} disabled={updating} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {updating ? "Updating..." : "Update Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
