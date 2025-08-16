"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Truck, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

interface CheckoutFormProps {
  cartItems: any[]
  subtotal: number
}

export function CheckoutForm({ cartItems, subtotal }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

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

  const shippingCost = subtotal > 100 ? 0 : 15
  const taxAmount = subtotal * 0.08
  const totalAmount = subtotal + shippingCost + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
            </div>
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
