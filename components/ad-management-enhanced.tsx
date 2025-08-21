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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// Mock ad data structure
interface Ad {
  id: string;
  type: "buy" | "sell";
  cryptoCurrency: string;
  fiatCurrency: string;
  unitPrice: number;
  totalAmount: number;
  availableAmount: number;
  minOrderSize: number;
  maxOrderSize: number;
  status: "active" | "paused" | "completed" | "cancelled";
  paymentMethods: string[];
  completionRate: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export function AdManagement() {
  const [isClient, setIsClient] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    autoRefresh: true,
    refreshInterval: 5, // 5 minutes for ads (more frequent)
    includeTypes: ["balance", "payment_methods"],
    onRefreshStart: () => console.log("🔄 Ad management data refresh started"),
    onRefreshComplete: () =>
      console.log("✅ Ad management data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Ad management data refresh failed:", error),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate mock ads when component loads
  useEffect(() => {
    if (isClient && isAuthenticated) {
      generateMockAds();
    }
  }, [isClient, isAuthenticated]);

  const generateMockAds = () => {
    const mockAds: Ad[] = [
      {
        id: "1",
        type: "buy",
        cryptoCurrency: "USDT",
        fiatCurrency: "KES",
        unitPrice: 129.5,
        totalAmount: 10000,
        availableAmount: 7500,
        minOrderSize: 1000,
        maxOrderSize: 5000,
        status: "active",
        paymentMethods: ["M-Pesa", "Bank Transfer"],
        completionRate: 98.5,
        totalOrders: 234,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        type: "sell",
        cryptoCurrency: "USDT",
        fiatCurrency: "KES",
        unitPrice: 131.2,
        totalAmount: 15000,
        availableAmount: 12000,
        minOrderSize: 500,
        maxOrderSize: 3000,
        status: "active",
        paymentMethods: ["M-Pesa"],
        completionRate: 96.8,
        totalOrders: 189,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "3",
        type: "buy",
        cryptoCurrency: "BTC",
        fiatCurrency: "KES",
        unitPrice: 6450000,
        totalAmount: 1,
        availableAmount: 0.5,
        minOrderSize: 0.001,
        maxOrderSize: 0.1,
        status: "paused",
        paymentMethods: ["Bank Transfer"],
        completionRate: 94.2,
        totalOrders: 67,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    setAds(mockAds);
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

  const handleToggleAdStatus = (adId: string) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === adId
          ? { ...ad, status: ad.status === "active" ? "paused" : "active" }
          : ad
      )
    );
  };

  const handleDeleteAd = (adId: string) => {
    setAds((prev) => prev.filter((ad) => ad.id !== adId));
  };

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
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

  const totalValue = ads.reduce((sum, ad) => sum + ad.totalAmount, 0);
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
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Ad
        </Button>
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
                No ads created yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by creating your first P2P trading advertisement.
              </p>
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
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {ad.availableAmount.toLocaleString()} /{" "}
                          {ad.totalAmount.toLocaleString()} {ad.cryptoCurrency}
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
                            onClick={() => {
                              setSelectedAd(ad);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleAdStatus(ad.id)}
                          >
                            {ad.status === "active" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteAd(ad.id)}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Order Range</p>
                      <p className="text-sm font-medium">
                        {ad.minOrderSize.toLocaleString()} -{" "}
                        {ad.maxOrderSize.toLocaleString()} {ad.fiatCurrency}
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

      {/* Create Ad Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Ad</DialogTitle>
            <DialogDescription>
              Create a new P2P trading advertisement
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-600">
              Ad creation functionality will be integrated with the enhanced
              data management system.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ad Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
            <DialogDescription>
              Modify your existing advertisement
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedAd && (
              <p className="text-sm text-gray-600">
                Editing ad: {selectedAd.type.toUpperCase()}{" "}
                {selectedAd.cryptoCurrency}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
