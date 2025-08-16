"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Truck, Shield, Plus, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CheckoutFormProps {
  cartItems: any[]
  subtotal: number
}

interface Address {
  id: string
  type: "shipping" | "billing"
  first_name: string
  last_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
}

export function CheckoutForm({ cartItems, subtotal }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>("")
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>("")
  const [saveShippingAddress, setSaveShippingAddress] = useState(false)
  const [saveBillingAddress, setSaveBillingAddress] = useState(false)
  const [makeShippingDefault, setMakeShippingDefault] = useState(false)
  const [makeBillingDefault, setMakeBillingDefault] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [useNewShippingAddress, setUseNewShippingAddress] = useState(true)
  const [useNewBillingAddress, setUseNewBillingAddress] = useState(true)

  const [shippingAddress, setShippingAddress] = useState({
    first_name: "",
    last_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
  })

  const [billingAddress, setBillingAddress] = useState({
    first_name: "",
    last_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  })

  useEffect(() => {
    loadSavedAddresses()
  }, [])

  const loadSavedAddresses = async () => {
    try {
      const response = await fetch("/api/addresses")
      if (response.ok) {
        const data = await response.json()
        setSavedAddresses(data.addresses || [])

        // Auto-select default addresses if available
        const defaultShipping = data.addresses?.find((addr: Address) => addr.type === "shipping" && addr.is_default)
        const defaultBilling = data.addresses?.find((addr: Address) => addr.type === "billing" && addr.is_default)

        if (defaultShipping) {
          setSelectedShippingAddress(defaultShipping.id)
          setUseNewShippingAddress(false)
        }
        if (defaultBilling) {
          setSelectedBillingAddress(defaultBilling.id)
          setUseNewBillingAddress(false)
        }
      }
    } catch (error) {
      console.error("Failed to load addresses:", error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleAddressSelection = (addressId: string, type: "shipping" | "billing") => {
    const address = savedAddresses.find((addr) => addr.id === addressId)
    if (address) {
      if (type === "shipping") {
        setShippingAddress({
          first_name: address.first_name,
          last_name: address.last_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || "",
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
          phone: address.phone || "",
        })
      } else {
        setBillingAddress({
          first_name: address.first_name,
          last_name: address.last_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || "",
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        })
      }
    }
  }

  const shippingCost = subtotal > 100 ? 0 : 15
  const taxAmount = subtotal * 0.08
  const totalAmount = subtotal + shippingCost + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (saveShippingAddress && useNewShippingAddress) {
        await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...shippingAddress,
            type: "shipping",
            is_default: makeShippingDefault,
          }),
        })
      }

      if (saveBillingAddress && useNewBillingAddress && !sameAsShipping) {
        await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...billingAddress,
            type: "billing",
            is_default: makeBillingDefault,
          }),
        })
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          same_as_shipping: sameAsShipping,
          payment_method: "credit_card",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Order Placed Successfully!",
          description: `Your order ${data.order.order_number} has been confirmed.`,
        })
        router.push(`/orders/${data.order.id}`)
      } else {
        throw new Error(data.error || "Failed to place order")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const shippingAddresses = savedAddresses.filter((addr) => addr.type === "shipping")
  const billingAddresses = savedAddresses.filter((addr) => addr.type === "billing")

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Address
          </CardTitle>
          <CardDescription>Where should we deliver your order?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loadingAddresses && shippingAddresses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="saved-shipping"
                  name="shipping-option"
                  checked={!useNewShippingAddress}
                  onChange={() => setUseNewShippingAddress(false)}
                />
                <Label htmlFor="saved-shipping" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Use saved address
                </Label>
              </div>

              {!useNewShippingAddress && (
                <Select
                  value={selectedShippingAddress}
                  onValueChange={(value) => {
                    setSelectedShippingAddress(value)
                    handleAddressSelection(value, "shipping")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a saved address" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingAddresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="text-left">
                          <div className="font-medium">
                            {address.first_name} {address.last_name}
                            {address.is_default && (
                              <span className="ml-2 text-xs bg-primary text-primary-foreground px-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {address.address_line1}, {address.city}, {address.state} {address.postal_code}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new-shipping"
                  name="shipping-option"
                  checked={useNewShippingAddress}
                  onChange={() => setUseNewShippingAddress(true)}
                />
                <Label htmlFor="new-shipping" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Enter new address
                </Label>
              </div>
            </div>
          )}

          {(useNewShippingAddress || shippingAddresses.length === 0) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping-first-name">First Name</Label>
                  <Input
                    id="shipping-first-name"
                    required
                    value={shippingAddress.first_name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-last-name">Last Name</Label>
                  <Input
                    id="shipping-last-name"
                    required
                    value={shippingAddress.last_name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shipping-address1">Address Line 1</Label>
                <Input
                  id="shipping-address1"
                  required
                  value={shippingAddress.address_line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="shipping-address2">Address Line 2 (Optional)</Label>
                <Input
                  id="shipping-address2"
                  value={shippingAddress.address_line2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shipping-city">City</Label>
                  <Input
                    id="shipping-city"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-state">State</Label>
                  <Input
                    id="shipping-state"
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-postal">Postal Code</Label>
                  <Input
                    id="shipping-postal"
                    required
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shipping-phone">Phone Number</Label>
                <Input
                  id="shipping-phone"
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-shipping"
                    checked={saveShippingAddress}
                    onCheckedChange={(checked) => setSaveShippingAddress(checked as boolean)}
                  />
                  <Label htmlFor="save-shipping">Save this address for future orders</Label>
                </div>

                {saveShippingAddress && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="default-shipping"
                      checked={makeShippingDefault}
                      onCheckedChange={(checked) => setMakeShippingDefault(checked as boolean)}
                    />
                    <Label htmlFor="default-shipping">Make this my default shipping address</Label>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-shipping"
              checked={sameAsShipping}
              onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
            />
            <Label htmlFor="same-as-shipping">Same as shipping address</Label>
          </div>

          {!sameAsShipping && (
            <>
              {!loadingAddresses && billingAddresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="saved-billing"
                      name="billing-option"
                      checked={!useNewBillingAddress}
                      onChange={() => setUseNewBillingAddress(false)}
                    />
                    <Label htmlFor="saved-billing" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Use saved address
                    </Label>
                  </div>

                  {!useNewBillingAddress && (
                    <Select
                      value={selectedBillingAddress}
                      onValueChange={(value) => {
                        setSelectedBillingAddress(value)
                        handleAddressSelection(value, "billing")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a saved address" />
                      </SelectTrigger>
                      <SelectContent>
                        {billingAddresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            <div className="text-left">
                              <div className="font-medium">
                                {address.first_name} {address.last_name}
                                {address.is_default && (
                                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-1 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {address.address_line1}, {address.city}, {address.state} {address.postal_code}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="new-billing"
                      name="billing-option"
                      checked={useNewBillingAddress}
                      onChange={() => setUseNewBillingAddress(true)}
                    />
                    <Label htmlFor="new-billing" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Enter new address
                    </Label>
                  </div>
                </div>
              )}

              {(useNewBillingAddress || billingAddresses.length === 0) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing-first-name">First Name</Label>
                      <Input
                        id="billing-first-name"
                        required
                        value={billingAddress.first_name}
                        onChange={(e) => setBillingAddress({ ...billingAddress, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-last-name">Last Name</Label>
                      <Input
                        id="billing-last-name"
                        required
                        value={billingAddress.last_name}
                        onChange={(e) => setBillingAddress({ ...billingAddress, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="billing-address1">Address Line 1</Label>
                    <Input
                      id="billing-address1"
                      required
                      value={billingAddress.address_line1}
                      onChange={(e) => setBillingAddress({ ...billingAddress, address_line1: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="billing-city">City</Label>
                      <Input
                        id="billing-city"
                        required
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-state">State</Label>
                      <Input
                        id="billing-state"
                        required
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-postal">Postal Code</Label>
                      <Input
                        id="billing-postal"
                        required
                        value={billingAddress.postal_code}
                        onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-billing"
                        checked={saveBillingAddress}
                        onCheckedChange={(checked) => setSaveBillingAddress(checked as boolean)}
                      />
                      <Label htmlFor="save-billing">Save this address for future orders</Label>
                    </div>

                    {saveBillingAddress && (
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id="default-billing"
                          checked={makeBillingDefault}
                          onCheckedChange={(checked) => setMakeBillingDefault(checked as boolean)}
                        />
                        <Label htmlFor="default-billing">Make this my default billing address</Label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure checkout with 256-bit SSL encryption</span>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Place Order - ${totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
