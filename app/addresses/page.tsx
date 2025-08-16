"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, MapPin, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Address {
  id: string
  type: string
  is_default: boolean
  full_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchAddresses()
  }, [])

  const checkAuthAndFetchAddresses = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login?redirect=/addresses")
      return
    }

    setUser(user)
    await fetchAddresses()
  }

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses")
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error)
      toast.error("Failed to load addresses")
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: Address) => {
    return `${address.address_line_1}${address.address_line_2 ? `, ${address.address_line_2}` : ""}, ${address.city}, ${address.state} ${address.postal_code}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-heading font-black text-foreground">My Addresses</h1>
                <p className="text-muted-foreground">Manage your shipping and billing addresses</p>
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">No addresses saved</h2>
              <p className="text-muted-foreground mb-8">Add your first address to make checkout faster.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{address.full_name}</CardTitle>
                      <div className="flex gap-2">
                        {address.is_default && <Badge variant="secondary">Default</Badge>}
                        <Badge variant="outline" className="capitalize">
                          {address.type}
                        </Badge>
                      </div>
                    </div>
                    {address.company && <CardDescription>{address.company}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
                      <p className="text-sm text-muted-foreground">{address.country}</p>
                      {address.phone && <p className="text-sm text-muted-foreground">Phone: {address.phone}</p>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
