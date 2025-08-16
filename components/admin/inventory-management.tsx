"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, Package, TrendingDown, DollarSign, Plus, Minus, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  price: number
  track_inventory: boolean
}

interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
}

interface LowStockAlert {
  id: string
  current_stock: number
  threshold: number
  created_at: string
  product: {
    name: string
    sku: string
    stock_quantity: number
    low_stock_threshold: number
  }
}

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  useEffect(() => {
    fetchInventoryData()
    fetchLowStockAlerts()
  }, [])

  const fetchInventoryData = async () => {
    try {
      const response = await fetch("/api/admin/inventory")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStockAlerts = async () => {
    try {
      const response = await fetch("/api/admin/inventory?view=low-stock")
      if (response.ok) {
        const data = await response.json()
        setLowStockAlerts(data)
      }
    } catch (error) {
      console.error("Error fetching low stock alerts:", error)
    }
  }

  const adjustStock = async () => {
    if (!selectedProduct || !adjustmentQuantity) return

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust-stock",
          productId: selectedProduct.id,
          quantity: Number.parseInt(adjustmentQuantity),
          reason: adjustmentReason,
        }),
      })

      if (response.ok) {
        toast({ title: "Stock adjusted successfully" })
        setSelectedProduct(null)
        setAdjustmentQuantity("")
        setAdjustmentReason("")
        fetchInventoryData()
        fetchLowStockAlerts()
      } else {
        toast({ title: "Error adjusting stock", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error adjusting stock:", error)
      toast({ title: "Error adjusting stock", variant: "destructive" })
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve-alert",
          alertId,
        }),
      })

      if (response.ok) {
        toast({ title: "Alert resolved" })
        fetchLowStockAlerts()
      }
    } catch (error) {
      console.error("Error resolving alert:", error)
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { label: "Out of Stock", color: "destructive" }
    if (product.stock_quantity <= product.low_stock_threshold) return { label: "Low Stock", color: "warning" }
    return { label: "In Stock", color: "success" }
  }

  if (loading) {
    return <div className="text-center py-8">Loading inventory data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold">{stats.lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold">{stats.outOfStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">
            Low Stock Alerts
            {lowStockAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => {
                  const status = getStockStatus(product)
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{product.name}</h3>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Stock</p>
                          <p className="font-bold">{product.stock_quantity}</p>
                        </div>

                        <Badge variant={status.color as any}>{status.label}</Badge>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
                              Adjust
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adjust Stock - {product.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Current Stock: {product.stock_quantity}</Label>
                              </div>
                              <div>
                                <Label htmlFor="quantity">Adjustment Quantity</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Button variant="outline" size="sm" onClick={() => setAdjustmentQuantity("-1")}>
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    value={adjustmentQuantity}
                                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                                    placeholder="Enter quantity change"
                                    className="text-center"
                                  />
                                  <Button variant="outline" size="sm" onClick={() => setAdjustmentQuantity("1")}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Use positive numbers to add stock, negative to reduce
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="reason">Reason (Optional)</Label>
                                <Textarea
                                  id="reason"
                                  value={adjustmentReason}
                                  onChange={(e) => setAdjustmentReason(e.target.value)}
                                  placeholder="Reason for adjustment..."
                                />
                              </div>
                              <Button onClick={adjustStock} className="w-full">
                                Adjust Stock
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockAlerts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No low stock alerts</p>
              ) : (
                <div className="space-y-4">
                  {lowStockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                    >
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <h3 className="font-medium">{alert.product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Current stock: {alert.current_stock} (Threshold: {alert.threshold})
                          </p>
                          <p className="text-xs text-gray-500">
                            Alert created: {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => resolveAlert(alert.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
