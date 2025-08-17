"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Download,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  product: {
    name: string
    image_url: string
    category: string
  }
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  updated_at?: string
  user_id: string
  shipping_first_name: string
  shipping_last_name: string
  shipping_email: string
  shipping_phone?: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  billing_address?: string
  payment_method?: string
  payment_status?: string
  tracking_number?: string
  notes?: string
  order_items?: OrderItem[]
  user_profiles?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
}

const orderStatuses = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-800", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  { value: "processing", label: "Processing", color: "bg-yellow-100 text-yellow-800", icon: Package },
  { value: "shipped", label: "Shipped", color: "bg-green-100 text-green-800", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
]

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, dateFilter])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({ title: "Error fetching orders", variant: "destructive" })
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
          order.shipping_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter((order) => new Date(order.created_at) >= filterDate)
      }
    }

    setFilteredOrders(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingNumber?: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, tracking_number: trackingNumber, notes }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))
        toast({ title: `Order status updated to ${newStatus}` })
      } else {
        toast({ title: "Error updating order status", variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({ title: "Error updating order status", variant: "destructive" })
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch("/api/admin/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders, status: newStatus }),
      })

      if (response.ok) {
        toast({ title: `${selectedOrders.length} orders updated to ${newStatus}` })
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

  const exportOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders.length > 0 ? selectedOrders : undefined }),
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

  const getStatusInfo = (status: string) => {
    return orderStatuses.find((s) => s.value === status) || orderStatuses[0]
  }

  const openOrderDetails = async (order: Order) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/details`)
      if (response.ok) {
        const detailedOrder = await response.json()
        setSelectedOrder(detailedOrder)
        setIsDetailDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      setSelectedOrder(order)
      setIsDetailDialogOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Order Management
          </h2>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <>
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button variant="outline" onClick={exportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{orders.filter((o) => o.status === "pending").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{orders.filter((o) => o.status === "processing").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold">{orders.filter((o) => o.status === "shipped").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total_amount, 0),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, or tracking numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
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
              <Label className="text-sm">Select All</Label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status)
                  const StatusIcon = statusInfo.icon
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          {order.tracking_number && (
                            <p className="text-xs text-muted-foreground">Tracking: {order.tracking_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.shipping_first_name} {order.shipping_last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.shipping_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openOrderDetails(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "confirmed" && (
                            <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order.id, "processing")}>
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                          {order.status === "processing" && (
                            <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order.id, "shipped")}>
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here once customers start placing them"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="tracking">Tracking</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium">{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusInfo(selectedOrder.status).color}>
                          {getStatusInfo(selectedOrder.status).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span>{new Date(selectedOrder.created_at).toLocaleString("en-IN")}</span>
                      </div>
                      {selectedOrder.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="capitalize">{selectedOrder.payment_method}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}
                        </p>
                        <p>{selectedOrder.shipping_address}</p>
                        <p>
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state}{" "}
                          {selectedOrder.shipping_postal_code}
                        </p>
                        {selectedOrder.shipping_phone && <p>Phone: {selectedOrder.shipping_phone}</p>}
                        <p>Email: {selectedOrder.shipping_email}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.shipping_email}</span>
                      </div>
                      {selectedOrder.shipping_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedOrder.shipping_phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      <div className="space-y-4">
                        {selectedOrder.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <img
                              src={item.product?.image_url || "/placeholder.svg"}
                              alt={item.product?.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product?.name}</h4>
                              <p className="text-sm text-muted-foreground">Category: {item.product?.category}</p>
                              <p className="text-sm">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(item.price)}</p>
                              <p className="text-sm text-muted-foreground">
                                Total: {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No items found for this order</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Order Tracking & Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Update Status</Label>
                        <Select
                          value={selectedOrder.status}
                          onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tracking">Tracking Number</Label>
                        <Input
                          id="tracking"
                          defaultValue={selectedOrder.tracking_number || ""}
                          placeholder="Enter tracking number"
                          onBlur={(e) => {
                            if (e.target.value !== selectedOrder.tracking_number) {
                              updateOrderStatus(selectedOrder.id, selectedOrder.status, e.target.value)
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Order Notes</Label>
                      <Textarea
                        id="notes"
                        defaultValue={selectedOrder.notes || ""}
                        placeholder="Add notes about this order..."
                        rows={3}
                        onBlur={(e) => {
                          if (e.target.value !== selectedOrder.notes) {
                            updateOrderStatus(selectedOrder.id, selectedOrder.status, undefined, e.target.value)
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
