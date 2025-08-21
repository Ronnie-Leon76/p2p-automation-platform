"use client";

import { DataRefreshControl } from "@/components/data-refresh-control";
import { EnhancedTeamManagement } from "@/components/team-management";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { getUserDisplayName, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  RefreshCw,
  Settings,
  Star,
  Target,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  profile_complete?: boolean;
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

interface TradingPreferences {
  preferred_currencies: string[];
  min_order_amount: number;
  max_order_amount: number;
  trading_hours_start: string;
  trading_hours_end: string;
  auto_accept_orders: boolean;
  require_kyc_verification: boolean;
  preferred_payment_methods: string[];
  notification_settings: {
    email_notifications: boolean;
    order_alerts: boolean;
    price_alerts: boolean;
    system_updates: boolean;
  };
  risk_management: {
    max_daily_volume: number;
    max_orders_per_day: number;
    enable_stop_loss: boolean;
  };
  bio: string;
  profile_visibility: "public" | "private" | "team_only";
}

export function TraderProfile() {
  const [isClient, setIsClient] = useState(false);
  const [fallbackProfile, setFallbackProfile] = useState<TraderProfile | null>(
    null
  );
  const [preferences, setPreferences] = useState<TradingPreferences>({
    preferred_currencies: ["USDT", "USD"],
    min_order_amount: 100,
    max_order_amount: 10000,
    trading_hours_start: "09:00",
    trading_hours_end: "18:00",
    auto_accept_orders: false,
    require_kyc_verification: true,
    preferred_payment_methods: ["Bank Transfer", "PayPal"],
    notification_settings: {
      email_notifications: true,
      order_alerts: true,
      price_alerts: false,
      system_updates: true,
    },
    risk_management: {
      max_daily_volume: 50000,
      max_orders_per_day: 20,
      enable_stop_loss: true,
    },
    bio: "",
    profile_visibility: "public",
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Use environment-appropriate auth
  const supabaseAuth = useSupabaseAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const { user, isAuthenticated, isLoading } = isMockMode()
    ? mockAuth
    : supabaseAuth;

  // Use the new exchange data hook
  const exchangeData = useExchangeData(user?.id || null, "okx", {
    autoRefresh: true, // Re-enable to test profile update
    refreshInterval: 30, // 30 minutes
    includeTypes: ["profile", "merchant_profile", "balance", "payment_methods"],
    onRefreshStart: () => {}, // Data refresh started
    onRefreshComplete: () => {}, // Data refresh completed
    onRefreshError: (error) => console.error("❌ Data refresh failed:", error),
  });

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to determine user role based on profile data
  const determineUserRole = (userProfile: TraderProfile): UserRole => {
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

  // Convert exchange data to trader profile format
  const convertToTraderProfile = (): TraderProfile | null => {
    const merchantProfile = exchangeData.merchantProfile?.data;
    const basicProfile = exchangeData.profile?.data;

    console.log("🔍 Trader Profile Debug - Full exchange data:", exchangeData);
    console.log("🏪 Merchant Profile Data:", merchantProfile);
    console.log("👤 Basic Profile Data:", basicProfile);

    // Profile conversion logic
    if (!merchantProfile && !basicProfile && !user) return null;

    // Prioritize merchant profile data
    const profileData = merchantProfile || basicProfile;

    if (profileData) {
      console.log("📊 Using profile data:", profileData);

      // Extract completion rate properly from OKX merchant profile
      let completionRate = 0;
      if (merchantProfile) {
        // Check for both possible field locations in merchant profile
        completionRate =
          parseFloat(merchantProfile.completionRate) ||
          parseFloat(
            merchantProfile.merchantInfo30DayOrderInfo?.[0]?.completionRate30Day
          ) ||
          0;
        console.log(
          "📈 Completion rate (merchant):",
          completionRate,
          "from fields:",
          {
            completionRate: merchantProfile.completionRate,
            merchantInfo:
              merchantProfile.merchantInfo30DayOrderInfo?.[0]
                ?.completionRate30Day,
          }
        );
      } else if (basicProfile) {
        completionRate = parseFloat(basicProfile.completionRate) * 100 || 0;
        console.log("📈 Completion rate (basic):", completionRate);
      }

      // Extract completed orders properly
      let completedOrders = 0;
      if (merchantProfile) {
        completedOrders =
          parseInt(merchantProfile.completedOrders) ||
          parseInt(merchantProfile.completedBuyOrders) ||
          parseInt(merchantProfile.totalTradingCount) ||
          0;
        console.log(
          "📦 Completed orders (merchant):",
          completedOrders,
          "from fields:",
          {
            completedOrders: merchantProfile.completedOrders,
            completedBuyOrders: merchantProfile.completedBuyOrders,
            totalTradingCount: merchantProfile.totalTradingCount,
          }
        );
      } else if (basicProfile) {
        completedOrders = parseInt(basicProfile.completedOrders) || 0;
        console.log("📦 Completed orders (basic):", completedOrders);
      }

      // Extract total order amount / trading volume
      const totalOrderAmount =
        merchantProfile?.totalOrderAmount ||
        merchantProfile?.commonOrderTotal ||
        merchantProfile?.tradingVolume ||
        profileData.totalOrderAmount ||
        "0";
      console.log("💰 Total order amount:", totalOrderAmount, "from fields:", {
        totalOrderAmount: merchantProfile?.totalOrderAmount,
        commonOrderTotal: merchantProfile?.commonOrderTotal,
        tradingVolume: merchantProfile?.tradingVolume,
      });

      // Extract positive rate
      const positiveRate =
        merchantProfile?.positiveRate ||
        merchantProfile?.positiveReviewPercentage ||
        merchantProfile?.merchantScore ||
        profileData.positiveRate ||
        "0";
      console.log("⭐ Positive rate:", positiveRate, "from fields:", {
        positiveRate: merchantProfile?.positiveRate,
        positiveReviewPercentage: merchantProfile?.positiveReviewPercentage,
        merchantScore: merchantProfile?.merchantScore,
      });

      const profile: TraderProfile = {
        id: user?.id || "mock-trader-1",
        full_name:
          profileData.nickName || getUserDisplayName(user as any) || "Trader",
        exchange_provider: "okx",
        exchange_user_id: profileData.merchantId || profileData.userId || "",
        kyc_level: profileData.isKycVerified
          ? 2
          : parseInt(profileData.kycLevel) || 0,
        completion_rate: completionRate,
        completed_orders: completedOrders,
        is_verified_trader:
          profileData.isKycVerified || profileData.kycLevel === "2",
        trader_info: {
          ...profileData,
          exchange: "okx",
          dataSource: merchantProfile ? "merchant_profile" : "basic_profile",
          isMerchant: !!merchantProfile,
          merchantLevel:
            merchantProfile?.auditStatus === "1" ? "verified" : "unverified",
          // Use the calculated values for display
          completion_rate: String(completionRate),
          completed_orders: String(completedOrders),
          totalOrderAmount: totalOrderAmount,
          positiveRate: positiveRate,
          tradingVolume: totalOrderAmount,
          // Add additional fields for better data display
          avgReleaseTime: merchantProfile?.avgReleaseTime || "0",
          avgPayTime: merchantProfile?.avgPayTime || "0",
          totalTradingCount:
            merchantProfile?.totalTradingCount ||
            merchantProfile?.totalOrders ||
            "0",
          merchantScore: merchantProfile?.merchantScore || positiveRate,
          safetyLevel: profileData.isKycVerified ? "high" : "medium",
        },
        created_at: user?.created_at || new Date().toISOString(),
      };

      profile.user_role = determineUserRole(profile);
      return profile;
    }

    // Generate mock profile for development
    if (isMockMode() && user) {
      const mockProfile: TraderProfile = {
        id: user.id || "mock-trader-1",
        full_name: (user as any)?.full_name || "John Trader",
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
          exchange: "okx",
          dataSource: "mock",
        },
        created_at: user.created_at || new Date().toISOString(),
      };

      mockProfile.user_role = determineUserRole(mockProfile);
      return mockProfile;
    }

    return null;
  };

  const profile = convertToTraderProfile();

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

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setPreferences((prev) => ({
          ...prev,
          ...data,
          notification_settings:
            data.notification_settings || prev.notification_settings,
          risk_management: data.risk_management || prev.risk_management,
        }));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  }, [user?.id]);

  // Save user preferences
  const savePreferences = async () => {
    if (!user?.id) return;

    setPreferencesLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (!error) {
        // Mark profile as complete
        await supabase
          .from("users")
          .update({ profile_complete: true })
          .eq("id", user.id);

        // Show success message
        console.log("✅ Preferences saved successfully");
      } else {
        console.error("❌ Error saving preferences:", error);
      }
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Load preferences when component mounts
  useEffect(() => {
    if (isClient && user?.id) {
      loadPreferences();
    }
  }, [isClient, user?.id, loadPreferences]);

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
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
  if (!profile && !exchangeData.isLoading) {
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

        {/* Data Refresh Control */}
        <DataRefreshControl
          isRefreshing={exchangeData.isRefreshing}
          lastRefresh={exchangeData.lastRefresh}
          onRefresh={exchangeData.refreshData}
          onRefreshDataType={exchangeData.refreshDataType}
          onClearCache={exchangeData.clearCacheAndReload}
          getDataStatus={exchangeData.getDataStatus}
          errors={exchangeData.errors}
        />

        {/* Profile Header */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
                  />
                  <AvatarFallback>
                    {profile.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile.full_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {getExchangeIcon(profile.exchange_provider)}{" "}
                      {profile.exchange_provider?.toUpperCase()} Trader
                    </span>
                    {getKYCBadge(profile.kyc_level)}
                    {profile.is_verified_trader && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ID: {profile.exchange_user_id || "N/A"}
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
                  View on {profile.exchange_provider?.toUpperCase()}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs
          defaultValue={
            user && !profile?.profile_complete ? "preferences" : "overview"
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
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
              value="preferences"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Preferences
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
            {/* Data Source Information */}
            {profile.trader_info?.exchange && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 border-blue-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          Exchange Data Integration
                        </p>
                        <p className="text-sm text-blue-700">
                          Data source:{" "}
                          {profile.trader_info.dataSource === "merchant_profile"
                            ? "Merchant Profile API"
                            : "Basic Profile API"}
                          {profile.trader_info.isMerchant && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Merchant Account
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-900">
                        {profile.exchange_provider?.toUpperCase()} Connected
                      </div>
                      <div className="text-xs text-blue-600">
                        Last updated:{" "}
                        {exchangeData.lastRefresh
                          ? formatDistanceToNow(
                              new Date(exchangeData.lastRefresh),
                              { addSuffix: true }
                            )
                          : "Never"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completion Rate
                      </p>
                      <p
                        className={`text-2xl font-bold ${getCompletionRateColor(
                          profile.completion_rate / 100
                        )}`}
                      >
                        {profile.completion_rate.toFixed(1)}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
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
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {profile.completed_orders.toLocaleString()}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Trading Volume
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        $
                        {parseFloat(
                          profile.trader_info?.totalOrderAmount || "0"
                        ).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Positive Rate
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {parseFloat(
                          profile.trader_info?.positiveRate || "0"
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Balance Info */}
            {exchangeData.balance?.data && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Account Balance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(exchangeData.balance.data).map(
                      ([currency, balance]: [string, any]) => (
                        <div
                          key={currency}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">
                              {currency}
                            </span>
                            <Badge variant="outline">
                              {balance?.currencySymbol || currency}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Available:</span>
                              <span className="font-medium">
                                {balance?.available || "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">On Hold:</span>
                              <span className="font-medium">
                                {balance?.onHoldAmount || "0.00"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>Performance Metrics</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Track your trading performance over time
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Metrics Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Detailed performance metrics will be available once more
                    data is collected.
                  </p>
                </div>
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
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Team Management
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage your trading teams and members
                        </p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700">
                        {profile.user_role.accountType} Account
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <EnhancedTeamManagement />
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Team Member - Team Information Interface
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    My Teams
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Teams Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You're not currently a member of any trading teams.
                    </p>
                    <Button variant="outline">Browse Available Teams</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle>Trading Preferences</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure your trading settings and complete your
                        profile
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={savePreferences}
                    disabled={preferencesLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {preferencesLoading ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Trading Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Trading Settings
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="preferred-currencies">
                        Preferred Currencies
                      </Label>
                      <Select
                        value={preferences.preferred_currencies[0]}
                        onValueChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            preferred_currencies: [
                              value,
                              ...prev.preferred_currencies.slice(1),
                            ],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="profile-visibility">
                        Profile Visibility
                      </Label>
                      <Select
                        value={preferences.profile_visibility}
                        onValueChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            profile_visibility: value as
                              | "public"
                              | "private"
                              | "team_only",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="team_only">Team Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="min-order">
                        Minimum Order Amount ($)
                      </Label>
                      <Input
                        id="min-order"
                        type="number"
                        value={preferences.min_order_amount}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            min_order_amount: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-order">
                        Maximum Order Amount ($)
                      </Label>
                      <Input
                        id="max-order"
                        type="number"
                        value={preferences.max_order_amount}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            max_order_amount: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Trading Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Trading Hours
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={preferences.trading_hours_start}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            trading_hours_start: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={preferences.trading_hours_end}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            trading_hours_end: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Security & Verification */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Security & Verification
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-accept Orders</Label>
                        <p className="text-sm text-gray-600">
                          Automatically accept orders that meet your criteria
                        </p>
                      </div>
                      <Switch
                        checked={preferences.auto_accept_orders}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            auto_accept_orders: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require KYC Verification</Label>
                        <p className="text-sm text-gray-600">
                          Only trade with KYC-verified users
                        </p>
                      </div>
                      <Switch
                        checked={preferences.require_kyc_verification}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            require_kyc_verification: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Risk Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Risk Management
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="max-daily-volume">
                        Max Daily Volume ($)
                      </Label>
                      <Input
                        id="max-daily-volume"
                        type="number"
                        value={preferences.risk_management.max_daily_volume}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              max_daily_volume: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-orders-per-day">
                        Max Orders Per Day
                      </Label>
                      <Input
                        id="max-orders-per-day"
                        type="number"
                        value={preferences.risk_management.max_orders_per_day}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              max_orders_per_day: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Stop Loss</Label>
                        <p className="text-sm text-gray-600">
                          Automatically stop trading when losses exceed
                          threshold
                        </p>
                      </div>
                      <Switch
                        checked={preferences.risk_management.enable_stop_loss}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              enable_stop_loss: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Settings
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(preferences.notification_settings).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <Label className="capitalize">
                              {key.replace(/_/g, " ")}
                            </Label>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setPreferences((prev) => ({
                                ...prev,
                                notification_settings: {
                                  ...prev.notification_settings,
                                  [key]: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Profile Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Profile Bio
                  </h3>
                  <div>
                    <Label htmlFor="bio">
                      Tell other traders about yourself
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Describe your trading experience, preferences, and what makes you a reliable trading partner..."
                      value={preferences.bio}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Completing your preferences will finish the onboarding
                      process and unlock all features.
                    </p>
                    <Button
                      onClick={savePreferences}
                      disabled={preferencesLoading}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {preferencesLoading
                        ? "Saving..."
                        : "Complete Profile Setup"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>Trading History</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      View your complete trading activity
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    History Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Detailed trading history will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
