"use client";

import { EnhancedTeamManagement } from "@/components/team-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { getUserDisplayName, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import { Activity, BarChart3, Calendar, Clock, Shield, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface UserRole {
  type: "merchant" | "member";
  permissions: string[];
  accountType: "premium" | "standard" | "basic";
}

interface TraderProfileData {
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
  user_role?: UserRole;
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
  const [profile, setProfile] = useState<TraderProfileData | null>(null);
  const [metrics, setMetrics] = useState<TraderMetrics[]>([]);
  const [teams, setTeams] = useState<ExchangeTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseAuth = useSupabaseAuth();
  const mockAuth = isMockMode() ? useMockAuth() : { user: null, isAuthenticated: false, isLoading: false };
  const { user, isLoading } = isMockMode() ? mockAuth : supabaseAuth;

  const determineUserRole = (data: TraderProfileData): UserRole => {
    const isMainUser = data.kyc_level >= 3 && data.completion_rate >= 95 && data.completed_orders >= 100;
    if (isMainUser) {
      return {
        type: "merchant",
        permissions: ["create_teams", "manage_teams", "manage_ads", "manage_orders", "view_analytics"],
        accountType: data.completed_orders >= 1000 ? "premium" : "standard",
      };
    }
    return {
      type: "member",
      permissions: ["view_ads", "manage_orders", "dispute_resolution"],
      accountType: "basic",
    };
  };

  useEffect(() => {
    const load = async () => {
      if (isLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      if (isMockMode()) {
        const mockProfile: TraderProfileData = {
          id: user?.id || "mock-trader-1",
          full_name: (user as any)?.full_name || getUserDisplayName(user as any) || "John Trader",
          exchange_provider: "okx",
          exchange_user_id: "mock-exchange-123",
          kyc_level: 3,
          completion_rate: 98.5,
          completed_orders: 1247,
          is_verified_trader: true,
          trader_info: { joined_date: "2024-01-15", preferred_currency: "USDT" },
          created_at: user?.created_at || new Date().toISOString(),
        };
        mockProfile.user_role = determineUserRole(mockProfile);
        setProfile(mockProfile);
        setMetrics([
          {
            total_orders: 1350,
            completed_orders: 1247,
            cancelled_orders: 103,
            total_volume: 2847392.5,
            completion_rate: 98.5,
            average_completion_time: 4.2,
            rating: 4.9,
            positive_feedback: 1189,
            negative_feedback: 12,
            metric_date: new Date().toISOString().split("T")[0],
          },
        ]);
        setTeams([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/trader/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load trader profile");
        }

        const loadedProfile = payload?.profile as TraderProfileData | null;
        if (loadedProfile) {
          loadedProfile.user_role = determineUserRole(loadedProfile);
        }

        setProfile(loadedProfile);
        setMetrics(Array.isArray(payload?.metrics) ? payload.metrics : []);
        setTeams(Array.isArray(payload?.teams) ? payload.teams : []);
      } catch (error) {
        console.error("Error loading trader profile:", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, isLoading]);

  const latestMetrics = useMemo(() => metrics[0], [metrics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Loading trader profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Profile not available</CardTitle>
            <CardDescription>Connect your exchange credentials to load profile data.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name || "Trader"}</CardTitle>
          <CardDescription>
            {(profile.exchange_provider || "okx").toUpperCase()} • {profile.exchange_user_id || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary">KYC Level {profile.kyc_level ?? 0}</Badge>
          <Badge variant="secondary">{profile.completed_orders ?? 0} completed orders</Badge>
          <Badge variant="secondary">{(profile.completion_rate ?? 0).toFixed(1)}% completion</Badge>
          <Badge variant={profile.user_role?.type === "merchant" ? "default" : "outline"}>
            {profile.user_role?.type === "merchant" ? "Main User" : "Team Member"}
          </Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{profile.is_verified_trader ? "Verified" : "Not verified"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{(profile.completion_rate ?? 0).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{profile.completed_orders ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Metrics</CardTitle>
              <CardDescription>Latest performance snapshots</CardDescription>
            </CardHeader>
            <CardContent>
              {!latestMetrics ? (
                <p className="text-sm text-gray-500">No metrics available</p>
              ) : (
                <div className="space-y-3">
                  {metrics.slice(0, 10).map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border p-3">
                      <div>
                        <p className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(metric.metric_date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{metric.completed_orders}/{metric.total_orders} orders completed</p>
                      </div>
                      <p className="font-semibold">${Number(metric.total_volume || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {profile.user_role?.type === "merchant" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Team Management</CardTitle>
                <CardDescription>Create and manage teams</CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedTeamManagement />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Team Memberships</CardTitle>
                <CardDescription>Teams you are currently part of</CardDescription>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-sm text-gray-500">No team memberships found.</p>
                ) : (
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <div key={team.id} className="rounded border p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{team.team_name}</p>
                          <p className="text-sm text-gray-600">{team.exchange_name?.toUpperCase()} • {team.team_type}</p>
                        </div>
                        <Badge variant="secondary">{team.exchange_role}</Badge>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/dashboard/ads")}>
                      Manage Team Operations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
