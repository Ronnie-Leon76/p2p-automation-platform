"use client";

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
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useAuth } from "@/hooks/use-auth";
import type { Ad, CreateAdFormData } from "@/lib/ads/ad-management-types";
import {
  OKX_SASAPAY_COMPATIBILITY,
  convertOKXAdsToAds,
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
import { useEffect, useMemo, useState } from "react";

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
  const [adTab, setAdTab] = useState<"active" | "inactive">("active");
  const [adView, setAdView] = useState<"table" | "cards">("table");
  const [optimalPrice, setOptimalPrice] = useState<{
    currentHighestBuyAdPrice: string;
    currentLowestSellAdPrice: string;
  } | null>(null);

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
    autoRefresh: false,
    refreshInterval: 15,
    includeTypes: ["balance", "payment_methods", "ads"],
    onRefreshStart: () => undefined,
    onRefreshComplete: () => undefined,
    onRefreshError: (error) => console.error("Ad management refresh failed:", error),
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
          const liveAds = convertOKXAdsToAds(adsArray, {
            source: exchangeData.ads?.source,
            isStale: exchangeData.ads?.is_stale,
          });
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

  const fetchOptimalPrice = async (cryptoCurrency: string, fiatCurrency: string) => {
    try {
      const response = await fetch(
        `/api/okx/ads/optimal-price?cryptoCurrency=${encodeURIComponent(
          cryptoCurrency,
        )}&fiatCurrency=${encodeURIComponent(fiatCurrency)}`,
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setOptimalPrice(result.data);
      } else {
        setOptimalPrice(null);
      }
    } catch {
      setOptimalPrice(null);
    }
  };

  const handleUpdateAd = async (data: CreateAdFormData) => {
    const adId = selectedAd?.okx_integration?.adId || selectedAd?.id;
    if (!adId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/okx/ads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId,
          side: data.side,
          cryptoCurrency: data.cryptoCurrency,
          fiatCurrency: data.fiatCurrency,
          type: data.type,
          unitPrice: data.unitPrice,
          priceMargin: data.priceMargin,
          cryptoAmount: data.cryptoAmount,
          minOrderLimit: data.minOrderLimit,
          maxOrderLimit: data.maxOrderLimit,
          paymentMethods: data.paymentMethods,
          targetGroup: data.targetGroup,
          minKycLevel: data.minKycLevel,
          minCompletedOrders: data.minCompletedOrders,
          minCompletionRate: data.minCompletionRate,
          remark: data.remark,
          automatedMessage: data.automatedMessage,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        exchangeData.refreshDataType?.("ads");
        setIsEditDialogOpen(false);
        alert("Ad updated successfully.");
      } else {
        alert(result?.error || "Failed to update ad.");
      }
    } catch (error) {
      alert(
        `Error updating ad: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchOptimalPrice(createFormData.cryptoCurrency, createFormData.fiatCurrency);
  }, [isAuthenticated, createFormData.cryptoCurrency, createFormData.fiatCurrency]);

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

  const isFiniteNumber = (value: number) => Number.isFinite(value);
  const formatNumberOrDash = (value: number, decimals = 2) =>
    isFiniteNumber(value) ? value.toLocaleString(undefined, { maximumFractionDigits: decimals }) : "--";
  const formatDateOrDash = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? formatDistanceToNow(date, { addSuffix: true })
      : "--";
  };

  const activeAdsList = useMemo(
    () => ads.filter((ad) => ad.status === "active"),
    [ads],
  );
  const inactiveAdsList = useMemo(
    () => ads.filter((ad) => ad.status !== "active"),
    [ads],
  );
  const filteredAds = adTab === "active" ? activeAdsList : inactiveAdsList;
  const validAds = useMemo(
    () =>
      ads.filter(
        (ad) =>
          ad.dataQuality !== "incomplete" &&
          isFiniteNumber(ad.unitPrice) &&
          isFiniteNumber(ad.cryptoAmount) &&
          isFiniteNumber(ad.availableAmount),
      ),
    [ads],
  );

  const totalValue = validAds.reduce((sum, ad) => sum + ad.cryptoAmount * ad.unitPrice, 0);
  const activeAds = activeAdsList.length;
  const avgCompletionRate =
    validAds.length > 0
      ? validAds
          .filter((ad) => isFiniteNumber(ad.completionRate))
          .reduce((sum, ad) => sum + ad.completionRate, 0) / validAds.length
      : 0;
  const incompleteCount = ads.filter((ad) => ad.dataQuality === "incomplete").length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your P2P trading advertisements
          </p>
          {optimalPrice && (
            <p className="text-xs text-gray-500 mt-1">
              Optimal price: Buy {optimalPrice.currentHighestBuyAdPrice} / Sell{" "}
              {optimalPrice.currentLowestSellAdPrice}
            </p>
          )}
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
            <Badge variant="outline" className="text-xs">
              Source: {exchangeData.ads?.source || "unknown"}
            </Badge>
            <Badge
              variant={exchangeData.ads?.is_stale ? "secondary" : "outline"}
              className="text-xs"
            >
              {exchangeData.ads?.is_stale ? "Stale cache" : "Fresh cache"}
            </Badge>
            {incompleteCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {incompleteCount} incomplete ad{incompleteCount > 1 ? "s" : ""}
              </Badge>
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
            <p className="text-xs text-muted-foreground">
              {activeAds} active · {validAds.length} valid
            </p>
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
            <p className="text-xs text-muted-foreground">
              Average across valid ads
            </p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Your Advertisements</CardTitle>
              <CardDescription>Enterprise view for ad lifecycle and quality</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={adTab === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setAdTab("active")}
              >
                Active ({activeAdsList.length})
              </Button>
              <Button
                type="button"
                variant={adTab === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setAdTab("inactive")}
              >
                Inactive ({inactiveAdsList.length})
              </Button>
              <Button
                type="button"
                variant={adView === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setAdView("table")}
              >
                Table
              </Button>
              <Button
                type="button"
                variant={adView === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setAdView("cards")}
              >
                Cards
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAds.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {exchangeData.ads?.data
                  ? adTab === "active"
                    ? "No Active Ads Found"
                    : "No Inactive Ads Found"
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
            <>
              {adView === "table" ? (
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="px-3 py-2">Ad ID</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Price</th>
                        <th className="px-3 py-2">Remaining / Total</th>
                        <th className="px-3 py-2">Limits</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Quality</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAds.map((ad) => (
                        <tr key={ad.id} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">
                            {ad.okx_integration?.adId || ad.id}
                          </td>
                          <td className="px-3 py-2">
                            <span className={ad.type === "buy" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                              {ad.type.toUpperCase()} {ad.cryptoCurrency}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {formatNumberOrDash(ad.unitPrice)} {ad.fiatCurrency}
                          </td>
                          <td className="px-3 py-2">
                            {formatNumberOrDash(ad.availableAmount)} / {formatNumberOrDash(ad.cryptoAmount)} {ad.cryptoCurrency}
                          </td>
                          <td className="px-3 py-2">
                            {formatNumberOrDash(ad.minOrderLimit)} - {formatNumberOrDash(ad.maxOrderLimit)} {ad.fiatCurrency}
                          </td>
                          <td className="px-3 py-2">{getStatusBadge(ad.status)}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={ad.dataQuality === "complete" ? "outline" : "destructive"} className="text-xs">
                                {ad.dataQuality === "complete" ? "Complete" : "Incomplete"}
                              </Badge>
                              {ad.stale && (
                                <Badge variant="secondary" className="text-xs">Stale</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewAd(ad.okx_integration?.adId || ad.id)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedAd(ad);
                                  setIsEditDialogOpen(true);
                                }}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleAdStatus(ad.okx_integration?.adId || ad.id, ad.status)}
                                title={ad.status === "active" ? "Hide" : "Show"}
                              >
                                {ad.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAds.map((ad) => (
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
                              <Badge variant={ad.dataQuality === "complete" ? "outline" : "destructive"} className="text-xs">
                                {ad.dataQuality === "complete" ? "Complete" : "Incomplete"}
                              </Badge>
                              {ad.stale && <Badge variant="secondary" className="text-xs">Stale</Badge>}
                            </div>
                            <p className="text-sm text-gray-600">
                              {ad.fiatCurrency} {formatNumberOrDash(ad.unitPrice)} per {ad.cryptoCurrency}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ad.paymentMethods.slice(0, 3).map((method, index) => {
                                const compatibility = OKX_SASAPAY_COMPATIBILITY.find(
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
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">
                              {formatNumberOrDash(ad.availableAmount)} / {formatNumberOrDash(ad.cryptoAmount)} {ad.cryptoCurrency}
                            </p>
                            <p className="text-sm text-gray-600">
                              {isFiniteNumber(ad.completionRate) ? `${ad.completionRate}% completion rate` : "-- completion rate"}
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
                                onClick={() => handleViewAd(ad.okx_integration?.adId || ad.id)}
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
                                  handleToggleAdStatus(ad.okx_integration?.adId || ad.id, ad.status)
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
                                onClick={() => handleDeleteAd(ad.okx_integration?.adId || ad.id)}
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
                            {formatNumberOrDash(ad.minOrderLimit)} - {formatNumberOrDash(ad.maxOrderLimit)} {ad.fiatCurrency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Payment Methods</p>
                          <p className="text-sm font-medium">
                            {ad.paymentMethods.join(", ") || "--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm font-medium">{formatDateOrDash(ad.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
        isLoading={isLoading}
        availablePaymentMethods={availablePaymentMethods}
        availableCryptoCurrencies={availableCryptoCurrencies}
        availableFiatCurrencies={availableFiatCurrencies}
        onSave={handleUpdateAd}
      />

      <ViewAdDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        selectedAd={selectedAd}
      />
    </div>
  );
}



