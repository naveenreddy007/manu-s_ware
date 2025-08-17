"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Edit, Trash2, GripVertical, FolderOpen, Folder, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  parent_category?: string
  display_order: number
  subcategories?: Category[]
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(organizeCategories(data.categories || []))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({ title: "Error fetching categories", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const organizeCategories = (flatCategories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // First pass: create all categories
    flatCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, subcategories: [] })
    })

    // Second pass: organize hierarchy
    flatCategories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_category) {
        const parent = categoryMap.get(cat.parent_category)
        if (parent) {
          parent.subcategories!.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    // Sort by display_order
    rootCategories.sort((a, b) => a.display_order - b.display_order)
    rootCategories.forEach((cat) => {
      if (cat.subcategories) {
        cat.subcategories.sort((a, b) => a.display_order - b.display_order)
      }
    })

    return rootCategories
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const categoryData = {
      name: formData.get("name") as string,
      parent_category: (formData.get("parent_category") as string) || null,
      display_order: Number.parseInt(formData.get("display_order") as string) || 0,
    }

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        toast({
          title: editingCategory ? "Category updated successfully" : "Category created successfully",
        })
        setIsDialogOpen(false)
        setEditingCategory(null)
        fetchCategories()
      } else {
        const error = await response.json()
        toast({
          title: editingCategory ? "Error updating category" : "Error creating category",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast({ title: "Error saving category", variant: "destructive" })
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Category deleted successfully" })
        fetchCategories()
      } else {
        const error = await response.json()
        toast({
          title: "Error deleting category",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ title: "Error deleting category", variant: "destructive" })
    }
  }

  const handleReorder = async (categoryId: string, direction: "up" | "down") => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      })

      if (response.ok) {
        fetchCategories()
      } else {
        toast({ title: "Error reordering category", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error reordering category:", error)
      toast({ title: "Error reordering category", variant: "destructive" })
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const resetDialog = () => {
    setEditingCategory(null)
    setIsDialogOpen(false)
  }

  const getAllParentCategories = (): Category[] => {
    return categories.filter((cat) => !cat.parent_category)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            Category Management
          </h2>
          <p className="text-muted-foreground">Organize your product categories and subcategories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingCategory ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  placeholder="e.g., Clothing, Electronics"
                  required
                />
              </div>

              <div>
                <Label htmlFor="parent_category">Parent Category</Label>
                <Select name="parent_category" defaultValue={editingCategory?.parent_category || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Category)</SelectItem>
                    {getAllParentCategories().map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  defaultValue={editingCategory?.display_order || 0}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
                <Button type="button" variant="outline" onClick={resetDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first category</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          categories.map((category, index) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {category.subcategories?.length || 0} subcategories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(category.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(category.id, "down")}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
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
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{category.name}"? This will also delete all subcategories
                            and may affect existing products.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              {category.subcategories && category.subcategories.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {category.subcategories.map((subcategory, subIndex) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg ml-8"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{subcategory.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReorder(subcategory.id, "up")}
                            disabled={subIndex === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReorder(subcategory.id, "down")}
                            disabled={subIndex === category.subcategories!.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(subcategory)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{subcategory.name}"? This may affect existing
                                  products.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(subcategory.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
