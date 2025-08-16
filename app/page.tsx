"use client"

import { useState, useEffect } from "react"
import { ProductFilters } from "@/components/product-filters"
import { CartSidebar } from "@/components/cart/cart-sidebar"
import { Button } from "@/components/ui/button"
import { User, Menu, LogOut, Sparkles, Heart, Palette } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/actions"
import Link from "next/link"
import { AdvancedSearch } from "@/components/search/advanced-search"
import { SearchResults } from "@/components/search/search-results"
import type { Product, Category } from "@/lib/types/database"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    fetchCategories()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    fetchProducts(1)
  }, [selectedCategory, searchQuery])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
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

  const fetchProducts = async (page: number = currentPage) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.set("category", selectedCategory)
      if (searchQuery) params.set("search", searchQuery)
      params.set("page", page.toString())
      params.set("limit", "12")

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
      setPagination(data.pagination)
      setCurrentPage(page)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchProducts(page)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-heading font-black text-primary">MANUS</h1>
              <nav className="hidden md:flex items-center gap-6">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Products
                </Button>
                {user ? (
                  <>
                    <Button variant="ghost" className="text-foreground hover:text-primary" asChild>
                      <Link href="/wardrobe">Wardrobe</Link>
                    </Button>
                    <Button variant="ghost" className="text-foreground hover:text-primary" asChild>
                      <Link href="/recommendations">
                        <Sparkles className="h-4 w-4 mr-1" />
                        AI Styling
                      </Link>
                    </Button>
                    <Button variant="ghost" className="text-foreground hover:text-primary" asChild>
                      <Link href="/outfit-planner">Outfit Planner</Link>
                    </Button>
                    <Button variant="ghost" className="text-foreground hover:text-primary" asChild>
                      <Link href="/inspiration">
                        <Palette className="h-4 w-4 mr-1" />
                        Inspiration
                      </Link>
                    </Button>
                  </>
                ) : null}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <CartSidebar />

              {user ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/wishlist">
                      <Heart className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                      <User className="h-5 w-5" />
                    </Link>
                  </Button>
                  <form action={signOut}>
                    <Button variant="ghost" size="icon" type="submit">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              ) : (
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/auth/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              )}

              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-heading font-black text-card-foreground mb-4">Premium Menswear</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover sophisticated pieces that integrate seamlessly with your existing wardrobe. Each item is designed
            for versatility and timeless style.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Explore Collection
            </Button>
            {user ? (
              <Button size="lg" variant="outline" asChild>
                <Link href="/recommendations">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Recommendations
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/sign-up">Start Your Wardrobe</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="lg:hidden">
                <AdvancedSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              </div>

              <ProductFilters
                categories={categories}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onCategoryChange={setSelectedCategory}
                onSearchChange={setSearchQuery}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="hidden lg:block mb-6">
              <AdvancedSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            </div>

            <SearchResults
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              products={products}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onClearFilters={() => {
                setSelectedCategory("all")
                setSearchQuery("")
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
