"use client";

import { DataRefreshControl } from "@/components/data-refresh-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useAuth } from "@/hooks/use-auth";
import type { Ad, CreateAdFormData } from "@/lib/ads/ad-management-types";
import {
  OKX_SASAPAY_COMPATIBILITY,
  convertOKXAdsToAds,
  getRecommendedSasaPayMethod,
  getSasaPayCompatibility,
  type OKXPaymentCompatibility,
} from "@/lib/ads/okx-ad-compatibility";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CreateAdDialog = dynamic(
  () =>
    import("@/components/ad-management-enhanced/create-ad-dialog").then((mod) => ({
      default: mod.CreateAdDialog,
    })),
  { ssr: false },
);
const EditAdDialog = dynamic(
  () =>
    import("@/components/ad-management-enhanced/edit-ad-dialog").then((mod) => ({
      default: mod.EditAdDialog,
    })),
  { ssr: false },
);
const ViewAdDialog = dynamic(
  () =>
    import("@/components/ad-management-enhanced/view-ad-dialog").then((mod) => ({
      default: mod.ViewAdDialog,
    })),
  { ssr: false },
);

export function AdManagement() {
  const [isClient, setIsClient] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Form data for creating/editing ads
  const [createFormData, setCreateFormData] = useState<CreateAdFormData>({
    side: "sell",
    cryptoCurrency: "USDT",
    fiatCurrency: "KES",
    cryptoAmount: "",
    minOrderLimit: "",
    maxOrderLimit: "",
    unitPrice: "",
    priceMargin: "",
    type: "limit",
    paymentMethods: [],
    targetGroup: "all",
    minKycLevel: "0",
    minCompletedOrders: "0",
    minCompletionRate: "90",
    remark: "",
    automatedMessage: "",
  });

  // Available payment methods and currencies
  const availablePaymentMethods = [
    "MPESA",
    "BANK",
    "AIRTEL_MONEY",
    "SWIFT",
    "PAY_NOW",
  ];

  const availableCryptoCurrencies = ["USDT", "BTC", "ETH"];
  const availableFiatCurrencies = ["KES", "USD", "EUR", "GBP"];

  // Use environment-appropriate auth
  const supabaseAuth = useAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = isMockMode() ? mockAuth : supabaseAuth;

  // Add debugging effect to track auth state
  useEffect(() => {
    const debugData = {
      isMockMode: isMockMode(),
      user: user ? { id: user.id, email: user.email } : null,
      isAuthenticated,
      isLoading: authLoading,
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(debugData);
    console.log("🔍 Auth Debug Info:", debugData);
  }, [user, isAuthenticated, authLoading]);

  // Use the new exchange data hook (fetch ads, balances and payment methods)
  const exchangeData = useExchangeData(user?.id || null, "okx", {
    autoRefresh: true,
    refreshInterval: 5, // 5 minutes for ads (more frequent)
    includeTypes: ["balance", "payment_methods", "ads"],
    onRefreshStart: () => console.log("🔄 Ad management data refresh started"),
    onRefreshComplete: () =>
      console.log("✅ Ad management data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Ad management data refresh failed:", error),
  });

  useEffect(() => {
    setIsClient(true);
    // Do not trigger server-side data refresh from the client UI on mount.
    // The page intentionally avoids making API calls; data will be
    // populated by higher-level flows or manual actions elsewhere.
  }, [isAuthenticated, user?.id]);

  // Update ads when live data is available
  useEffect(() => {
    console.log("🔍 Ad Management Data Check:", {
      isClient,
      isAuthenticated,
      userId: user?.id,
      hasAdsData: !!exchangeData.ads?.data,
      adsDataStructure: exchangeData.ads,
      adsDataContent: exchangeData.ads?.data,
      adsDataType: typeof exchangeData.ads?.data,
      adsDataLength: Array.isArray(exchangeData.ads?.data?.ads)
        ? exchangeData.ads.data.ads.length
        : "not array",
      rawAdsData: exchangeData.ads?.data?.ads || exchangeData.ads?.data,
      isLoading: exchangeData.isLoading,
      errors: exchangeData.ads?.error,
      lastRefresh: exchangeData.lastRefresh,
      isRefreshing: exchangeData.isRefreshing,
    });

    if (isClient && isAuthenticated && exchangeData.ads?.data) {
      try {
        console.log("📦 Raw OKX ads data:", exchangeData.ads.data);
        console.log("📋 Data type:", typeof exchangeData.ads.data);
        console.log("📋 Data keys:", Object.keys(exchangeData.ads.data || {}));
        console.log("📋 Is array?", Array.isArray(exchangeData.ads.data));

        // Try different possible data structures
        let adsArray = null;
        if (
          exchangeData.ads.data.ads &&
          Array.isArray(exchangeData.ads.data.ads)
        ) {
          adsArray = exchangeData.ads.data.ads;
          console.log("📊 Found ads in data.ads:", adsArray.length);
        } else if (
          exchangeData.ads.data.data &&
          Array.isArray(exchangeData.ads.data.data)
        ) {
          adsArray = exchangeData.ads.data.data;
          console.log("📊 Found ads in data.data:", adsArray.length);
        } else if (Array.isArray(exchangeData.ads.data)) {
          adsArray = exchangeData.ads.data;
          console.log("📊 Found ads in root data:", adsArray.length);
        } else {
          console.warn("⚠️ No valid ads array found in data structure");
          console.log(
            "📋 Data structure keys:",
            Object.keys(exchangeData.ads.data || {})
          );
          console.log(
            "📋 Full data structure:",
            JSON.stringify(exchangeData.ads.data, null, 2)
          );
        }

        if (adsArray && adsArray.length > 0) {
          console.log(
            "🔄 Converting",
            adsArray.length,
            "OKX ads to component format"
          );
          const liveAds = convertOKXAdsToAds(adsArray);
          setAds(liveAds);
          console.log("✅ Live ads data loaded:", liveAds.length, "ads");
          console.log("📊 Converted ads:", liveAds);
        } else {
          console.warn(
            "⚠️ No ads found in OKX data. This is normal if you haven't created any P2P ads yet."
          );
          console.log("📦 Raw data that had no ads:", exchangeData.ads.data);

          // Show a message instead of generating mock data
          setAds([]);
          console.log(
            "📋 Set ads to empty array - user needs to create first ad"
          );
        }
      } catch (error) {
        console.error("❌ Failed to convert ads data:", error);
        console.error("📦 Raw data that failed:", exchangeData.ads.data);
        if (isMockMode()) {
          void generateMockAds();
        } else {
          setAds([]);
        }
      }
    } else if (isClient && isAuthenticated && !exchangeData.isLoading) {
      console.log("📋 No live ads data available, using mock data. Reason:", {
        hasAdsData: !!exchangeData.ads?.data,
        adsError: exchangeData.ads?.error,
        isLoading: exchangeData.isLoading,
        lastRefresh: exchangeData.lastRefresh,
      });
      if (isMockMode()) {
        void generateMockAds();
      } else {
        setAds([]);
      }
    }
  }, [
    isClient,
    isAuthenticated,
    exchangeData.ads?.data,
    exchangeData.isLoading,
    exchangeData.lastRefresh,
  ]);

  const testOKXConnection = async () => {
    try {
      console.log("🧪 Testing OKX connection...");
      // Trigger a refresh for ads/payment methods/balances and report status
      await exchangeData.refreshDataType?.("ads");
      await exchangeData.refreshDataType?.("payment_methods");
      await exchangeData.refreshDataType?.("balance");

      const hasAds =
        !!exchangeData.ads?.data &&
        (Array.isArray(exchangeData.ads.data?.ads)
          ? exchangeData.ads.data.ads.length > 0
          : Array.isArray(exchangeData.ads.data)
          ? exchangeData.ads.data.length > 0
          : false);

      const paymentMethodsAvailable = !!exchangeData.paymentMethods?.data;
      const balancesAvailable = !!exchangeData.balance?.data;

      alert(
        `OKX Status:\n• Ads: ${
          hasAds ? "Available" : "Not available"
        }\n• Payments: ${
          paymentMethodsAvailable ? "Available" : "Not available"
        }\n• Balances: ${balancesAvailable ? "Available" : "Not available"}`
      );
    } catch (error) {
      console.error("🚨 OKX Test Error:", error);
      alert(
        `🚨 OKX Connection Test Failed\n\nNetwork or server error occurred.\n\nError: ${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nPlease check your internet connection and try again.`
      );
    }
  };

  // Create a new ad
  const handleCreateAd = async () => {
    setIsLoading(true);
    try {
      // Send create request to server route
      const response = await fetch("/api/okx/ads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ Ad created successfully:", result);
        // Refresh ads data to show the new ad
        exchangeData.refreshDataType?.("ads");
        setIsCreateDialogOpen(false);
        // Reset form data
        setCreateFormData({
          side: "sell",
          cryptoCurrency: "USDT",
          fiatCurrency: "KES",
          cryptoAmount: "",
          minOrderLimit: "",
          maxOrderLimit: "",
          unitPrice: "",
          priceMargin: "",
          type: "limit",
          paymentMethods: [],
          targetGroup: "all",
          minKycLevel: "0",
          minCompletedOrders: "0",
          minCompletionRate: "90",
          remark: "",
          automatedMessage: "",
        });
        alert(`✅ Ad created successfully! Ad ID: ${result.data?.adId}`);
      } else {
        console.error("❌ Failed to create ad:", result);
        const userMessage =
          result?.error || result?.details || "Failed to create ad";
        alert(userMessage);
      }
    } catch (error) {
      console.error("🚨 Error creating ad:", error);
      alert(
        `🚨 Network Error\n\nFailed to communicate with the server. Please check your internet connection and try again.\n\nError: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete/cancel an ad
  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to cancel this ad?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/okx/ads/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ Ad cancelled successfully:", result);
        exchangeData.refreshDataType?.("ads");
        alert("Ad cancelled successfully!");
      } else {
        console.error("❌ Failed to cancel ad:", result.error || result);
        alert(`Failed to cancel ad: ${result.error || result}`);
      }
    } catch (error) {
      console.error("🚨 Error cancelling ad:", error);
      alert(
        `Error cancelling ad: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle ad status (show/hide)
  const handleToggleAdStatus = async (adId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "hidden" : "show";
    setIsLoading(true);

    try {
      const response = await fetch(`/api/okx/ads/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, status: newStatus }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ Ad status updated successfully:", result);
        exchangeData.refreshDataType?.("ads");
        alert(
          `Ad ${newStatus === "hidden" ? "hidden" : "activated"} successfully!`
        );
      } else {
        console.error("❌ Failed to update ad status:", result.error || result);
        alert(`Failed to update ad status: ${result.error || result}`);
      }
    } catch (error) {
      console.error("🚨 Error updating ad status:", error);
      alert(
        `Error updating ad status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // View ad details
  const handleViewAd = async (adId: string) => {
    try {
      const response = await fetch(`/api/okx/ads/details?adId=${adId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedAd(result.data);
        setIsViewDialogOpen(true);
      } else {
        console.error("❌ Failed to fetch ad details:", result.error || result);
        alert(`Failed to fetch ad details: ${result.error || result}`);
      }
    } catch (error) {
      console.error("🚨 Error fetching ad details:", error);
      alert(
        `Error fetching ad details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const generateMockAds = async () => {
    const { buildEnhancedMockAds } = await import("@/lib/mock-data/ad-management-enhanced");
    setAds(buildEnhancedMockAds() as Ad[]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      active: "default",
      paused: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  // Show loading state
  if (!isClient || authLoading || exchangeData.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user is authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please sign in to manage your ads.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = ads.reduce(
    (sum, ad) => sum + ad.cryptoAmount * ad.unitPrice,
    0
  );
  const activeAds = ads.filter((ad) => ad.status === "active").length;
  const avgCompletionRate =
    ads.length > 0
      ? ads.reduce((sum, ad) => sum + ad.completionRate, 0) / ads.length
      : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your P2P trading advertisements
          </p>
          {/* Live Data Status Indicators */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  exchangeData.ads?.data ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-gray-600">
                Ads: {exchangeData.ads?.data ? "Live Data" : "Mock Data"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  exchangeData.balance?.data ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-gray-600">
                Balance: {exchangeData.balance?.data ? "Live" : "Mock"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  exchangeData.paymentMethods?.data
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-gray-600">
                Payments: {exchangeData.paymentMethods?.data ? "Live" : "Mock"}
              </span>
            </div>
            {exchangeData.lastRefresh && (
              <span className="text-xs text-gray-500">
                Last update:{" "}
                {new Date(exchangeData.lastRefresh).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testOKXConnection}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Test API Permissions
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log("🔄 Manual refresh triggered");
              exchangeData.refreshData?.();
            }}
            disabled={exchangeData.isRefreshing}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {exchangeData.isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Ad
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

      {/* API Status & Permissions removed */}

      {/* Debug info removed */}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.length}</div>
            <p className="text-xs text-muted-foreground">{activeAds} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all currencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCompletionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Average across ads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exchangeData.balance?.data
                ? Object.keys(exchangeData.balance.data).length
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currencies available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Information */}
      {exchangeData.balance?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Account Balances
            </CardTitle>
            <CardDescription>
              Available balances for creating ads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(exchangeData.balance.data).map(
                ([currency, balance]: [string, any]) => (
                  <div key={currency} className="p-4 bg-gray-50 rounded-lg">
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
                          {balance?.available ||
                            balance?.availableAmount ||
                            "0.00"}
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

      {/* SasaPay integration UI removed */}

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Advertisements</CardTitle>
          <CardDescription>Manage your active P2P trading ads</CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {exchangeData.ads?.data
                  ? "No Active Ads Found"
                  : "No ads created yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {exchangeData.ads?.data
                  ? "Your OKX account doesn't have any active P2P advertisements. Create your first ad to start trading."
                  : "Start by creating your first P2P trading advertisement."}
              </p>
              {exchangeData.ads?.data && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <h4 className="font-medium text-blue-900 mb-1">
                        ✅ API Connection Successful
                      </h4>
                      <p className="text-blue-700 mb-2">
                        Your OKX API is working correctly, but no ads were
                        found. This means:
                      </p>
                      <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                        <li>API credentials are valid and working</li>
                        <li>No P2P ads exist on your account yet</li>
                        <li>You can now create your first advertisement</li>
                        <li>All features are ready to use</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Ad
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div key={ad.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getStatusIcon(ad.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {ad.type.toUpperCase()} {ad.cryptoCurrency}
                          </h3>
                          {getStatusBadge(ad.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {ad.fiatCurrency} {ad.unitPrice.toLocaleString()} per{" "}
                          {ad.cryptoCurrency}
                        </p>
                        {/* SasaPay Compatibility Info */}
                        {ad.okx_integration && (
                          <div className="flex items-center gap-2 mt-1">
                            {ad.okx_integration.sasapay_compatible ? (
                              <>
                                <Badge
                                  variant="default"
                                  className="text-xs bg-green-100 text-green-800"
                                >
                                  SasaPay Compatible
                                </Badge>
                                {ad.okx_integration.auto_payment_routing && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Auto-Route
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Manual Payment
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ad.paymentMethods
                            .slice(0, 3)
                            .map((method, index) => {
                              const compatibility =
                                OKX_SASAPAY_COMPATIBILITY.find(
                                  (comp) => comp.okx_type === method
                                );
                              return (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className={`text-xs ${
                                    compatibility?.auto_selectable
                                      ? "border-green-300 text-green-700"
                                      : "border-gray-300 text-gray-600"
                                  }`}
                                >
                                  {method}
                                  {compatibility?.auto_selectable && (
                                    <CheckCircle2 className="h-3 w-3 ml-1" />
                                  )}
                                </Badge>
                              );
                            })}
                          {ad.paymentMethods.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{ad.paymentMethods.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {ad.availableAmount.toLocaleString()} /{" "}
                          {ad.cryptoAmount.toLocaleString()} {ad.cryptoCurrency}
                        </p>
                        <p className="text-sm text-gray-600">
                          {ad.completionRate}% completion rate
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewAd(ad.okx_integration?.adId || ad.id)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAd(ad);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleAdStatus(
                                ad.okx_integration?.adId || ad.id,
                                ad.status
                              )
                            }
                          >
                            {ad.status === "active" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Show
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteAd(ad.okx_integration?.adId || ad.id)
                            }
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Order Range</p>
                      <p className="text-sm font-medium">
                        {ad.minOrderLimit.toLocaleString()} -{" "}
                        {ad.maxOrderLimit.toLocaleString()} {ad.fiatCurrency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Methods</p>
                      <p className="text-sm font-medium">
                        {ad.paymentMethods.join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium">
                        {formatDistanceToNow(new Date(ad.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAdDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        isLoading={isLoading}
        createFormData={createFormData}
        setCreateFormData={setCreateFormData}
        availablePaymentMethods={availablePaymentMethods}
        availableCryptoCurrencies={availableCryptoCurrencies}
        availableFiatCurrencies={availableFiatCurrencies}
        onCreateAd={handleCreateAd}
      />

      <EditAdDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedAd={selectedAd}
      />

      <ViewAdDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        selectedAd={selectedAd}
      />
    </div>
  );
}


