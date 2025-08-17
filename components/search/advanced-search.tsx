"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Clock, TrendingUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchSuggestion {
  type: "product" | "category" | "history"
  text: string
  category?: string
}

interface AdvancedSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  className?: string
}

export function AdvancedSearch({ searchQuery, onSearchChange, className }: AdvancedSearchProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [trendingSearches, setTrendingSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    setSearchHistory(history.slice(0, 5))

    // Fetch trending searches
    fetchTrendingData()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchSuggestions(searchQuery)
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  const fetchSuggestions = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendingData = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch("/api/search/trending", {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setTrendingSearches(data.trendingCategories || [])
        console.log("[v0] Successfully fetched trending data:", data.trendingCategories?.length || 0, "categories")
      } else {
        console.warn("[v0] Trending API returned non-OK status:", response.status)
        // Provide fallback trending categories
        setTrendingSearches(["shirts", "pants", "shoes", "accessories", "outerwear"])
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("[v0] Trending data fetch timed out, using fallback")
      } else {
        console.error("[v0] Error fetching trending data:", error)
      }
      // Provide fallback trending categories
      setTrendingSearches(["shirts", "pants", "shoes", "accessories", "outerwear"])
    }
  }

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Add to search history
      const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem("searchHistory", JSON.stringify(newHistory))

      onSearchChange(query)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text)
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem("searchHistory")
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products, styles, or categories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          className="pl-10 pr-4"
        />
      </div>

      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 border-b">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Suggestions</h4>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{suggestion.text}</span>
                      {suggestion.category && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {suggestion.category}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && suggestions.length === 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Recent Searches</h4>
                  <Button variant="ghost" size="sm" onClick={clearSearchHistory} className="text-xs h-auto p-1">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
                      onClick={() => handleSearch(query)}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            {trendingSearches.length > 0 && suggestions.length === 0 && (
              <div className="p-3">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((trend, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => handleSearch(trend)}
                    >
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {suggestions.length === 0 && searchHistory.length === 0 && trendingSearches.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start typing to search...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
