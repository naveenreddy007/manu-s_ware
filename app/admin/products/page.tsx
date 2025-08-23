"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search, Package, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { ProductForm } from "@/components/admin/product-form"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  subcategory?: string
  brand?: string
  image_url: string
  images?: string[]
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at?: string
  style?: string
  pattern?: string
  material?: string
  occasion?: string
  season?: string
  fit?: string
  neckline?: string
  sleeve_length?: string
  formality_score?: number
}

const categories = [
  { value: "clothing", label: "Clothing" },
  { value: "footwear", label: "Footwear" },
  { value: "accessories", label: "Accessories" },
  { value: "beauty", label: "Beauty" },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, filterCategory, filterStatus])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        toast({
          title: "Error fetching products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error fetching products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((product) => product.category === filterCategory)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((product) => (filterStatus === "active" ? product.is_active : !product.is_active))
    }

    setFilteredProducts(filtered)
  }

  const handleSubmit = async (productData: any) => {
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        toast({
          title: editingProduct ? "Product updated successfully" : "Product created successfully",
        })
        setIsDialogOpen(false)
        setEditingProduct(null)
        fetchProducts()
      } else {
        const errorData = await response.json()
        toast({
          title: editingProduct ? "Error updating product" : "Error creating product",
          description: errorData.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error saving product",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Product deleted successfully" })
        fetchProducts()
      } else {
        toast({ title: "Error deleting product", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({ title: "Error deleting product", variant: "destructive" })
    }
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProducts }),
      })

      if (response.ok) {
        toast({ title: `${selectedProducts.length} products deleted successfully` })
        setSelectedProducts([])
        fetchProducts()
      } else {
        toast({ title: "Error deleting products", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error bulk deleting products:", error)
      toast({ title: "Error deleting products", variant: "destructive" })
    }
  }

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProducts, updates: { is_active: isActive } }),
      })

      if (response.ok) {
        toast({
          title: `${selectedProducts.length} products ${isActive ? "activated" : "deactivated"} successfully`,
        })
        setSelectedProducts([])
        fetchProducts()
      } else {
        toast({ title: "Error updating products", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error bulk updating products:", error)
      toast({ title: "Error updating products", variant: "destructive" })
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const resetDialog = () => {
    setEditingProduct(null)
    setIsDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
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
            <Package className="h-8 w-8" />
            Product Management
          </h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleBulkStatusUpdate(true)}>
                Activate Selected
              </Button>
              <Button variant="outline" onClick={() => handleBulkStatusUpdate(false)}>
                Deactivate Selected
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedProducts.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Products</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedProducts.length} selected products? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingProduct ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingProduct ? "Edit Product" : "Create New Product"}
              </DialogTitle>
            </DialogHeader>
            <ProductForm product={editingProduct} onSubmit={handleSubmit} onCancel={resetDialog} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedProducts(filteredProducts.map((p) => p.id))
              } else {
                setSelectedProducts([])
              }
            }}
          />
          <span className="text-sm">Select All</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className={`relative ${!product.is_active ? "opacity-60" : ""}`}>
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedProducts([...selectedProducts, product.id])
                  } else {
                    setSelectedProducts(selectedProducts.filter((id) => id !== product.id))
                  }
                }}
              />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <img
                  src={product.image_url || "/placeholder.svg?height=160&width=200&query=product"}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-md"
                />
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Stock: {product.stock_quantity}
                  </span>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                {product.images && product.images.length > 1 && (
                  <p className="text-xs text-muted-foreground">+{product.images.length - 1} more images</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(product.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterCategory !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first product"}
          </p>
          {!searchTerm && filterCategory === "all" && filterStatus === "all" && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Product
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
