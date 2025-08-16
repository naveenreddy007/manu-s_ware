import { redirect } from "next/navigation"
import { getUser, isAdmin } from "@/lib/auth-utils"
import { AdminStats } from "@/components/admin/admin-stats"
import { ProductManagement } from "@/components/admin/product-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminPage() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userIsAdmin = await isAdmin(user.id)
  if (!userIsAdmin) {
    redirect("/")
  }

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
          <div className="text-center py-8">
            <p className="text-muted-foreground">Order management coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="text-center py-8">
            <p className="text-muted-foreground">User management coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
