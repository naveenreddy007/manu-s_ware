"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, User, ShoppingBag, Heart, Calendar, Phone, Mail, Package, TrendingUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  payment_status: string
}

interface CustomerDetails {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
  created_at: string
  is_active: boolean
  date_of_birth?: string
  preferred_style?: string
  size_shirt?: string
  size_pants?: string
  size_shoes?: string
  activity?: {
    orders_count: number
    total_spent: number
    last_order_date?: string
    inspirations_count: number
    likes_count: number
    last_login?: string
  }
  orders?: Order[]
}

export default function CustomerDetailsPage({ params }: { params: { userId: string } }) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerDetails()
  }, [params.userId])

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.userId}/details`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
      } else {
        toast({
          title: "Error fetching customer details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching customer details:", error)
      toast({
        title: "Error fetching customer details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCustomerName = (customer: CustomerDetails) => {
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`
    }
    return customer.email.split("@")[0]
  }

  const getCustomerSegment = (customer: CustomerDetails) => {
    const ltv = customer.activity?.total_spent || 0
    const orderCount = customer.activity?.orders_count || 0

    if (ltv > 50000) return { label: "VIP Customer", color: "bg-purple-500" }
    if (ltv > 20000) return { label: "High Value", color: "bg-blue-500" }
    if (orderCount > 5) return { label: "Loyal Customer", color: "bg-green-500" }
    if (orderCount > 0) return { label: "Active Customer", color: "bg-yellow-500" }
    return { label: "New Customer", color: "bg-gray-500" }
  }

  const getOrderStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      processing: "bg-orange-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || "bg-gray-500"}`} />
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customer details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Customer not found</h3>
          <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
          <Link href="/admin/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    )
  }

  const segment = getCustomerSegment(customer)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {getCustomerName(customer)}
            <Badge variant="outline" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${segment.color}`} />
              {segment.label}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Customer since {new Date(customer.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {new Date(customer.created_at).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Status</h4>
                <Badge variant={customer.is_active ? "default" : "secondary"}>
                  {customer.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {customer.preferred_style && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Style Preference</h4>
                    <Badge variant="outline" className="capitalize">
                      {customer.preferred_style}
                    </Badge>
                  </div>
                </>
              )}

              {(customer.size_shirt || customer.size_pants || customer.size_shoes) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Size Information</h4>
                    <div className="space-y-1 text-sm">
                      {customer.size_shirt && <p>Shirt: {customer.size_shirt}</p>}
                      {customer.size_pants && <p>Pants: {customer.size_pants}</p>}
                      {customer.size_shoes && <p>Shoes: {customer.size_shoes}</p>}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.activity ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{customer.activity.orders_count}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Orders</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{customer.activity.inspirations_count}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Posts</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Lifetime Value</p>
                    <p className="text-3xl font-bold">{formatCurrency(customer.activity.total_spent)}</p>
                  </div>

                  {customer.activity.last_order_date && (
                    <>
                      <Separator />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Last Order</p>
                        <p className="text-sm">
                          {new Date(customer.activity.last_order_date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No activity data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Activity */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order History ({customer.activity?.orders_count || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.orders && customer.orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">#{order.order_number}</TableCell>
                              <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(order.total_amount)}</TableCell>
                              <TableCell>{new Date(order.created_at).toLocaleDateString("en-IN")}</TableCell>
                              <TableCell>
                                <Link href={`/admin/orders/${order.id}`}>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                      <p className="text-muted-foreground">This customer hasn't placed any orders.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">
                          Joined the platform on {new Date(customer.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {customer.activity?.last_order_date && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Recent Order Activity</p>
                          <p className="text-sm text-muted-foreground">
                            Last order placed on{" "}
                            {new Date(customer.activity.last_order_date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer.activity?.inspirations_count && customer.activity.inspirations_count > 0 && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Heart className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Content Creation</p>
                          <p className="text-sm text-muted-foreground">
                            Created {customer.activity.inspirations_count} inspiration posts
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
