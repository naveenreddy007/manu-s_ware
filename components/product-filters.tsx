"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import type { Category } from "@/lib/types/database"

interface ProductFiltersProps {
  categories: Category[]
  selectedCategory: string
  searchQuery: string
  onCategoryChange: (category: string) => void
  onSearchChange: (search: string) => void
}

export function ProductFilters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: ProductFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  const mainCategories = categories.filter((cat) => !cat.parent_category)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search products..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 bg-input border-border"
        />
        {localSearch && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => setLocalSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold text-sm">Categories</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              selectedCategory === "all" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"
            }`}
            onClick={() => onCategoryChange("all")}
          >
            All Products
          </Badge>

          {mainCategories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.name ? "default" : "outline"}
              className={`cursor-pointer transition-colors capitalize ${
                selectedCategory === category.name
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }`}
              onClick={() => onCategoryChange(category.name)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory !== "all" || searchQuery) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Category: {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryChange("all")} />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange("")} />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
