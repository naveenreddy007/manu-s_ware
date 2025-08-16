import type { Product, WardrobeItem } from "@/lib/types/database"

interface RecommendationContext {
  occasion?: string
  season?: string
  weather?: string[]
  style_preference?: string
}

interface OutfitRecommendation {
  id: string
  name: string
  occasion: string
  confidence_score: number
  wardrobe_items: WardrobeItem[]
  recommended_products: Product[]
  styling_notes: string
}

interface ProductRecommendation {
  product: Product
  reason: string
  confidence_score: number
  complements: WardrobeItem[]
}

// Color compatibility matrix
const COLOR_COMPATIBILITY = {
  navy: ["white", "light-blue", "gray", "beige", "cream", "burgundy"],
  white: ["navy", "black", "gray", "blue", "red", "green", "brown"],
  black: ["white", "gray", "red", "blue", "silver"],
  gray: ["white", "black", "navy", "blue", "pink", "yellow"],
  brown: ["cream", "beige", "white", "navy", "green"],
  beige: ["navy", "brown", "white", "blue", "green"],
  blue: ["white", "navy", "gray", "brown", "beige"],
  green: ["brown", "beige", "white", "navy"],
  red: ["white", "black", "gray", "navy"],
  burgundy: ["navy", "gray", "white", "beige"],
}

// Style compatibility
const STYLE_COMPATIBILITY = {
  casual: ["casual", "smart-casual"],
  "smart-casual": ["casual", "smart-casual", "professional"],
  professional: ["smart-casual", "professional", "formal"],
  formal: ["professional", "formal"],
  minimalist: ["casual", "smart-casual", "professional"],
  classic: ["smart-casual", "professional", "formal"],
}

