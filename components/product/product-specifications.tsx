"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ruler, Shirt, Droplets, Shield, Truck, RotateCcw } from "lucide-react"

interface ProductSpecificationsProps {
  category: string
  materials?: string[]
  careInstructions?: string[]
  features?: string[]
}

export function ProductSpecifications({
  category,
  materials = [],
  careInstructions = [],
  features = [],
}: ProductSpecificationsProps) {
  const getSizeGuide = (category: string) => {
    const guides = {
      shirts: [
        { size: "XS", chest: "34-36", waist: "28-30", length: "27" },
        { size: "S", chest: "36-38", waist: "30-32", length: "28" },
        { size: "M", chest: "38-40", waist: "32-34", length: "29" },
        { size: "L", chest: "40-42", waist: "34-36", length: "30" },
        { size: "XL", chest: "42-44", waist: "36-38", length: "31" },
        { size: "XXL", chest: "44-46", waist: "38-40", length: "32" },
      ],
      pants: [
        { size: "28", waist: "28", hip: "36", inseam: "32" },
        { size: "30", waist: "30", hip: "38", inseam: "32" },
        { size: "32", waist: "32", hip: "40", inseam: "32" },
        { size: "34", waist: "34", hip: "42", inseam: "32" },
        { size: "36", waist: "36", hip: "44", inseam: "32" },
        { size: "38", waist: "38", hip: "46", inseam: "32" },
      ],
      jackets: [
        { size: "XS", chest: "34-36", shoulder: "17", sleeve: "24" },
        { size: "S", chest: "36-38", shoulder: "17.5", sleeve: "24.5" },
        { size: "M", chest: "38-40", shoulder: "18", sleeve: "25" },
        { size: "L", chest: "40-42", shoulder: "18.5", sleeve: "25.5" },
        { size: "XL", chest: "42-44", shoulder: "19", sleeve: "26" },
        { size: "XXL", chest: "44-46", shoulder: "19.5", sleeve: "26.5" },
      ],
    }

    return guides[category as keyof typeof guides] || guides.shirts
  }

  const defaultMaterials = ["100% Premium Cotton", "Pre-shrunk fabric", "Reinforced seams", "Quality hardware"]

  const defaultCareInstructions = [
    "Machine wash cold with like colors",
    "Use mild detergent",
    "Tumble dry low heat",
    "Iron on medium heat if needed",
    "Do not bleach",
    "Professional dry cleaning recommended for best results",
  ]

  const defaultFeatures = [
    "Premium construction",
    "Versatile styling",
    "Comfortable fit",
    "Durable materials",
    "Timeless design",
  ]

  const sizeGuide = getSizeGuide(category)
  const displayMaterials = materials.length > 0 ? materials : defaultMaterials
  const displayCareInstructions = careInstructions.length > 0 ? careInstructions : defaultCareInstructions
  const displayFeatures = features.length > 0 ? features : defaultFeatures

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="sizing">Size Guide</TabsTrigger>
          <TabsTrigger value="care">Care</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="h-5 w-5" />
                Materials & Construction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayMaterials.map((material, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-foreground">{material}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {displayFeatures.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sizing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Size Guide
              </CardTitle>
              <CardDescription>All measurements are in inches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Size</th>
                      {Object.keys(sizeGuide[0])
                        .slice(1)
                        .map((key) => (
                          <th key={key} className="text-left p-2 font-medium capitalize">
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{row.size}</td>
                        {Object.entries(row)
                          .slice(1)
                          .map(([key, value]) => (
                            <td key={key} className="p-2 text-muted-foreground">
                              {value}"
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>How to measure:</strong> For the most accurate fit, measure yourself wearing only
                  undergarments. Use a soft measuring tape and keep it parallel to the floor.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Care Instructions
              </CardTitle>
              <CardDescription>Follow these guidelines to maintain your garment's quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayCareInstructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                    <span className="text-foreground">{instruction}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-foreground">Free shipping on orders over $100</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-foreground">Standard shipping: 5-7 business days</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-foreground">Express shipping: 2-3 business days</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-foreground">International shipping available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Returns & Exchanges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-foreground">30-day return policy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-foreground">Free returns and exchanges</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-foreground">Items must be unworn with tags attached</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
