"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, Search, Upload, Package, IndianRupee, ImageIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  subcategory?: string
  brand?: string
  image_url: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

const categories = [
  { value: "clothing", label: "Clothing", subcategories: ["shirts", "pants", "dresses", "jackets", "tops"] },
  { value: "footwear", label: "Footwear", subcategories: ["sneakers", "boots", "sandals", "heels", "flats"] },
  { value: "accessories", label: "Accessories", subcategories: ["bags", "jewelry", "watches", "belts", "hats"] },
  { value: "beauty", label: "Beauty", subcategories: ["skincare", "makeup", "fragrance", "haircare"] },
]

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

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
      }
    } catch (error) {
      console.error("Error fetching products:", error)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number.parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      subcategory: formData.get("subcategory") as string,
      brand: formData.get("brand") as string,
      image_url: formData.get("image_url") as string,
      stock_quantity: Number.parseInt(formData.get("stock_quantity") as string),
      is_active: formData.get("is_active") === "on",
    }

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
        toast({
          title: editingProduct ? "Error updating product" : "Error creating product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast({ title: "Error saving product", variant: "destructive" })
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
    setSelectedCategory(product.category)
    setIsDialogOpen(true)
  }

  const resetDialog = () => {
    setEditingProduct(null)
    setSelectedCategory("")
    setIsDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
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
            Product Management
          </h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
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
          <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingProduct ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" name="name" defaultValue={editingProduct?.name} required />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" name="brand" defaultValue={editingProduct?.brand} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingProduct?.description}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price (INR) *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        className="pl-10"
                        defaultValue={editingProduct?.price}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      defaultValue={editingProduct?.stock_quantity}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox id="is_active" name="is_active" defaultChecked={editingProduct?.is_active ?? true} />
                    <Label htmlFor="is_active">Active Product</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select name="subcategory" defaultValue={editingProduct?.subcategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory &&
                          categories
                            .find((cat) => cat.value === selectedCategory)
                            ?.subcategories.map((sub) => (
                              <SelectItem key={sub} value={sub}>
                                {sub.charAt(0).toUpperCase() + sub.slice(1)}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image_url">Image URL *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="image_url"
                        name="image_url"
                        type="url"
                        className="pl-10"
                        defaultValue={editingProduct?.image_url}
                        required
                      />
                    </div>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetDialog}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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

      <div className="flex items-center justify-between">
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
          <Label className="text-sm">Select All</Label>
        </div>
      </div>

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
                  src={product.image_url || "/placeholder.svg"}
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
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(product.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterCategory !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          {!searchTerm && filterCategory === "all" && filterStatus === "all" && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
