"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, ShoppingBag, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

interface AffiliateEarning {
  id: string
  action: string
  product_id: string
  commission_rate: number
  sale_amount: number
  created_at: string
  products: {
    name: string
    price: number
    images: string[]
  }
}

interface EarningsSummary {
  totalEarnings: number
  totalSales: number
  averageCommission: number
  period: number
}

export function EarningsDashboard() {
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([])
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [period, setPeriod] = useState("30")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [period])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/affiliate/earnings?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setEarnings(data.earnings)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error fetching earnings:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading earnings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Affiliate Earnings</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">Last {summary.period} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSales}</div>
              <p className="text-xs text-muted-foreground">Completed purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.averageCommission * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Per sale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalSales > 0 ? ((summary.totalSales / 100) * 100).toFixed(1) : "0"}%
              </div>
              <p className="text-xs text-muted-foreground">Tags to sales</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No earnings yet. Start tagging products to earn commissions!
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={earning.products.images[0] || "/placeholder.svg"}
                      alt={earning.products.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{earning.products.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(earning.sale_amount * earning.commission_rate)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {(earning.commission_rate * 100).toFixed(1)}% commission
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
