"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface OutfitItem {
  id: string
  name: string
  image_url: string
  category: string
  item_type: "wardrobe" | "product"
  item_id: string
}

interface OutfitSlot {
  category: string
  item: OutfitItem | null
}

export function OutfitBuilder() {
  const [outfitSlots, setOutfitSlots] = useState<OutfitSlot[]>([
    { category: "top", item: null },
    { category: "bottom", item: null },
    { category: "shoes", item: null },
    { category: "outerwear", item: null },
    { category: "accessories", item: null },
  ])
  const [wardrobeItems, setWardrobeItems] = useState<OutfitItem[]>([])
  const [products, setProducts] = useState<OutfitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      // Fetch wardrobe items
      const wardrobeResponse = await fetch("/api/wardrobe")
      if (wardrobeResponse.ok) {
        const wardrobeData = await wardrobeResponse.json()
        setWardrobeItems(
          wardrobeData.map((item: any) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            category: item.category,
            item_type: "wardrobe",
            item_id: item.id,
          })),
        )
      }

      // Fetch products
      const productsResponse = await fetch("/api/products")
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(
          productsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            category: item.category,
            item_type: "product",
            item_id: item.id,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }

  const addItemToOutfit = (item: OutfitItem) => {
    setOutfitSlots((prev) => prev.map((slot) => (slot.category === item.category ? { ...slot, item } : slot)))
  }

  const removeItemFromOutfit = (category: string) => {
    setOutfitSlots((prev) => prev.map((slot) => (slot.category === category ? { ...slot, item: null } : slot)))
  }

  const saveOutfit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const outfitData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      occasion: formData.get("occasion") as string,
      season: formData.get("season") as string,
      items: outfitSlots
        .filter((slot) => slot.item)
        .map((slot) => ({
          item_type: slot.item!.item_type,
          item_id: slot.item!.item_id,
          category: slot.category,
        })),
    }

    try {
      const response = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outfitData),
      })

      if (response.ok) {
        toast({ title: "Outfit saved successfully!" })
        setIsSaveDialogOpen(false)
        // Reset outfit
        setOutfitSlots((prev) => prev.map((slot) => ({ ...slot, item: null })))
      } else {
        toast({ title: "Error saving outfit", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error saving outfit:", error)
      toast({ title: "Error saving outfit", variant: "destructive" })
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      top: "Top",
      bottom: "Bottom",
      shoes: "Shoes",
      outerwear: "Outerwear",
      accessories: "Accessories",
    }
    return labels[category] || category
  }

  if (loading) {
    return <div className="text-center py-8">Loading outfit builder...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Outfit Builder</h2>
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Outfit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Outfit</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveOutfit} className="space-y-4">
              <div>
                <Label htmlFor="name">Outfit Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="occasion">Occasion</Label>
                <Select name="occasion">
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="workout">Workout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="season">Season</Label>
                <Select name="season">
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Save Outfit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outfit Canvas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Outfit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outfitSlots.map((slot) => (
                  <div
                    key={slot.category}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[120px]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">{getCategoryLabel(slot.category)}</Label>
                      {slot.item && (
                        <Button variant="outline" size="sm" onClick={() => removeItemFromOutfit(slot.category)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {slot.item ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={slot.item.image_url || "/placeholder.svg"}
                          alt={slot.item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm">{slot.item.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {slot.item.item_type === "wardrobe" ? "Your Item" : "MANUS"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-16 text-gray-400">
                        <Plus className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="wardrobe">
                <TabsList>
                  <TabsTrigger value="wardrobe">Your Wardrobe</TabsTrigger>
                  <TabsTrigger value="products">MANUS Products</TabsTrigger>
                </TabsList>

                <TabsContent value="wardrobe" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wardrobeItems.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => addItemToOutfit(item)}
                      >
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => addItemToOutfit(item)}
                      >
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
