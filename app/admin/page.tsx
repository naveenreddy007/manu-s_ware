import { redirect } from "next/navigation"
import { getUser, isAdmin } from "@/lib/auth-utils"
import { AdminStats } from "@/components/admin/admin-stats"
import { ProductManagement } from "@/components/admin/product-management"
import { OrderManagement } from "@/components/admin/order-management"
import { UserManagement } from "@/components/admin/user-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminStats />
        </TabsContent>

        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
