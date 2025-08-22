"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Loader2, Navigation } from "lucide-react"
import { toast } from "sonner"

interface Address {
  id?: string
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
  latitude?: number
  longitude?: number
}

interface AddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address?: Address | null
  onSave: (address: Address) => void
}

export function AddressDialog({ open, onOpenChange, address, onSave }: AddressDialogProps) {
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [formData, setFormData] = useState<Address>({
    type: "home",
    is_default: false,
    full_name: "",
    company: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    phone: "",
    latitude: undefined,
    longitude: undefined,
  })

  useEffect(() => {
    if (address) {
      setFormData(address)
    } else {
      setFormData({
        type: "home",
        is_default: false,
        full_name: "",
        company: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        phone: "",
        latitude: undefined,
        longitude: undefined,
      })
    }
  }, [address])

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      return
    }

    setGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`,
          )

          if (response.ok) {
            const data = await response.json()
            const result = data.results[0]

            if (result) {
              setFormData((prev) => ({
                ...prev,
                latitude,
                longitude,
                address_line_1: result.formatted || "",
                city: result.components.city || result.components.town || "",
                state: result.components.state || "",
                postal_code: result.components.postcode || "",
                country: result.components.country || "India",
              }))
              toast.success("Location detected successfully")
            }
          } else {
            // Fallback: just set coordinates
            setFormData((prev) => ({
              ...prev,
              latitude,
              longitude,
            }))
            toast.success("GPS coordinates captured")
          }
        } catch (error) {
          // Fallback: just set coordinates
          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
          }))
          toast.success("GPS coordinates captured")
        }

        setGettingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.error("Failed to get location. Please enable location services.")
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = address ? `/api/addresses/${address.id}` : "/api/addresses"
      const method = address ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const { address: savedAddress } = await response.json()
        onSave(savedAddress)
        toast.success(address ? "Address updated successfully" : "Address added successfully")
      } else {
        toast.error("Failed to save address")
      }
    } catch (error) {
      console.error("Failed to save address:", error)
      toast.error("Failed to save address")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            {address ? "Update your address information" : "Add a new shipping or billing address"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Address Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>GPS Location</Label>
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full bg-transparent"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Location
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1 *</Label>
            <Input
              id="address_line_1"
              value={formData.address_line_1}
              onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
            <Input
              id="address_line_2"
              value={formData.address_line_2}
              onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: !!checked })}
            />
            <Label htmlFor="is_default">Set as default address</Label>
          </div>

          {formData.latitude && formData.longitude && (
            <div className="text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 inline mr-1" />
              GPS: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : address ? (
                "Update Address"
              ) : (
                "Add Address"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
