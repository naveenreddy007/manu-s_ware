"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Search,
  ArrowLeft,
  Eye,
  ShoppingBag,
  Heart,
  Calendar,
  Phone,
  Download,
  TrendingUp,
  UserCheck,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"

interface CustomerActivity {
  orders_count: number
  total_spent: number
  last_order_date?: string
  inspirations_count: number
  likes_count: number
  last_login?: string
}

interface Customer {
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
  activity?: CustomerActivity
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterStyle, setFilterStyle] = useState("all")

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, filterStatus, filterStyle])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        // Filter to only show customers (users with role 'user' or 'customer')
        const customerData = data.filter((user: Customer) => user.role === "user" || user.role === "customer")
        setCustomers(customerData)
      } else {
        toast({
          title: "Error fetching customers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error fetching customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = customers

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm),
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((customer) => (filterStatus === "active" ? customer.is_active : !customer.is_active))
    }

    if (filterStyle !== "all") {
      filtered = filtered.filter((customer) => customer.preferred_style === filterStyle)
    }

    setFilteredCustomers(filtered)
  }

  const handleExportCustomers = async () => {
    try {
      const response = await fetch("/api/admin/users/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedCustomers.length > 0 ? selectedCustomers : null,
          roleFilter: ["user", "customer"], // Only export customers
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({ title: "Customers exported successfully" })
      } else {
        toast({ title: "Error exporting customers", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error exporting customers:", error)
      toast({ title: "Error exporting customers", variant: "destructive" })
    }
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`
    }
    return customer.email.split("@")[0]
  }

  const getLifetimeValue = (customer: Customer) => {
    return customer.activity?.total_spent || 0
  }

  const getCustomerSegment = (customer: Customer) => {
    const ltv = getLifetimeValue(customer)
    const orderCount = customer.activity?.orders_count || 0

    if (ltv > 50000) return { label: "VIP", color: "bg-purple-500" }
    if (ltv > 20000) return { label: "High Value", color: "bg-blue-500" }
    if (orderCount > 5) return { label: "Loyal", color: "bg-green-500" }
    if (orderCount > 0) return { label: "Active", color: "bg-yellow-500" }
    return { label: "New", color: "bg-gray-500" }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customers...</p>
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
            <Users className="h-8 w-8" />
            Customer Management
          </h1>
          <p className="text-muted-foreground">Manage customer profiles and analyze behavior</p>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{customers.filter((c) => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">With Orders</p>
                <p className="text-2xl font-bold">
                  {customers.filter((c) => (c.activity?.orders_count || 0) > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. LTV</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    customers.reduce((sum, c) => sum + getLifetimeValue(c), 0) / Math.max(customers.length, 1),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {selectedCustomers.length > 0 && (
            <Button onClick={handleExportCustomers} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Selected ({selectedCustomers.length})
            </Button>
          )}
        </div>

        <Button onClick={handleExportCustomers} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All Customers
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStyle} onValueChange={setFilterStyle}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Style preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Styles</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="streetwear">Streetwear</SelectItem>
            <SelectItem value="minimalist">Minimalist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedCustomers(filteredCustomers.map((c) => c.user_id))
              } else {
                setSelectedCustomers([])
              }
            }}
          />
          <span className="text-sm">Select All</span>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const segment = getCustomerSegment(customer)
          return (
            <Card key={customer.user_id} className="relative">
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedCustomers.includes(customer.user_id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCustomers([...selectedCustomers, customer.user_id])
                    } else {
                      setSelectedCustomers(selectedCustomers.filter((id) => id !== customer.user_id))
                    }
                  }}
                />
              </div>
              <CardHeader className="pb-3 pl-12">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getCustomerName(customer)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${segment.color}`} />
                        {segment.label}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                  <Link href={`/admin/customers/${customer.user_id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pl-12">
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-1">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>Joined {new Date(customer.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{customer.activity?.orders_count || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{customer.activity?.inspirations_count || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                  </div>

                  {/* Lifetime Value */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Lifetime Value</span>
                      <span className="font-bold text-lg">{formatCurrency(getLifetimeValue(customer))}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge variant={customer.is_active ? "default" : "secondary"}>
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Style Preference */}
                  {customer.preferred_style && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Style</span>
                      <Badge variant="outline" className="capitalize">
                        {customer.preferred_style}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== "all" || filterStyle !== "all"
              ? "Try adjusting your search or filters"
              : "Customers will appear here once they sign up"}
          </p>
        </div>
      )}
    </div>
  )
}
