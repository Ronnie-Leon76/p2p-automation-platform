"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  RefreshCw,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TraderProfile {
  id: string;
  full_name: string;
  exchange_provider: string;
  exchange_user_id: string;
  kyc_level: number;
  completion_rate: number;
  completed_orders: number;
  is_verified_trader: boolean;
  trader_info: any;
  created_at: string;
}

interface TraderMetrics {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_volume: number;
  completion_rate: number;
  average_completion_time: number;
  rating: number;
  positive_feedback: number;
  negative_feedback: number;
  metric_date: string;
}

interface ExchangeTeam {
  id: string;
  team_name: string;
  team_type: string;
  exchange_name: string;
  external_team_id: string;
  exchange_role: string;
}

export function TraderProfile() {
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [metrics, setMetrics] = useState<TraderMetrics[]>([]);
  const [teams, setTeams] = useState<ExchangeTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchTraderProfile();
      fetchTraderMetrics();
      fetchExchangeTeams();
    }
  }, [user]);

  const fetchTraderProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching trader profile:", error);
    }
  };

  const fetchTraderMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("trader_metrics")
        .select("*")
        .eq("user_id", user?.id)
        .order("metric_date", { ascending: false })
        .limit(30);

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error("Error fetching trader metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("exchange_team_members")
        .select(
          `
          *,
          exchange_teams(*)
        `
        )
        .eq("user_id", user?.id);

      if (error) throw error;

      const teamsData = data?.map((member: any) => ({
        ...member.exchange_teams,
        exchange_role: member.exchange_role,
      }));

      setTeams(teamsData || []);
    } catch (error) {
      console.error("Error fetching exchange teams:", error);
    }
  };

  const getExchangeIcon = (exchange: string) => {
    const icons = {
      okx: "🟡",
      binance: "🟨",
      bybit: "🟣",
    };
    return icons[exchange as keyof typeof icons] || "🔗";
  };

  const getKYCBadge = (level: number) => {
    if (level >= 3)
      return <Badge className="bg-green-500">KYC Level {level}</Badge>;
    if (level >= 2)
      return <Badge className="bg-yellow-500">KYC Level {level}</Badge>;
    return <Badge variant="outline">KYC Level {level}</Badge>;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.95) return "text-green-500";
    if (rate >= 0.9) return "text-yellow-500";
    return "text-red-500";
  };

  const latestMetrics = metrics[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600 font-medium">
              Loading profile...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No profile found
              </h3>
              <p className="text-sm text-gray-500">
                Unable to load trader profile data
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trader Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your trading account and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                    {profile.full_name?.charAt(0) || "T"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.full_name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {getExchangeIcon(profile.exchange_provider)}{" "}
                    {profile.exchange_provider.toUpperCase()} Trader
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    {getKYCBadge(profile.kyc_level)}
                    {profile.is_verified_trader && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        <Shield className="mr-1.5 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" asChild className="gap-2">
                <a
                  href={`https://${profile.exchange_provider}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on {profile.exchange_provider.toUpperCase()}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="metrics"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Metrics
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Completion Rate
                        </p>
                        <p className="text-xs text-gray-500">
                          Success percentage
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${getCompletionRateColor(
                          profile.completion_rate
                        )}`}
                      >
                        {(profile.completion_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={profile.completion_rate * 100}
                    className="mt-4 h-2"
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Completed Orders
                        </p>
                        <p className="text-xs text-gray-500">
                          Total successful
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {profile.completed_orders.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Rating
                        </p>
                        <p className="text-xs text-gray-500">User feedback</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {latestMetrics?.rating
                          ? latestMetrics.rating.toFixed(1)
                          : "N/A"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= (latestMetrics?.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Volume
                        </p>
                        <p className="text-xs text-gray-500">
                          Lifetime trading
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        $
                        {latestMetrics?.total_volume
                          ? latestMetrics.total_volume.toLocaleString()
                          : "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Performance */}
            {latestMetrics && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Recent Performance
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Latest metrics from{" "}
                        {new Date(
                          latestMetrics.metric_date
                        ).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-gray-700">
                          Orders This Period
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-gray-900">
                          {latestMetrics.total_orders}
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {latestMetrics.completed_orders} completed
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-gray-700">
                          Avg Completion Time
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {latestMetrics.average_completion_time
                          ? `${latestMetrics.average_completion_time} min`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-purple-600" />
                        <p className="text-sm font-medium text-gray-700">
                          Feedback Score
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant="secondary"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          +{latestMetrics.positive_feedback} positive
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          -{latestMetrics.negative_feedback} negative
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Trading Metrics History
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Your performance over the last 30 days
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {metrics.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No metrics available
                    </h3>
                    <p className="text-sm text-gray-500">
                      Start trading to see your performance metrics
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics.slice(0, 10).map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(
                                metric.metric_date
                              ).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{metric.total_orders} orders</span>
                              <span>•</span>
                              <span>{metric.completed_orders} completed</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {(metric.completion_rate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">completion</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${metric.total_volume.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">volume</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Exchange Teams
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Teams you're part of on connected exchanges
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {teams.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No team memberships
                    </h3>
                    <p className="text-sm text-gray-500">
                      You're not part of any exchange teams yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-lg">
                            {getExchangeIcon(team.exchange_name)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {team.team_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {team.exchange_name.toUpperCase()} •{" "}
                              {team.team_type}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Team ID: {team.external_team_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {team.exchange_role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Account History
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Your trading account timeline and milestones
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100">
                    <div className="h-2 w-2 bg-green-500 rounded-full mt-3" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <p className="font-semibold text-gray-900">
                          Account Connected
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Connected {profile.exchange_provider.toUpperCase()}{" "}
                        account on{" "}
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {profile.is_verified_trader && (
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-3" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <p className="font-semibold text-gray-900">
                            Trader Verification
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Account verified with KYC Level {profile.kyc_level}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.completed_orders > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full mt-3" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-yellow-600" />
                          <p className="font-semibold text-gray-900">
                            Trading Milestone
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Completed {profile.completed_orders} successful P2P
                          trades
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
    </div>
  );
}
