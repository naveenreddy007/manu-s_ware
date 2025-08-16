// Simple in-memory cache for API responses
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMinutes = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000, // Convert to milliseconds
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const apiCache = new SimpleCache()

// Cache key generators
export const getCacheKey = {
  products: (category?: string, search?: string) => `products:${category || "all"}:${search || "none"}`,
  categories: () => "categories",
  product: (id: string) => `product:${id}`,
  recommendations: (userId: string) => `recommendations:${userId}`,
  wardrobe: (userId: string) => `wardrobe:${userId}`,
}
