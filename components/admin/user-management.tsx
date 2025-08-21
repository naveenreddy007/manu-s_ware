"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Search,
  Users,
  UserCheck,
  Crown,
  Shield,
  Eye,
  Ban,
  Calendar,
  ShoppingCart,
  Heart,
  TrendingUp,
  Download,
} from "lucide-react"
import { updateUserRole } from "@/lib/actions"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"

interface UserActivity {
  orders_count: number
  total_spent: number
  last_order_date?: string
  inspirations_count: number
  likes_count: number
  last_login?: string
}

interface User {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
  created_at: string
  is_active: boolean
  activity?: UserActivity
}

interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  adminCount: number
  moderatorCount: number
  userGrowthRate: number
  topSpenders: User[]
  recentSignups: User[]
  roleDistribution: { role: string; count: number; percentage: number }[]
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({ title: "Error fetching users", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/users/analytics")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => (statusFilter === "active" ? user.is_active : !user.is_active))
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const formData = new FormData()
      formData.append("userId", userId)
      formData.append("role", newRole)

      const result = await updateUserRole(null, formData)

      if (result.success) {
        setUsers(users.map((user) => (user.user_id === userId ? { ...user, role: newRole } : user)))
        toast({ title: `User role updated to ${newRole}` })
      } else {
        toast({ title: "Error updating user role", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({ title: "Error updating user role", variant: "destructive" })
    }
  }

  const handleBulkRoleUpdate = async (newRole: string) => {
    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers, updates: { role: newRole } }),
      })

      if (response.ok) {
        toast({ title: `${selectedUsers.length} users updated to ${newRole}` })
        setSelectedUsers([])
        fetchUsers()
      } else {
        toast({ title: "Error updating users", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error bulk updating users:", error)
      toast({ title: "Error updating users", variant: "destructive" })
    }
  }

  const handleUserStatusToggle = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (response.ok) {
        setUsers(users.map((user) => (user.user_id === userId ? { ...user, is_active: isActive } : user)))
        toast({ title: `User ${isActive ? "activated" : "deactivated"}` })
      } else {
        toast({ title: "Error updating user status", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({ title: "Error updating user status", variant: "destructive" })
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers.length > 0 ? selectedUsers : undefined }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `users-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({ title: "Users exported successfully" })
      } else {
        toast({ title: "Error exporting users", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error exporting users:", error)
      toast({ title: "Error exporting users", variant: "destructive" })
    }
  }

  const openUserDetails = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.user_id}/details`)
      if (response.ok) {
        const detailedUser = await response.json()
        setSelectedUser(detailedUser)
        setIsDetailDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      setSelectedUser(user)
      setIsDetailDialogOpen(true)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "moderator":
        return "default"
      case "user":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return Crown
      case "moderator":
        return Shield
      default:
        return Users
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management & Analytics
          </h2>
          <p className="text-muted-foreground">Manage users and view platform analytics</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <>
              <Select onValueChange={handleBulkRoleUpdate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Update Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Set as User</SelectItem>
                  <SelectItem value="moderator">Set as Moderator</SelectItem>
                  <SelectItem value="admin">Set as Admin</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold">{analytics.newUsersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{analytics.adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="roles">Role Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(filteredUsers.map((u) => u.user_id))
                      } else {
                        setSelectedUsers([])
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
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const RoleIcon = getRoleIcon(user.role)
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.user_id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.user_id])
                                } else {
                                  setSelectedUsers(selectedUsers.filter((id) => id !== user.user_id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.first_name && user.last_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <RoleIcon className="h-4 w-4" />
                              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.activity && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <ShoppingCart className="h-3 w-3" />
                                    {user.activity.orders_count} orders
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {user.activity.inspirations_count} posts
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at).toLocaleDateString("en-IN")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openUserDetails(user)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Select
                                value={user.role}
                                onValueChange={(newRole: string) => handleRoleChange(user.user_id, newRole)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserStatusToggle(user.user_id, !user.is_active)}
                              >
                                {user.is_active ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Users will appear here once they sign up"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Spenders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topSpenders.map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.activity?.orders_count} orders</p>
                          </div>
                        </div>
                        <p className="font-bold">{formatCurrency(user.activity?.total_spent || 0)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Recent Signups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.recentSignups.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(user.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.roleDistribution.map((role) => {
                    const RoleIcon = getRoleIcon(role.role)
                    return (
                      <div key={role.role} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RoleIcon className="h-5 w-5" />
                          <span className="font-medium capitalize">{role.role}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${role.percentage}%` }}></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">{role.count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>
                        {selectedUser.first_name && selectedUser.last_name
                          ? `${selectedUser.first_name} ${selectedUser.last_name}`
                          : "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedUser.phone || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant={getRoleBadgeVariant(selectedUser.role)}>{selectedUser.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                        {selectedUser.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{new Date(selectedUser.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Activity Summary</h3>
                  {selectedUser.activity ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Orders:</span>
                        <span>{selectedUser.activity.orders_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Spent:</span>
                        <span className="font-medium">{formatCurrency(selectedUser.activity.total_spent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inspirations:</span>
                        <span>{selectedUser.activity.inspirations_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Likes Given:</span>
                        <span>{selectedUser.activity.likes_count}</span>
                      </div>
                      {selectedUser.activity.last_order_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Order:</span>
                          <span>{new Date(selectedUser.activity.last_order_date).toLocaleDateString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No activity data available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
