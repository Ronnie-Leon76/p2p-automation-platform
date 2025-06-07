"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, TrendingUp, Shield, Award, Clock, DollarSign, BarChart3, RefreshCw, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"

interface TraderProfile {
  id: string
  full_name: string
  exchange_provider: string
  exchange_user_id: string
  kyc_level: number
  completion_rate: number
  completed_orders: number
  is_verified_trader: boolean
  trader_info: any
  created_at: string
}

interface TraderMetrics {
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  total_volume: number
  completion_rate: number
  average_completion_time: number
  rating: number
  positive_feedback: number
  negative_feedback: number
  metric_date: string
}

interface ExchangeTeam {
  id: string
  team_name: string
  team_type: string
  exchange_name: string
  external_team_id: string
  exchange_role: string
}

export function TraderProfile() {
  const [profile, setProfile] = useState<TraderProfile | null>(null)
  const [metrics, setMetrics] = useState<TraderMetrics[]>([])
  const [teams, setTeams] = useState<ExchangeTeam[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchTraderProfile()
      fetchTraderMetrics()
      fetchExchangeTeams()
    }
  }, [user])

  const fetchTraderProfile = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", user?.id).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching trader profile:", error)
    }
  }

  const fetchTraderMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("trader_metrics")
        .select("*")
        .eq("user_id", user?.id)
        .order("metric_date", { ascending: false })
        .limit(30)

      if (error) throw error
      setMetrics(data || [])
    } catch (error) {
      console.error("Error fetching trader metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExchangeTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("exchange_team_members")
        .select(`
          *,
          exchange_teams(*)
        `)
        .eq("user_id", user?.id)

      if (error) throw error

      const teamsData = data?.map((member: any) => ({
        ...member.exchange_teams,
        exchange_role: member.exchange_role,
      }))

      setTeams(teamsData || [])
    } catch (error) {
      console.error("Error fetching exchange teams:", error)
    }
  }

  const getExchangeIcon = (exchange: string) => {
    const icons = {
      okx: "🟡",
      binance: "🟨",
      bybit: "🟣",
    }
    return icons[exchange as keyof typeof icons] || "🔗"
  }

  const getKYCBadge = (level: number) => {
    if (level >= 3) return <Badge className="bg-green-500">KYC Level {level}</Badge>
    if (level >= 2) return <Badge className="bg-yellow-500">KYC Level {level}</Badge>
    return <Badge variant="outline">KYC Level {level}</Badge>
  }

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.95) return "text-green-500"
    if (rate >= 0.9) return "text-yellow-500"
    return "text-red-500"
  }

  const latestMetrics = metrics[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No trader profile found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`} />
                <AvatarFallback>{profile.full_name?.charAt(0) || "T"}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <p className="text-muted-foreground">
                  {getExchangeIcon(profile.exchange_provider)} {profile.exchange_provider.toUpperCase()} Trader
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getKYCBadge(profile.kyc_level)}
                  {profile.is_verified_trader && (
                    <Badge className="bg-blue-500">
                      <Shield className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`https://${profile.exchange_provider}.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on {profile.exchange_provider.toUpperCase()}
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getCompletionRateColor(profile.completion_rate)}`}>
                  {(profile.completion_rate * 100).toFixed(1)}%
                </div>
                <Progress value={profile.completion_rate * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.completed_orders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total successful trades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestMetrics?.rating ? latestMetrics.rating.toFixed(1) : "N/A"}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= (latestMetrics?.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${latestMetrics?.total_volume ? latestMetrics.total_volume.toLocaleString() : "0"}
                </div>
                <p className="text-xs text-muted-foreground">Lifetime trading volume</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Performance */}
          {latestMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>Latest trading metrics from {latestMetrics.metric_date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Orders This Period</p>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">{latestMetrics.total_orders}</div>
                      <Badge variant="outline">{latestMetrics.completed_orders} completed</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average Completion Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">
                        {latestMetrics.average_completion_time ? `${latestMetrics.average_completion_time} min` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Feedback Score</p>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">+{latestMetrics.positive_feedback}</span>
                      <span className="text-red-500">-{latestMetrics.negative_feedback}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Metrics History</CardTitle>
              <CardDescription>Your performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No metrics data available</p>
              ) : (
                <div className="space-y-4">
                  {metrics.slice(0, 10).map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">{metric.metric_date}</div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>{metric.total_orders} orders</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{(metric.completion_rate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">completion</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${metric.total_volume.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">volume</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Teams</CardTitle>
              <CardDescription>Teams you're part of on connected exchanges</CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No team memberships found</p>
              ) : (
                <div className="grid gap-4">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{getExchangeIcon(team.exchange_name)}</div>
                        <div>
                          <h3 className="font-semibold">{team.team_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {team.exchange_name.toUpperCase()} • {team.team_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{team.exchange_role}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">Team ID: {team.external_team_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account History</CardTitle>
              <CardDescription>Your trading account timeline and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="font-semibold">Account Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connected {profile.exchange_provider.toUpperCase()} account on{" "}
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {profile.is_verified_trader && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div>
                      <p className="font-semibold">Trader Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Account verified with KYC Level {profile.kyc_level}
                      </p>
                    </div>
                  </div>
                )}

                {profile.completed_orders > 0 && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div>
                      <p className="font-semibold">Trading Milestone</p>
                      <p className="text-sm text-muted-foreground">
                        Completed {profile.completed_orders} successful P2P trades
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
