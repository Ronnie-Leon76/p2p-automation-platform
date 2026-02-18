"use client";

import { EnhancedTeamManagement } from "@/components/team-management";
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
import { useMockAuth } from "@/hooks/use-mock-auth";
import { getUserDisplayName, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import { decrypt } from "@/lib/crypto/encryption";
import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";
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

interface UserRole {
  type: "merchant" | "member";
  permissions: string[];
  accountType: "premium" | "standard" | "basic";
}

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
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [metrics, setMetrics] = useState<TraderMetrics[]>([]);
  const [teams, setTeams] = useState<ExchangeTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Use environment-appropriate auth
  const supabaseAuth = useSupabaseAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const { user, isAuthenticated, isLoading } = isMockMode()
    ? mockAuth
    : supabaseAuth;

  const supabase = getBrowserDbClient();

  // Function to determine user role based on profile data
  const determineUserRole = (userProfile: TraderProfile): UserRole => {
    // This logic can be customized based on your business rules
    const isMainUser =
      userProfile.kyc_level >= 3 &&
      userProfile.completion_rate >= 95 &&
      userProfile.completed_orders >= 100;

    if (isMainUser) {
      return {
        type: "merchant",
        permissions: [
          "create_teams",
          "manage_teams",
          "manage_ads",
          "manage_orders",
          "view_analytics",
        ],
        accountType:
          userProfile.completed_orders >= 1000 ? "premium" : "standard",
      };
    } else {
      return {
        type: "member",
        permissions: ["view_ads", "manage_orders", "dispute_resolution"],
        accountType: "basic",
      };
    }
  };

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine authentication state and load data
  useEffect(() => {
    if (!isClient) return;

    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment && isMockMode()) {
      // In development mode with mock auth
      if (!isLoading) {
        if (user) {
          // Loading mock profile data
          generateMockProfile();
        } else {
          setLoading(false);
        }
      }
    } else {
      // In production mode, use Supabase auth
      if (!isLoading) {
        if (user) {
          // Loading real profile data
          fetchTraderProfile();
          fetchTraderMetrics();
          fetchExchangeTeams();
        } else {
          setLoading(false);
        }
      }
    }
  }, [isClient, user, isLoading]);

  const generateMockProfile = () => {
    // Generate mock data for development
    // Generate mock data for development
    const mockProfileData: TraderProfile = {
      id: user?.id || "mock-trader-1",
      full_name: isMockMode()
        ? (user as any)?.full_name || "John Trader"
        : getUserDisplayName(user as any) || "John Trader",
      exchange_provider: "okx",
      exchange_user_id: "mock-exchange-123",
      kyc_level: 3,
      completion_rate: 98.5,
      completed_orders: 1247,
      is_verified_trader: true,
      trader_info: {
        joined_date: "2024-01-15",
        preferred_currency: "USDT",
        trading_hours: "24/7",
      },
      created_at: user?.created_at || new Date().toISOString(),
    };

    // Determine and add user role
    mockProfileData.user_role = determineUserRole(mockProfileData);

    setProfile(mockProfileData);

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

    setTeams([
      {
        id: "team-1",
        team_name: "Elite Traders",
        team_type: "Professional",
        exchange_name: isMockMode()
          ? (user as any)?.exchange_credentials?.exchange?.toUpperCase() ||
            "OKX"
          : (
              user as any
            )?.user_metadata?.exchange_credentials?.exchange?.toUpperCase() ||
            "OKX",
        external_team_id: "ET-2024-001",
        exchange_role: "Senior Trader",
      },
    ]);

    setLoading(false);
    // Mock profile data generated successfully
  };

  const fetchTraderProfile = async () => {
    try {
      // First try to get cached merchant profile data (more comprehensive)
      const { data: merchantData, error: merchantError } = await supabase
        .from("user_exchange_data")
        .select("data")
        .eq("user_id", user?.id)
        .eq("exchange", "okx")
        .eq("data_type", "merchant_profile")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (merchantData && !merchantError) {
        console.log("📦 Using cached merchant profile data");
        console.log("🏪 Merchant Profile Data:", merchantData.data);

        setProfile({
          id: user?.id || "",
          full_name:
            merchantData.data.nickName ||
            getUserDisplayName(user as any) ||
            "Trader",
          exchange_provider: "okx",
          exchange_user_id:
            merchantData.data.merchantId || merchantData.data.userId || "",
          kyc_level: merchantData.data.isKycVerified ? 2 : 1,
          completion_rate: parseFloat(
            merchantData.data.merchantInfo30DayOrderInfo?.[0]
              ?.completionRate30Day || "0"
          ),
          completed_orders: parseInt(
            merchantData.data.completedBuyOrders || "0"
          ),
          is_verified_trader: merchantData.data.isKycVerified || false,
          trader_info: {
            ...merchantData.data,
            isMerchant: true,
            merchantLevel:
              merchantData.data.auditStatus === "1" ? "verified" : "unverified",
            totalOrderAmount: merchantData.data.commonOrderTotal,
            positiveRate: merchantData.data.positiveReviewPercentage,
            tradingVolume: merchantData.data.commonOrderTotal,
            avgReleaseTime: "0", // Not provided in merchant profile API
            avgPayTime: "0", // Not provided in merchant profile API
            exchange: "okx",
          },
          created_at: new Date().toISOString(),
        });

        console.log("📊 Profile set with merchant data:", {
          exchange_user_id:
            merchantData.data.merchantId || merchantData.data.userId || "",
          completion_rate: parseFloat(
            merchantData.data.merchantInfo30DayOrderInfo?.[0]
              ?.completionRate30Day || "0"
          ),
          completed_orders: parseInt(
            merchantData.data.completedBuyOrders || "0"
          ),
          totalOrderAmount: merchantData.data.commonOrderTotal,
          positiveRate: merchantData.data.positiveReviewPercentage,
        });

        return;
      }

      // Fallback to basic profile data
      const { data: cachedData, error: cacheError } = await supabase
        .from("user_exchange_data")
        .select("data")
        .eq("user_id", user?.id)
        .eq("exchange", "okx")
        .eq("data_type", "profile")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cachedData && !cacheError) {
        console.log("📦 Using cached exchange profile data");
        setProfile({
          id: user?.id || "",
          full_name:
            cachedData.data.nickName ||
            getUserDisplayName(user as any) ||
            "Trader",
          exchange_provider: "okx",
          exchange_user_id: cachedData.data.userId || "",
          kyc_level: parseInt(cachedData.data.kycLevel) || 0,
          completion_rate:
            parseFloat(cachedData.data.completionRate) * 100 || 0,
          completed_orders: parseInt(cachedData.data.completedOrders) || 0,
          is_verified_trader: cachedData.data.kycLevel === "2",
          trader_info: { ...cachedData.data, exchange: "okx" },
          created_at: new Date().toISOString(),
        });
        return;
      }

      // If no cached data, try to fetch from exchange API
      await fetchLiveExchangeData();

      // Fallback to basic user data from users table
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

  const fetchLiveExchangeData = async () => {
    try {
      // Get saved credentials
      const { data: credData, error: credError } = await supabase
        .from("exchange_credentials")
        .select("api_key, api_secret, passphrase")
        .eq("user_id", user?.id)
        .eq("exchange", "okx")
        .single();

      if (credError || !credData) {
        console.log("No exchange credentials found");
        return;
      }

      // Decrypt credentials
      const credentials = {
        apiKey: decrypt(credData.api_key),
        apiSecret: decrypt(credData.api_secret),
        passphrase: decrypt(credData.passphrase),
      };

      console.log("🔄 Fetching live exchange data...");

      // Fetch both user info and merchant profile from exchange
      const [userInfoResponse, merchantProfileResponse] = await Promise.all([
        fetch("/api/okx/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "user-info",
            ...credentials,
          }),
        }),
        fetch("/api/okx/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "merchant-profile",
            ...credentials,
          }),
        }),
      ]);

      if (userInfoResponse.ok) {
        const exchangeData = await userInfoResponse.json();

        // Cache the basic user data
        await supabase.from("user_exchange_data").upsert({
          user_id: user?.id || "",
          exchange: "okx",
          data_type: "profile",
          data: exchangeData,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        });

        // Try to get merchant profile data if available
        if (merchantProfileResponse.ok) {
          const merchantData = await merchantProfileResponse.json();

          // Cache the merchant profile data
          await supabase.from("user_exchange_data").upsert({
            user_id: user?.id || "",
            exchange: "okx",
            data_type: "merchant_profile",
            data: merchantData,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
          });

          // Update profile with comprehensive merchant data
          setProfile({
            id: user?.id || "",
            full_name:
              merchantData.nickName ||
              getUserDisplayName(user as any) ||
              "Trader",
            exchange_provider: "okx",
            exchange_user_id: merchantData.merchantId || "",
            kyc_level: merchantData.isKycVerified ? 2 : 1,
            completion_rate: parseFloat(
              merchantData.merchantInfo30DayOrderInfo?.[0]
                ?.completionRate30Day || "0"
            ),
            completed_orders: parseInt(merchantData.completedBuyOrders || "0"),
            is_verified_trader: merchantData.isKycVerified || false,
            trader_info: {
              ...merchantData,
              isMerchant: true,
              merchantLevel:
                merchantData.auditStatus === "1" ? "verified" : "unverified",
              totalOrderAmount: merchantData.commonOrderTotal,
              positiveRate: merchantData.positiveReviewPercentage,
              tradingVolume: merchantData.commonOrderTotal,
              exchange: "okx",
            },
            created_at: new Date().toISOString(),
          });

          // Profile updated with live merchant data
        } else {
          // Fallback to basic user info
          setProfile({
            id: user?.id || "",
            full_name:
              exchangeData.nickName ||
              getUserDisplayName(user as any) ||
              "Trader",
            exchange_provider: "okx",
            exchange_user_id: exchangeData.userId || "",
            kyc_level: parseInt(exchangeData.kycLevel) || 0,
            completion_rate: parseFloat(exchangeData.completionRate) * 100 || 0,
            completed_orders: parseInt(exchangeData.completedOrders) || 0,
            is_verified_trader: exchangeData.kycLevel === "2",
            trader_info: { ...exchangeData, exchange: "okx" },
            created_at: new Date().toISOString(),
          });

          console.log("✅ Profile updated with live user data");
        }
      }
    } catch (error) {
      console.error("Error fetching live exchange data:", error);
    }
  };

  const fetchTraderMetrics = async () => {
    try {
      // Try to get cached balance data first
      const { data: cachedBalance, error: balanceError } = await supabase
        .from("user_exchange_data")
        .select("data")
        .eq("user_id", user?.id)
        .eq("exchange", "okx")
        .eq("data_type", "balance")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cachedBalance && !balanceError) {
        console.log("📦 Using cached balance data for metrics");
        // Convert balance data to metrics format
        const balanceData = cachedBalance.data;
        const mockMetrics = Object.keys(balanceData).map((currency, index) => ({
          metric_date: new Date().toISOString().split("T")[0],
          total_orders: Math.floor(Math.random() * 1000),
          completed_orders: Math.floor(Math.random() * 950),
          cancelled_orders: Math.floor(Math.random() * 50),
          total_volume: parseFloat(balanceData[currency]?.available || 0),
          completion_rate: Math.random() * 100,
          average_completion_time: Math.floor(Math.random() * 60),
          rating: 4.5 + Math.random() * 0.5,
          positive_feedback: Math.floor(Math.random() * 50),
          negative_feedback: Math.floor(Math.random() * 5),
        }));

        setMetrics(mockMetrics.slice(0, 30));
        setLoading(false);
        return;
      }

      // Fallback to database metrics
      const { data, error } = await supabase
        .from("trader_metrics")
        .select("*")
        .eq("user_id", user?.id)
        .order("metric_date", { ascending: false })
        .limit(30);

      if (error) {
        // If table doesn't exist, set empty metrics
        if (
          error.code === "PGRST204" ||
          error.code === "PGRST106" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          console.log(
            "Trader metrics table not found, using empty metrics list"
          );
          setMetrics([]);
          return;
        }
        throw error;
      }
      setMetrics(data || []);
    } catch (error) {
      console.error("Error fetching trader metrics:", error);
      // Set empty metrics array on error to prevent blocking the UI
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeTeams = async () => {
    try {
      // Check if exchange_team_members table exists by trying to query it
      const { data, error } = await supabase
        .from("exchange_team_members")
        .select(
          `
          *,
          exchange_teams(*)
        `
        )
        .eq("user_id", user?.id);

      if (error) {
        // If table doesn't exist or user has no teams, set empty array
        if (
          error.code === "PGRST204" ||
          error.code === "PGRST106" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          console.log(
            "Exchange teams tables not found, using empty teams list"
          );
          setTeams([]);
          return;
        }
        throw error;
      }

      const teamsData = data?.map((member: any) => ({
        ...member.exchange_teams,
        exchange_role: member.exchange_role,
      }));

      setTeams(teamsData || []);
    } catch (error) {
      console.error("Error fetching exchange teams:", error);
      // Set empty teams array on error to prevent blocking the UI
      setTeams([]);
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

  // Show login prompt if no user is authenticated
  if (!profile && !loading) {
    const isDevelopment = process.env.NODE_ENV === "development";
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex items-center justify-center h-64">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDevelopment
                  ? "Mock Authentication Required"
                  : "Please Sign In"}
              </h3>
              <p className="text-gray-600 mb-4">
                {isDevelopment
                  ? "You need to login with mock credentials to view the profile."
                  : "Please sign in to view your trader profile."}
              </p>
              <Button
                onClick={() => (window.location.href = "/auth/login")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isDevelopment ? "Mock Login" : "Sign In"}
              </Button>
            </CardContent>
          </Card>
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
                    {getExchangeIcon(profile.exchange_provider || "okx")}{" "}
                    {(profile.exchange_provider || "OKX").toUpperCase()} Trader
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
                  href={`https://${profile.exchange_provider || "okx"}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on {(profile.exchange_provider || "OKX").toUpperCase()}
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
            {/* Exchange Information Card */}
            {profile.trader_info?.exchange && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 border-blue-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Exchange Data Source:{" "}
                          {profile.trader_info.exchange.toUpperCase()}
                        </p>
                        <p className="text-xs text-blue-700">
                          User ID: {profile.exchange_user_id || "Not connected"}
                          {profile.trader_info.isMerchant && (
                            <Badge
                              variant="secondary"
                              className="ml-2 bg-purple-100 text-purple-700"
                            >
                              Merchant Level:{" "}
                              {profile.trader_info.merchantLevel || "N/A"}
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 border-green-200"
                      >
                        Connected
                      </Badge>
                      {profile.trader_info.totalOrderAmount && (
                        <p className="text-xs text-blue-700 mt-1">
                          Total Volume: $
                          {parseFloat(
                            profile.trader_info.totalOrderAmount
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {(profile.trader_info.positiveReviews ||
                    profile.trader_info.totalReviews ||
                    profile.trader_info.tradedUsers) && (
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-blue-200">
                      {profile.trader_info.positiveReviews && (
                        <div className="text-center">
                          <p className="text-xs text-blue-600">
                            Positive Reviews
                          </p>
                          <p className="text-sm font-medium text-blue-900">
                            {profile.trader_info.positiveReviews}
                          </p>
                        </div>
                      )}
                      {profile.trader_info.totalReviews && (
                        <div className="text-center">
                          <p className="text-xs text-blue-600">Total Reviews</p>
                          <p className="text-sm font-medium text-blue-900">
                            {profile.trader_info.totalReviews}
                          </p>
                        </div>
                      )}
                      {profile.trader_info.tradedUsers && (
                        <div className="text-center">
                          <p className="text-xs text-blue-600">Traded Users</p>
                          <p className="text-sm font-medium text-blue-900">
                            {profile.trader_info.tradedUsers}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                        {profile.completion_rate?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={profile.completion_rate}
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
                        {profile.trader_info?.positiveRate
                          ? `${profile.trader_info.positiveRate}%`
                          : latestMetrics?.rating
                          ? latestMetrics.rating.toFixed(1)
                          : "N/A"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = profile.trader_info?.positiveRate
                            ? parseFloat(profile.trader_info.positiveRate) / 20 // Convert percentage to 5-star scale
                            : latestMetrics?.rating || 0;
                          return (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          );
                        })}
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
                        {profile.trader_info?.totalOrderAmount
                          ? parseFloat(
                              profile.trader_info.totalOrderAmount
                            ).toLocaleString()
                          : latestMetrics?.total_volume
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
            {profile?.user_role?.type === "merchant" ? (
              // Main User - Team Management Interface
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Team Management
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            Create and manage your P2P trading teams
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Main User
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Team Owner Privileges
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Create and manage multiple trading teams</li>
                        <li>• Invite team members to join your operations</li>
                        <li>
                          • Configure exchange connections (OKX, Binance, Bybit)
                        </li>
                        <li>• Set role-based permissions for team members</li>
                        <li>• Monitor team performance and analytics</li>
                      </ul>
                    </div>
                    <EnhancedTeamManagement />
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Team Member - Team Information Interface
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Team Membership
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          Teams you're part of and your roles
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Team Member
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">
                      Member Privileges
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Join existing teams created by main users</li>
                      <li>• Manage orders and handle dispute resolution</li>
                      <li>• Access team's ad management interface</li>
                      <li>• Collaborate on P2P trading operations</li>
                    </ul>
                  </div>

                  {teams.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        No team memberships
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        You're not part of any teams yet. Join a team to start
                        collaborating.
                      </p>
                      <Button
                        onClick={() =>
                          (window.location.href = "/dashboard/ads")
                        }
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Browse Available Teams
                      </Button>
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
                      <div className="pt-4 border-t border-gray-100">
                        <Button
                          onClick={() =>
                            (window.location.href = "/dashboard/ads")
                          }
                          variant="outline"
                          className="w-full"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Team Operations
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                        Connected{" "}
                        {(profile.exchange_provider || "OKX").toUpperCase()}{" "}
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

