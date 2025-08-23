"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ShoppingBag,
  Search,
  ArrowLeft,
  Eye,
  Download,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"

interface Order {
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
}

const statusOptions = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-500" },
  { value: "processing", label: "Processing", icon: Package, color: "bg-orange-500" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", icon: CheckCircle, color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500" },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, filterStatus, filterPaymentStatus])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        toast({
          title: "Error fetching orders",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error fetching orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${order.shipping_first_name} ${order.shipping_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.shipping_email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.status === filterStatus)
    }

    if (filterPaymentStatus !== "all") {
      filtered = filtered.filter((order) => order.payment_status === filterPaymentStatus)
    }

    setFilteredOrders(filtered)
  }

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      const response = await fetch("/api/admin/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders, status }),
      })

      if (response.ok) {
        toast({
          title: `${selectedOrders.length} orders updated to ${status}`,
        })
        setSelectedOrders([])
        fetchOrders()
      } else {
        toast({ title: "Error updating orders", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error bulk updating orders:", error)
      toast({ title: "Error updating orders", variant: "destructive" })
    }
  }

  const handleExportOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders.length > 0 ? selectedOrders : null }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({ title: "Orders exported successfully" })
      } else {
        toast({ title: "Error exporting orders", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error exporting orders:", error)
      toast({ title: "Error exporting orders", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find((s) => s.value === status) || statusOptions[0]
    const Icon = statusConfig.icon

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
        {statusConfig.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const colors = {
      paid: "bg-green-500",
      pending: "bg-yellow-500",
      failed: "bg-red-500",
      refunded: "bg-gray-500",
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${colors[paymentStatus as keyof typeof colors] || "bg-gray-500"}`} />
        {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1) || "Unknown"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Order Management
          </h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {selectedOrders.length > 0 && (
            <>
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={`Update ${selectedOrders.length} orders`} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <Button onClick={handleExportOrders} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export {selectedOrders.length > 0 ? `Selected (${selectedOrders.length})` : "All"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedOrders(filteredOrders.map((o) => o.id))
              } else {
                setSelectedOrders([])
              }
            }}
          />
          <span className="text-sm">Select All</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="relative">
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={selectedOrders.includes(order.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedOrders([...selectedOrders, order.id])
                  } else {
                    setSelectedOrders(selectedOrders.filter((id) => id !== order.id))
                  }
                }}
              />
            </div>
            <CardHeader className="pb-3 pl-12">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    #{order.order_number}
                    {getStatusBadge(order.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {order.shipping_first_name} {order.shipping_last_name}
                    {order.shipping_email && ` • ${order.shipping_email}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pl-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Status</p>
                  {getPaymentStatusBadge(order.payment_status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Order Date</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shipping_city}, {order.shipping_state}
                  </p>
                </div>
              </div>
              {order.tracking_number && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="text-sm font-mono">{order.tracking_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== "all" || filterPaymentStatus !== "all"
              ? "Try adjusting your search or filters"
              : "No orders have been placed yet"}
          </p>
        </div>
      )}
    </div>
  )
}