export class RecommendationEngine {
  static generateOutfitRecommendations(
    wardrobeItems: WardrobeItem[],
    products: Product[],
    context: RecommendationContext = {},
  ): OutfitRecommendation[] {
    const outfits: OutfitRecommendation[] = []

    // Group wardrobe items by category
    const wardrobeByCategory = this.groupByCategory(wardrobeItems)

    // Generate outfit combinations
    const baseItems = this.selectBaseItems(wardrobeItems, context)

    baseItems.forEach((baseItem, index) => {
      const complementaryItems = this.findComplementaryItems(baseItem, wardrobeItems)
      const recommendedProducts = this.findComplementaryProducts([baseItem, ...complementaryItems], products, context)

      if (recommendedProducts.length > 0) {
        outfits.push({
          id: `outfit-${index}`,
          name: this.generateOutfitName(baseItem, context),
          occasion: context.occasion || "casual",
          confidence_score: this.calculateOutfitConfidence([baseItem, ...complementaryItems], recommendedProducts),
          wardrobe_items: [baseItem, ...complementaryItems],
          recommended_products: recommendedProducts.slice(0, 2), // Limit to 2 recommendations per outfit
          styling_notes: this.generateStylingNotes([baseItem, ...complementaryItems], recommendedProducts),
        })
      }
    })

    return outfits.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 6)
  }

  static generateProductRecommendations(
    wardrobeItems: WardrobeItem[],
    products: Product[],
    context: RecommendationContext = {},
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = []

    // Analyze wardrobe gaps
    const gaps = this.analyzeWardrobeGaps(wardrobeItems)

    products.forEach((product) => {
      const complements = this.findWardrobeComplements(product, wardrobeItems)
      const gapScore = gaps[product.category] || 0
      const styleScore = this.calculateStyleCompatibility(product, wardrobeItems)
      const colorScore = this.calculateColorCompatibility(product, wardrobeItems)

      const confidence = (gapScore * 0.4 + styleScore * 0.3 + colorScore * 0.3) * (complements.length > 0 ? 1.2 : 1)

      if (confidence > 0.3 && complements.length > 0) {
        recommendations.push({
          product,
          reason: this.generateRecommendationReason(product, complements, gaps),
          confidence_score: confidence,
          complements: complements.slice(0, 3),
        })
      }
    })

    return recommendations.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 8)
  }

  private static groupByCategory(items: WardrobeItem[]): Record<string, WardrobeItem[]> {
    return items.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
      },
      {} as Record<string, WardrobeItem[]>,
    )
  }

  private static selectBaseItems(items: WardrobeItem[], context: RecommendationContext): WardrobeItem[] {
    // Select key pieces that can anchor outfits
    const keyCategories = ["tops", "bottoms", "outerwear"]
    const baseItems: WardrobeItem[] = []

    keyCategories.forEach((category) => {
      const categoryItems = items.filter((item) => item.category === category)
      if (categoryItems.length > 0) {
        // Prioritize items that match context or are versatile
        const contextMatch = categoryItems.find((item) =>
          context.occasion ? item.tags.includes(context.occasion) : item.tags.includes("versatile"),
        )
        baseItems.push(contextMatch || categoryItems[0])
      }
    })

    return baseItems.slice(0, 4) // Limit base items
  }

  private static findComplementaryItems(baseItem: WardrobeItem, allItems: WardrobeItem[]): WardrobeItem[] {
    return allItems
      .filter((item) => item.id !== baseItem.id)
      .filter((item) => this.areItemsCompatible(baseItem, item))
      .slice(0, 2)
  }

  private static findComplementaryProducts(
    wardrobeItems: WardrobeItem[],
    products: Product[],
    context: RecommendationContext,
  ): Product[] {
    return products
      .filter((product) => {
        return wardrobeItems.some((item) => this.areProductItemCompatible(product, item))
      })
      .filter((product) => {
        if (context.occasion) {
          return product.tags.some((tag) => STYLE_COMPATIBILITY[context.occasion]?.includes(tag))
        }
        return true
      })
      .slice(0, 3)
  }

  private static findWardrobeComplements(product: Product, wardrobeItems: WardrobeItem[]): WardrobeItem[] {
    return wardrobeItems.filter((item) => this.areProductItemCompatible(product, item))
  }

  private static areItemsCompatible(item1: WardrobeItem, item2: WardrobeItem): boolean {
    // Don't pair items from the same category (except accessories)
    if (item1.category === item2.category && item1.category !== "accessories") {
      return false
    }

    // Check color compatibility
    if (item1.color && item2.color) {
      const compatible = COLOR_COMPATIBILITY[item1.color.toLowerCase()]
      if (compatible && !compatible.includes(item2.color.toLowerCase())) {
        return false
      }
    }

    // Check style compatibility
    const item1Styles = item1.tags.filter((tag) => Object.keys(STYLE_COMPATIBILITY).includes(tag))
    const item2Styles = item2.tags.filter((tag) => Object.keys(STYLE_COMPATIBILITY).includes(tag))

    if (item1Styles.length > 0 && item2Styles.length > 0) {
      return item1Styles.some((style1) => item2Styles.some((style2) => STYLE_COMPATIBILITY[style1]?.includes(style2)))
    }

    return true
  }

  private static areProductItemCompatible(product: Product, item: WardrobeItem): boolean {
    // Check color compatibility
    if (product.color && item.color) {
      const compatible = COLOR_COMPATIBILITY[product.color.toLowerCase()]
      if (compatible && !compatible.includes(item.color.toLowerCase())) {
        return false
      }
    }

    // Check style compatibility
    const productStyles = product.tags.filter((tag) => Object.keys(STYLE_COMPATIBILITY).includes(tag))
    const itemStyles = item.tags.filter((tag) => Object.keys(STYLE_COMPATIBILITY).includes(tag))

    if (productStyles.length > 0 && itemStyles.length > 0) {
      return productStyles.some((style1) => itemStyles.some((style2) => STYLE_COMPATIBILITY[style1]?.includes(style2)))
    }

    return true
  }

  private static analyzeWardrobeGaps(items: WardrobeItem[]): Record<string, number> {
    const categoryCount = this.groupByCategory(items)
    const idealCounts = {
      tops: 8,
      bottoms: 6,
      outerwear: 3,
      shoes: 4,
      accessories: 5,
    }

    const gaps: Record<string, number> = {}
    Object.entries(idealCounts).forEach(([category, ideal]) => {
      const current = categoryCount[category]?.length || 0
      gaps[category] = Math.max(0, (ideal - current) / ideal)
    })

    return gaps
  }

  private static calculateStyleCompatibility(product: Product, items: WardrobeItem[]): number {
    const productStyles = product.tags.filter((tag) => Object.keys(STYLE_COMPATIBILITY).includes(tag))
    if (productStyles.length === 0) return 0.5

    const compatibleItems = items.filter((item) =>
      productStyles.some((style) => item.tags.some((itemTag) => STYLE_COMPATIBILITY[style]?.includes(itemTag))),
    )

    return compatibleItems.length / items.length
  }

  private static calculateColorCompatibility(product: Product, items: WardrobeItem[]): number {
    if (!product.color) return 0.5

    const compatibleColors = COLOR_COMPATIBILITY[product.color.toLowerCase()] || []
    const compatibleItems = items.filter((item) => item.color && compatibleColors.includes(item.color.toLowerCase()))

    return items.length > 0 ? compatibleItems.length / items.length : 0.5
  }

  private static calculateOutfitConfidence(wardrobeItems: WardrobeItem[], products: Product[]): number {
    // Base confidence on item compatibility and product relevance
    let score = 0.7 // Base score

    // Bonus for color coordination
    const colors = [...wardrobeItems, ...products].map((item) => item.color?.toLowerCase()).filter(Boolean)
    const uniqueColors = new Set(colors)
    if (uniqueColors.size <= 3) score += 0.2

    // Bonus for style consistency
    const styles = [...wardrobeItems, ...products]
      .flatMap((item) => item.tags)
      .filter((tag) => Object.keys(STYLE_COMPATIBILITY).includes(tag))
    const uniqueStyles = new Set(styles)
    if (uniqueStyles.size <= 2) score += 0.1

    return Math.min(score, 1)
  }

  private static generateOutfitName(baseItem: WardrobeItem, context: RecommendationContext): string {
    const occasion = context.occasion || "casual"
    const season = context.season || "all-season"

    const names = [
      `${occasion.charAt(0).toUpperCase() + occasion.slice(1)} ${baseItem.category} Look`,
      `${season.charAt(0).toUpperCase() + season.slice(1)} ${baseItem.color || ""} Ensemble`.trim(),
      `Elevated ${baseItem.category} Style`,
      `Modern ${occasion} Outfit`,
    ]

    return names[Math.floor(Math.random() * names.length)]
  }

  private static generateStylingNotes(wardrobeItems: WardrobeItem[], products: Product[]): string {
    const notes = [
      "This combination creates a cohesive look that balances comfort and style.",
      "The recommended pieces will elevate your existing items while maintaining versatility.",
      "Perfect for transitioning from day to evening with minimal adjustments.",
      "These additions will expand your styling options significantly.",
    ]

    return notes[Math.floor(Math.random() * notes.length)]
  }

  private static generateRecommendationReason(
    product: Product,
    complements: WardrobeItem[],
    gaps: Record<string, number>,
  ): string {
    const gapScore = gaps[product.category] || 0

    if (gapScore > 0.5) {
      return `Perfect addition to fill a gap in your ${product.category} collection`
    }

    if (complements.length >= 3) {
      return `Pairs beautifully with ${complements.length} items in your wardrobe`
    }

    const complementColors = complements.map((item) => item.color).filter(Boolean)
    if (complementColors.length > 0) {
      return `Complements your ${complementColors.slice(0, 2).join(" and ")} pieces perfectly`
    }

    return "A versatile piece that will enhance your existing style"
  }
}
