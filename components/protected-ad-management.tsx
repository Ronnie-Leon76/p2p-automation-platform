"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTeam } from "@/lib/hooks/use-team"
import { TeamSwitcher } from "@/components/team-switcher"

interface Ad {
  id: string
  team_id: string
  exchange_name: string
  external_ad_id: string | null
  side: string
  crypto_currency: string
  fiat_currency: string
  crypto_amount: number | null
  unit_price: number | null
  min_order_limit: number | null
  max_order_limit: number | null
  status: string
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export function ProtectedAdManagement() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { currentTeam } = useTeam()
  const supabase = createClient()

  useEffect(() => {
    if (!currentTeam) return

    const fetchAds = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("ads")
          .select("*")
          .eq("team_id", currentTeam.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setAds(data || [])
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAds()
  }, [currentTeam, supabase])

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
          <p className="text-muted-foreground mb-4">Please select or create a team to manage ads.</p>
          <TeamSwitcher />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Team Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ad Management</h2>
            <p className="text-muted-foreground">Create and manage your P2P trading advertisements</p>
          </div>
          <TeamSwitcher />
        </div>
        <Button disabled className="opacity-50">
          <Plus className="mr-2 h-4 w-4" />
          Create Ad (Protected)
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Protection Notice */}
      <Alert className="bg-yellow-500/10 border-yellow-500/20">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-400">
          <strong>Protected Environment:</strong> Ad creation and modification features are disabled as OKX doesn't
          provide a sandbox environment. This protects your live trading operations from accidental changes during
          development.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.length}</div>
            <p className="text-xs text-muted-foreground">{ads.filter((ad) => ad.status === "active").length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buy Ads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.filter((ad) => ad.side === "buy").length}</div>
            <p className="text-xs text-muted-foreground">Active buy orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell Ads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.filter((ad) => ad.side === "sell").length}</div>
            <p className="text-xs text-muted-foreground">Active sell orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchanges</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(ads.map((ad) => ad.exchange_name)).size}</div>
            <p className="text-xs text-muted-foreground">Connected exchanges</p>
          </CardContent>
        </Card>
      </div>

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Advertisements</CardTitle>
          <CardDescription>View your P2P trading ads from the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ads found for this team.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your exchange API and create your first ad to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <Badge variant="outline">{ad.exchange_name.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.side === "buy" ? "default" : "secondary"}>{ad.side.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {ad.crypto_currency}/{ad.fiat_currency}
                    </TableCell>
                    <TableCell>{ad.unit_price || "N/A"}</TableCell>
                    <TableCell>{ad.crypto_amount || "N/A"}</TableCell>
                    <TableCell>
                      {ad.min_order_limit && ad.max_order_limit
                        ? `${ad.min_order_limit} - ${ad.max_order_limit}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.status === "active" ? "default" : "secondary"}>{ad.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(ad.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
