"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { WardrobeItemCard } from "@/components/wardrobe/wardrobe-item-card"
import { AddItemDialog } from "@/components/wardrobe/add-item-dialog"
import { EditItemDialog } from "@/components/wardrobe/edit-item-dialog"
import { CameraUploadDialog } from "@/components/wardrobe/camera-upload-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Filter, Grid, List } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { WardrobeItem, Category } from "@/lib/types/database"

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (user) {
      fetchItems()
    }
  }, [user, selectedCategory])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUser(user)
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching wardrobe items...")
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.set("category", selectedCategory)

      const response = await fetch(`/api/wardrobe?${params}`)
      const data = await response.json()

      console.log("[v0] Wardrobe API response:", data)

      if (response.ok) {
        const wardrobeData = data.items || data.data || data || []
        const itemsArray = Array.isArray(wardrobeData) ? wardrobeData : []
        setItems(itemsArray)
        console.log("[v0] Set wardrobe items:", itemsArray.length)
      } else if (response.status === 401) {
        router.push("/auth/login")
      } else {
        console.error("[v0] Error fetching items:", data)
        setItems([])
      }
    } catch (error) {
      console.error("Error fetching items: wardrobeData.map is not a function", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = (newItem: WardrobeItem) => {
    setItems([newItem, ...items])
  }

  const handleEditItem = (item: WardrobeItem) => {
    setEditingItem(item)
  }

  const handleUpdateItem = (updatedItem: WardrobeItem) => {
    setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setEditingItem(null)
  }

  const handleDeleteItem = async (item: WardrobeItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      const response = await fetch(`/api/wardrobe/${item.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItems(items.filter((i) => i.id !== item.id))
      } else {
        console.error("Failed to delete item")
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  const mainCategories = categories.filter((cat) => !cat.parent_category)

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-heading font-black text-primary">My Wardrobe</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 border border-border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <CameraUploadDialog onAdd={handleAddItem} categories={mainCategories.map((cat) => cat.name)} />

              <AddItemDialog onAdd={handleAddItem} categories={mainCategories.map((cat) => cat.name)} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Filters */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-sm">Categories</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className={`cursor-pointer transition-colors text-xs ${
                selectedCategory === "all" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              All Items ({items.length})
            </Badge>

            {mainCategories.map((category) => {
              const count = items.filter((item) => item.category === category.name).length
              return (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  className={`cursor-pointer transition-colors capitalize text-xs ${
                    selectedCategory === category.name
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name} ({count})
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-[3/4] rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
                : "space-y-3 md:space-y-4"
            }
          >
            {items.map((item) => (
              <WardrobeItemCard key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              {selectedCategory === "all"
                ? "Your wardrobe is empty. Start by adding your first item!"
                : `No ${selectedCategory} items found.`}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <CameraUploadDialog onAdd={handleAddItem} categories={mainCategories.map((cat) => cat.name)} />
              <AddItemDialog onAdd={handleAddItem} categories={mainCategories.map((cat) => cat.name)} />
            </div>
          </div>
        )}
      </main>

      {editingItem && (
        <EditItemDialog
          item={editingItem}
          categories={mainCategories.map((cat) => cat.name)}
          onUpdate={handleUpdateItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
