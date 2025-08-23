import { redirect } from "next/navigation"
import { getUser, isAdmin } from "@/lib/auth-utils"
import { AdminStats } from "@/components/admin/admin-stats"
import { ProductManagement } from "@/components/admin/product-management"
import { OrderManagement } from "@/components/admin/order-management"
import { UserManagement } from "@/components/admin/user-management"
import { AdminSettings } from "@/components/admin/admin-settings"
import { CategoryManagement } from "@/components/admin/category-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Users, Package, BarChart3 } from "lucide-react"
import Link from "next/link"

export default async function AdminPage() {
  const user = await getUser()

  console.log("[v0] Admin page - User:", user?.id)

  if (!user) {
    console.log("[v0] Admin page - No user, redirecting to login")
    redirect("/auth/login")
  }

  const userIsAdmin = await isAdmin(user.id)
  console.log("[v0] Admin page - Is admin:", userIsAdmin)

  if (!userIsAdmin) {
    console.log("[v0] Admin page - Not admin, redirecting to home")
    redirect("/")
  }

  console.log("[v0] Admin page - Access granted")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your MANUS platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Product Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Full CRUD operations, image management, and inventory tracking
            </p>
            <Link href="/admin/products">
              <Button size="sm" className="w-full">
                Manage Products
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-green-500" />
              Order Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Process orders, update status, and manage shipping</p>
            <Link href="/admin/orders">
              <Button size="sm" className="w-full">
                Manage Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Customer Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Customer profiles, segmentation, and order history</p>
            <Link href="/admin/customers">
              <Button size="sm" className="w-full">
                Manage Customers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminStats />
        </TabsContent>

        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Customer Management
                </h2>
                <p className="text-muted-foreground">Manage customer relationships and analyze behavior</p>
              </div>
              <Link href="/admin/customers">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Open Customer Manager
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Customer Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    View customer segmentation, lifetime value analysis, and behavior patterns.
                  </p>
                  <Link href="/admin/customers">
                    <Button variant="outline" size="sm">
                      View Analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Access detailed customer order history and purchase patterns.
                  </p>
                  <Link href="/admin/customers">
                    <Button variant="outline" size="sm">
                      View Orders
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
