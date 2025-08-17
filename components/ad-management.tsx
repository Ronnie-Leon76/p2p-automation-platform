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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMockAuth } from "@/hooks/use-mock-auth";
import { MockAdStorage, type Ad } from "@/lib/auth/mock-ad-storage";
import { MockTeamStorage, type Team } from "@/lib/auth/mock-team-storage";
import {
  formatKesAmount,
  getDailyUsageStatus,
  getSasaPayOrderLimits,
  SASAPAY_LIMITS,
  validateBuyAdConfiguration,
} from "@/lib/payments/sasapay-limits";
import {
  Activity,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Info,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Type definitions for the team-based P2P ad management system
 */

/**
 * Represents the current user's role in the system
 */
interface UserRole {
  type: "main_user" | "team_member";
  permissions: string[];
}

/**
 * Represents a P2P advertisement across multiple exchanges
 */
// Mock data
const mockTeams: Team[] = [
  {
    id: "team_001",
    name: "Primary Trading Team",
    description: "Main team handling all P2P operations across major exchanges",
    owner: {
      id: "user_001",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder-user.jpg",
      role: "owner",
      permissions: ["all"],
      joinedAt: "2024-01-01T00:00:00Z",
      isActive: true,
      lastActive: "2024-01-15T10:30:00Z",
    },
    members: [
      {
        id: "user_002",
        name: "Jane Smith",
        email: "jane@example.com",
        avatar: "/placeholder-user.jpg",
        role: "admin",
        permissions: ["manage_ads", "manage_orders", "view_analytics"],
        joinedAt: "2024-01-02T00:00:00Z",
        isActive: true,
        lastActive: "2024-01-15T09:45:00Z",
      },
      {
        id: "user_003",
        name: "Mike Johnson",
        email: "mike@example.com",
        avatar: "/placeholder-user.jpg",
        role: "manager",
        permissions: ["manage_orders", "dispute_resolution"],
        joinedAt: "2024-01-05T00:00:00Z",
        isActive: true,
        lastActive: "2024-01-15T08:20:00Z",
      },
    ],
    exchanges: {
      okx: { connected: true, accountId: "okx_main_001" },
      binance: { connected: true, accountId: "bnc_primary_001" },
      bybit: { connected: false },
    },
    createdAt: "2024-01-01T00:00:00Z",
    totalAds: 15,
    activeAds: 12,
    totalVolume: "2,450,000",
    isActive: true,
  },
];

const mockAds: Ad[] = [
  {
    id: "ad_001",
    exchange: "okx",
    side: "sell",
    cryptocurrency: "USDT",
    fiatCurrency: "KES",
    unitPrice: "150.00",
    availableAmount: "10,000.00",
    minOrderSize: "100",
    maxOrderSize: "5,000",
    status: "active",
    isHidden: false,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    completedOrders: 45,
    totalVolume: "675,000",
    successRate: 98.5,
    currentOrders: 3,
    teamId: "team_001",
    createdBy: "user_001",
    paymentMethods: ["SasaPay"],
    autoReply: true,
    priceMargin: 2.5,
    requirements: {
      minKycLevel: 2,
      minCompletionRate: 95,
      remarks: "Fast SasaPay transfers only, instant processing",
    },
  },
  {
    id: "ad_002",
    exchange: "binance",
    side: "buy",
    cryptocurrency: "USDT",
    fiatCurrency: "KES",
    unitPrice: "149.50",
    availableAmount: "15,000.00",
    minOrderSize: "200",
    maxOrderSize: "8,000",
    status: "active",
    isHidden: false,
    createdAt: "2024-01-14T15:45:00Z",
    updatedAt: "2024-01-15T08:20:00Z",
    completedOrders: 32,
    totalVolume: "480,000",
    successRate: 100,
    currentOrders: 2,
    teamId: "team_001",
    createdBy: "user_002",
    paymentMethods: ["SasaPay"],
    autoReply: true,
    priceMargin: 1.0,
    requirements: {
      minKycLevel: 1,
      minCompletionRate: 90,
      remarks: "SasaPay payments processed within 2 minutes",
    },
  },
  {
    id: "ad_003",
    exchange: "bybit",
    side: "sell",
    cryptocurrency: "USDT",
    fiatCurrency: "KES",
    unitPrice: "151.25",
    availableAmount: "5,000.00",
    minOrderSize: "500",
    maxOrderSize: "2,500",
    status: "paused",
    isHidden: true,
    createdAt: "2024-01-13T09:20:00Z",
    updatedAt: "2024-01-14T16:30:00Z",
    completedOrders: 18,
    totalVolume: "270,000",
    successRate: 94.4,
    currentOrders: 0,
    teamId: "team_001",
    createdBy: "user_003",
    paymentMethods: ["SasaPay"],
    autoReply: false,
    priceMargin: 3.0,
    requirements: {
      minKycLevel: 2,
      minCompletionRate: 95,
      remarks: "Manual verification required for large orders",
    },
  },
];

// Mock current user role - this would come from authentication context
const getCurrentUserRole = (): UserRole => {
  // This would be determined by actual authentication/authorization
  // For now, we'll simulate a team member
  return {
    type: "team_member", // or "main_user"
    permissions: ["view_ads", "manage_orders", "dispute_resolution"],
  };
};

// Team Join Dialog Component
function JoinTeamDialog({
  isOpen,
  onClose,
  availableTeams,
  onJoinTeam,
}: {
  isOpen: boolean;
  onClose: () => void;
  availableTeams: Team[];
  onJoinTeam: (teamId: string) => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const handleJoin = () => {
    if (selectedTeamId) {
      onJoinTeam(selectedTeamId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Join a Team
          </DialogTitle>
          <DialogDescription>
            Select a team to join and start managing P2P operations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="teamSelect">Available Teams</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team to join" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={team.owner.avatar} />
                        <AvatarFallback>
                          {team.owner.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-gray-500">
                          Owner: {team.owner.name}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTeamId && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              {availableTeams.find((t) => t.id === selectedTeamId) && (
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">
                    Team Information
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    {
                      availableTeams.find((t) => t.id === selectedTeamId)
                        ?.description
                    }
                  </p>
                  <div className="text-sm text-blue-700">
                    <p>
                      •{" "}
                      {availableTeams.find((t) => t.id === selectedTeamId)
                        ?.members.length || 0}{" "}
                      current members
                    </p>
                    <p>
                      •{" "}
                      {availableTeams.find((t) => t.id === selectedTeamId)
                        ?.activeAds || 0}{" "}
                      active ads
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!selectedTeamId}>
            <Users className="h-4 w-4 mr-2" />
            Join Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Ad Creation Dialog Component
function CreateAdDialog({
  isOpen,
  onClose,
  onCreateAd,
  selectedTeam,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateAd: (ad: Partial<Ad>) => void;
  selectedTeam: Team | null;
}) {
  const [adData, setAdData] = useState({
    exchange: "",
    side: "",
    cryptocurrency: "",
    fiatCurrency: "KES",
    unitPrice: "",
    availableAmount: "",
    minOrderSize: "",
    maxOrderSize: "",
    paymentMethods: ["SasaPay"] as string[],
    autoReply: true,
    priceMargin: "0",
    requirements: {
      minKycLevel: 1,
      minCompletionRate: 80,
      remarks: "",
    },
  });

  // SasaPay transaction limit validation
  const [dailyUsed] = useState(0); // This would come from actual daily usage tracking
  const sasaPayLimits = getSasaPayOrderLimits(dailyUsed);
  const usageStatus = getDailyUsageStatus(dailyUsed);

  // Validate buy ad configuration when SasaPay is selected and side is "buy"
  const buyAdValidation =
    adData.paymentMethods.includes("SasaPay") &&
    adData.side === "buy" &&
    adData.maxOrderSize
      ? validateBuyAdConfiguration(
          parseFloat(adData.maxOrderSize) || 0,
          parseFloat(adData.minOrderSize) || 0,
          dailyUsed
        )
      : null;

  const handleSubmit = () => {
    if (
      adData.exchange &&
      adData.side &&
      adData.cryptocurrency &&
      adData.fiatCurrency
    ) {
      onCreateAd({
        ...adData,
        exchange: adData.exchange as "okx" | "binance" | "bybit",
        side: adData.side as "buy" | "sell",
        teamId: selectedTeam?.id,
        status: "active" as const,
        isHidden: false,
        priceMargin: parseFloat(adData.priceMargin) || 0,
      });
      setAdData({
        exchange: "",
        side: "",
        cryptocurrency: "",
        fiatCurrency: "KES",
        unitPrice: "",
        availableAmount: "",
        minOrderSize: "",
        maxOrderSize: "",
        paymentMethods: ["SasaPay"],
        autoReply: true,
        priceMargin: "0",
        requirements: {
          minKycLevel: 1,
          minCompletionRate: 80,
          remarks: "",
        },
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Create New Ad
          </DialogTitle>
          <DialogDescription>
            Create a new P2P advertisement for{" "}
            {selectedTeam?.name || "your team"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exchange">Exchange</Label>
                <Select
                  value={adData.exchange}
                  onValueChange={(value) =>
                    setAdData({ ...adData, exchange: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="okx">OKX</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="side">Order Type</Label>
                <Select
                  value={adData.side}
                  onValueChange={(value) =>
                    setAdData({ ...adData, side: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Buy or Sell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cryptocurrency">Cryptocurrency</Label>
                <Select
                  value={adData.cryptocurrency}
                  onValueChange={(value) =>
                    setAdData({ ...adData, cryptocurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crypto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fiatCurrency">Fiat Currency</Label>
                <Select
                  value={adData.fiatCurrency}
                  onValueChange={(value) =>
                    setAdData({ ...adData, fiatCurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fiat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="availableAmount">Available Amount</Label>
                <Input
                  id="availableAmount"
                  placeholder="Enter amount"
                  value={adData.availableAmount}
                  onChange={(e) =>
                    setAdData({ ...adData, availableAmount: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input
                  id="unitPrice"
                  placeholder="Enter price"
                  value={adData.unitPrice}
                  onChange={(e) =>
                    setAdData({ ...adData, unitPrice: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Payment Methods
              </Label>
              <div className="mt-2 space-y-2">
                {["SasaPay", "M-Pesa", "Bank Transfer"].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={method}
                      checked={adData.paymentMethods.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAdData({
                            ...adData,
                            paymentMethods: [...adData.paymentMethods, method],
                          });
                        } else {
                          setAdData({
                            ...adData,
                            paymentMethods: adData.paymentMethods.filter(
                              (m) => m !== method
                            ),
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      title={`Select ${method} as payment method`}
                    />
                    <Label
                      htmlFor={method}
                      className="text-sm font-medium text-gray-900"
                    >
                      {method}
                      {method === "SasaPay" && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>

              {/* SasaPay Transaction Limits Info */}
              {adData.paymentMethods.includes("SasaPay") && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <div className="font-medium mb-1">
                        SasaPay Transaction Limits:
                      </div>
                      <div>
                        • Max Single:{" "}
                        {formatKesAmount(SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION)}
                      </div>
                      <div>
                        • Daily Limit:{" "}
                        {formatKesAmount(SASAPAY_LIMITS.DAILY_LIMIT)}
                      </div>
                      <div>
                        • Daily Used: {formatKesAmount(dailyUsed)} (
                        {usageStatus.percentage.toFixed(1)}%)
                      </div>
                      <div>
                        • Available Today:{" "}
                        {formatKesAmount(sasaPayLimits.maxDailyRemaining)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                SasaPay offers instant transfers with competitive rates for KES
                transactions.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrder">Min Order Limit</Label>
                <Input
                  id="minOrder"
                  placeholder="Minimum order size"
                  value={adData.minOrderSize}
                  onChange={(e) =>
                    setAdData({ ...adData, minOrderSize: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxOrder">Max Order Limit</Label>
                <Input
                  id="maxOrder"
                  placeholder="Maximum order size"
                  value={adData.maxOrderSize}
                  onChange={(e) =>
                    setAdData({ ...adData, maxOrderSize: e.target.value })
                  }
                />
              </div>
            </div>

            {/* SasaPay Buy Ad Validation */}
            {adData.paymentMethods.includes("SasaPay") &&
              adData.side === "buy" && (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-amber-800 mb-2">
                          SasaPay Buy Ad Configuration
                        </div>
                        <div className="text-sm text-amber-700 space-y-1">
                          <div>
                            • Recommended Max Order:{" "}
                            {formatKesAmount(sasaPayLimits.recommendedMaxOrder)}
                          </div>
                          <div>
                            • API Single Limit:{" "}
                            {formatKesAmount(
                              SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION
                            )}
                          </div>
                          <div>
                            • Available Today:{" "}
                            {formatKesAmount(sasaPayLimits.maxDailyRemaining)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Results */}
                  {buyAdValidation && (
                    <div
                      className={`p-3 rounded-lg border ${
                        buyAdValidation.isValid
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="text-sm">
                        {buyAdValidation.isValid ? (
                          <div className="text-green-800">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Configuration is valid for SasaPay
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="font-medium text-red-800">
                              Configuration Issues:
                            </div>
                            {buyAdValidation.warnings.map((warning, idx) => (
                              <div key={idx} className="text-red-700 text-xs">
                                • {warning}
                              </div>
                            ))}
                          </div>
                        )}

                        {buyAdValidation.suggestions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="font-medium text-gray-700 text-xs">
                              Suggestions:
                            </div>
                            {buyAdValidation.suggestions.map(
                              (suggestion, idx) => (
                                <div
                                  key={idx}
                                  className="text-gray-600 text-xs"
                                >
                                  • {suggestion}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {buyAdValidation.optimizedConfig && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="font-medium text-blue-700 text-xs">
                              Optimized Config:
                            </div>
                            <div className="text-blue-600 text-xs">
                              • Max:{" "}
                              {formatKesAmount(
                                buyAdValidation.optimizedConfig.maxOrderSize
                              )}
                              • Min:{" "}
                              {formatKesAmount(
                                buyAdValidation.optimizedConfig.minOrderSize
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 h-6 text-xs"
                              onClick={() => {
                                setAdData({
                                  ...adData,
                                  maxOrderSize:
                                    buyAdValidation.optimizedConfig!.maxOrderSize.toString(),
                                  minOrderSize:
                                    buyAdValidation.optimizedConfig!.minOrderSize.toString(),
                                });
                              }}
                            >
                              Apply Optimized
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            <div>
              <Label htmlFor="priceMargin">Price Margin (%)</Label>
              <Input
                id="priceMargin"
                placeholder="Enter margin percentage"
                value={adData.priceMargin}
                onChange={(e) =>
                  setAdData({ ...adData, priceMargin: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoReply"
                checked={adData.autoReply}
                onCheckedChange={(checked) =>
                  setAdData({ ...adData, autoReply: checked })
                }
              />
              <Label htmlFor="autoReply">Enable automated replies</Label>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kycLevel">Min KYC Level</Label>
                <Select
                  value={adData.requirements.minKycLevel.toString()}
                  onValueChange={(value) =>
                    setAdData({
                      ...adData,
                      requirements: {
                        ...adData.requirements,
                        minKycLevel: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="completionRate">Min Completion Rate (%)</Label>
                <Input
                  id="completionRate"
                  placeholder="Enter rate"
                  value={adData.requirements.minCompletionRate}
                  onChange={(e) =>
                    setAdData({
                      ...adData,
                      requirements: {
                        ...adData.requirements,
                        minCompletionRate: parseInt(e.target.value) || 80,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter any additional instructions..."
                value={adData.requirements.remarks}
                onChange={(e) =>
                  setAdData({
                    ...adData,
                    requirements: {
                      ...adData.requirements,
                      remarks: e.target.value,
                    },
                  })
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !adData.exchange ||
              !adData.side ||
              !adData.cryptocurrency ||
              !adData.fiatCurrency
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View Ad Dialog Component
function ViewAdDialog({
  isOpen,
  onClose,
  ad,
}: {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad | null;
}) {
  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Ad Details
          </DialogTitle>
          <DialogDescription>
            Viewing details for {ad.side.toUpperCase()} {ad.cryptocurrency}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Exchange
              </Label>
              <div className="mt-1">{ad.exchange.toUpperCase()}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Type</Label>
              <div className="mt-1">
                <Badge variant={ad.side === "buy" ? "default" : "secondary"}>
                  {ad.side.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Cryptocurrency
              </Label>
              <div className="mt-1 font-medium">{ad.cryptocurrency}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Fiat Currency
              </Label>
              <div className="mt-1 font-medium">{ad.fiatCurrency}</div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Unit Price
              </Label>
              <div className="mt-1 text-lg font-semibold">
                {ad.unitPrice} {ad.fiatCurrency}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Price Margin
              </Label>
              <div className="mt-1">{ad.priceMargin}%</div>
            </div>
          </div>

          {/* Order Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Available Amount
              </Label>
              <div className="mt-1 font-medium">
                {ad.availableAmount} {ad.cryptocurrency}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Min Order
              </Label>
              <div className="mt-1">
                {ad.minOrderSize} {ad.fiatCurrency}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Max Order
              </Label>
              <div className="mt-1">
                {ad.maxOrderSize} {ad.fiatCurrency}
              </div>
            </div>
          </div>

          {/* Status & Performance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <div className="mt-1">
                <Badge
                  variant={ad.status === "active" ? "default" : "secondary"}
                >
                  {ad.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Auto Reply
              </Label>
              <div className="mt-1">
                {ad.autoReply ? "Enabled" : "Disabled"}
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Completed Orders
              </Label>
              <div className="mt-1 text-lg font-semibold">
                {ad.completedOrders}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Total Volume
              </Label>
              <div className="mt-1 font-medium">
                {ad.totalVolume} {ad.fiatCurrency}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Success Rate
              </Label>
              <div className="mt-1 font-medium">{ad.successRate}%</div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Trading Requirements
            </Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="text-sm">
                Min KYC Level: {ad.requirements.minKycLevel}
              </div>
              <div className="text-sm">
                Min Completion Rate: {ad.requirements.minCompletionRate}%
              </div>
              {ad.requirements.remarks && (
                <div className="text-sm">
                  Remarks: {ad.requirements.remarks}
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          {ad.paymentMethods.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Payment Methods
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ad.paymentMethods.map((method, index) => (
                  <Badge
                    key={index}
                    variant={method === "SasaPay" ? "default" : "outline"}
                    className={
                      method === "SasaPay" ? "bg-blue-600 text-white" : ""
                    }
                  >
                    {method}
                    {method === "SasaPay" && <span className="ml-1">⚡</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>Created: {new Date(ad.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(ad.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Ad Dialog Component
function EditAdDialog({
  isOpen,
  onClose,
  onUpdateAd,
  ad,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAd: (ad: Partial<Ad>) => void;
  ad: Ad | null;
}) {
  const [adData, setAdData] = useState({
    exchange: "",
    side: "",
    cryptocurrency: "",
    fiatCurrency: "",
    unitPrice: "",
    availableAmount: "",
    minOrderSize: "",
    maxOrderSize: "",
    paymentMethods: [] as string[],
    autoReply: true,
    priceMargin: "0",
    requirements: {
      minKycLevel: 1,
      minCompletionRate: 80,
      remarks: "",
    },
  });

  // Initialize form with ad data when dialog opens
  useEffect(() => {
    if (ad && isOpen) {
      setAdData({
        exchange: ad.exchange,
        side: ad.side,
        cryptocurrency: ad.cryptocurrency,
        fiatCurrency: ad.fiatCurrency,
        unitPrice: ad.unitPrice,
        availableAmount: ad.availableAmount,
        minOrderSize: ad.minOrderSize,
        maxOrderSize: ad.maxOrderSize,
        paymentMethods: ad.paymentMethods,
        autoReply: ad.autoReply,
        priceMargin: ad.priceMargin.toString(),
        requirements: ad.requirements,
      });
    }
  }, [ad, isOpen]);

  const handleSubmit = () => {
    onUpdateAd({
      ...adData,
      exchange: adData.exchange as "okx" | "binance" | "bybit",
      side: adData.side as "buy" | "sell",
      priceMargin: parseFloat(adData.priceMargin) || 0,
    });
  };

  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Ad
          </DialogTitle>
          <DialogDescription>
            Update your {ad.side.toUpperCase()} {ad.cryptocurrency}{" "}
            advertisement
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitPrice">
                  Unit Price ({adData.fiatCurrency})
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={adData.unitPrice}
                  onChange={(e) =>
                    setAdData({ ...adData, unitPrice: e.target.value })
                  }
                  placeholder="Enter unit price"
                />
              </div>
              <div>
                <Label htmlFor="availableAmount">
                  Available Amount ({adData.cryptocurrency})
                </Label>
                <Input
                  id="availableAmount"
                  type="number"
                  value={adData.availableAmount}
                  onChange={(e) =>
                    setAdData({ ...adData, availableAmount: e.target.value })
                  }
                  placeholder="Amount to trade"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrderSize">
                  Min Order Size ({adData.fiatCurrency})
                </Label>
                <Input
                  id="minOrderSize"
                  type="number"
                  value={adData.minOrderSize}
                  onChange={(e) =>
                    setAdData({ ...adData, minOrderSize: e.target.value })
                  }
                  placeholder="Minimum order"
                />
              </div>
              <div>
                <Label htmlFor="maxOrderSize">
                  Max Order Size ({adData.fiatCurrency})
                </Label>
                <Input
                  id="maxOrderSize"
                  type="number"
                  value={adData.maxOrderSize}
                  onChange={(e) =>
                    setAdData({ ...adData, maxOrderSize: e.target.value })
                  }
                  placeholder="Maximum order"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoReply"
                checked={adData.autoReply}
                onCheckedChange={(checked) =>
                  setAdData({ ...adData, autoReply: checked })
                }
              />
              <Label htmlFor="autoReply">
                Enable auto-reply for incoming orders
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div>
              <Label htmlFor="priceMargin">Price Margin (%)</Label>
              <Input
                id="priceMargin"
                type="number"
                step="0.01"
                value={adData.priceMargin}
                onChange={(e) =>
                  setAdData({ ...adData, priceMargin: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minKycLevel">Minimum KYC Level</Label>
                <Select
                  value={adData.requirements.minKycLevel.toString()}
                  onValueChange={(value) =>
                    setAdData({
                      ...adData,
                      requirements: {
                        ...adData.requirements,
                        minKycLevel: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minCompletionRate">
                  Min Completion Rate (%)
                </Label>
                <Input
                  id="minCompletionRate"
                  type="number"
                  min="0"
                  max="100"
                  value={adData.requirements.minCompletionRate}
                  onChange={(e) =>
                    setAdData({
                      ...adData,
                      requirements: {
                        ...adData.requirements,
                        minCompletionRate: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="remarks">Additional Requirements</Label>
              <Textarea
                id="remarks"
                value={adData.requirements.remarks}
                onChange={(e) =>
                  setAdData({
                    ...adData,
                    requirements: {
                      ...adData.requirements,
                      remarks: e.target.value,
                    },
                  })
                }
                placeholder="Any additional trading requirements..."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Edit className="h-4 w-4 mr-2" />
            Update Ad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Main Ad Management Component
 *
 * Provides a comprehensive team-based P2P trading interface supporting:
 * - Centralized team management across OKX, Binance, and Bybit exchanges
 * - Role-based permissions for team members
 * - Advanced ad creation and management
 * - Real-time statistics and performance monitoring
 * - Professional UI with filtering and search capabilities
 */
export function AdManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isJoinTeamDialogOpen, setIsJoinTeamDialogOpen] = useState(false);
  const [isCreateAdDialogOpen, setIsCreateAdDialogOpen] = useState(false);
  const [isEditAdDialogOpen, setIsEditAdDialogOpen] = useState(false);
  const [isViewAdDialogOpen, setIsViewAdDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExchange, setFilterExchange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole] = useState<UserRole>(getCurrentUserRole());
  const [isLoading, setIsLoading] = useState(true);

  // SasaPay daily usage tracking (this would come from actual daily usage data)
  const [dailyUsed] = useState(245000); // Example: KES 245,000 used today
  const sasaPayLimits = getSasaPayOrderLimits(dailyUsed);
  const usageStatus = getDailyUsageStatus(dailyUsed);

  const { user } = useMockAuth();

  const teamStorage = MockTeamStorage.getInstance();
  const adStorage = MockAdStorage.getInstance();

  // Load data when component mounts

  // Load ads from storage on component mount
  useEffect(() => {
    const storedAds = adStorage.getAllAds();
    setAds(storedAds);
  }, []);

  // Load teams on component mount
  useEffect(() => {
    if (user) {
      const allTeams = teamStorage.getAllTeams();

      // Filter teams where user is owner or member
      const userTeams = allTeams.filter((team) => {
        const isOwner = team.owner.id === user.id;
        const isMember = team.members.some((member) => member.id === user.id);
        return isOwner || isMember;
      });

      setTeams(userTeams);
      setIsLoading(false);

      // Auto-select the first available team if user has access
      if (userTeams.length > 0 && !selectedTeam) {
        const firstTeam = userTeams[0];
        setSelectedTeam(firstTeam);
      }
    }
  }, [user]);

  // Get all teams for joining (teams user is not part of)
  const [allTeamsForJoining, setAllTeamsForJoining] = useState<Team[]>([]);

  useEffect(() => {
    if (user) {
      const allTeams = teamStorage.getAllTeams();
      const availableForJoining = allTeams.filter(
        (team) =>
          team.owner.id !== user.id &&
          !team.members.some((member) => member.id === user.id)
      );
      setAllTeamsForJoining(availableForJoining);
    }
  }, [user, teams]); // Re-run when teams change

  // Check if user is part of any team (this will include owned teams)
  const userTeam = teams.find(
    (team) =>
      team.owner.id === user?.id ||
      team.members.some((member) => member.id === user?.id)
  );

  // Set selected team if user is part of one
  useEffect(() => {
    if (userTeam && !selectedTeam) {
      setSelectedTeam(userTeam);
    }
  }, [userTeam, selectedTeam]);

  // Filter ads based on selected team and filters
  const filteredAds = selectedTeam
    ? adStorage.getFilteredAds({
        teamId: selectedTeam.id,
        status: filterStatus,
        exchange: filterExchange,
        searchTerm: searchTerm,
      })
    : [];

  const handleJoinTeam = (teamId: string) => {
    if (!user) {
      return;
    }

    try {
      const success = teamStorage.joinTeam(
        teamId,
        user.id,
        user.full_name,
        user.email
      );

      if (success) {
        // Reload user's teams to get updated data
        const allTeams = teamStorage.getAllTeams();
        const userTeams = allTeams.filter(
          (team) =>
            team.owner.id === user.id ||
            team.members.some((member) => member.id === user.id)
        );
        setTeams(userTeams);

        // Update available teams for joining
        const availableForJoining = allTeams.filter(
          (team) =>
            team.owner.id !== user.id &&
            !team.members.some((member) => member.id === user.id)
        );
        setAllTeamsForJoining(availableForJoining);

        // Find and set the joined team as selected
        const joinedTeam = userTeams.find((team) => team.id === teamId);
        if (joinedTeam) {
          setSelectedTeam(joinedTeam);
        }
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const handleCreateAd = (adData: Partial<Ad>) => {
    if (!user || !selectedTeam) {
      return;
    }

    const newAd = adStorage.addAd(adData, user.id, selectedTeam.id);

    // Update local state with all ads from storage
    const updatedAds = adStorage.getAllAds();
    setAds(updatedAds);
  };

  const handleToggleAdStatus = (adId: string) => {
    const updatedAd = adStorage.toggleAdStatus(adId);
    if (updatedAd) {
      // Update local state with all ads from storage
      const updatedAds = adStorage.getAllAds();
      setAds(updatedAds);
    }
  };

  const handleDeleteAd = (adId: string) => {
    const success = adStorage.deleteAd(adId);
    if (success) {
      // Update local state with all ads from storage
      const updatedAds = adStorage.getAllAds();
      setAds(updatedAds);
    }
  };

  const handleViewAd = (ad: Ad) => {
    setSelectedAd(ad);
    setIsViewAdDialogOpen(true);
  };

  const handleEditAd = (ad: Ad) => {
    setSelectedAd(ad);
    setIsEditAdDialogOpen(true);
  };

  const handleUpdateAd = (adData: Partial<Ad>) => {
    if (!selectedAd) {
      return;
    }

    const updatedAd = adStorage.updateAd(selectedAd.id, adData);
    if (updatedAd) {
      // Update local state with all ads from storage
      const updatedAds = adStorage.getAllAds();
      setAds(updatedAds);

      setIsEditAdDialogOpen(false);
      setSelectedAd(null);
    }
  };

  const getExchangeBadge = (exchange: string) => {
    const config = {
      okx: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "OKX" },
      binance: {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        label: "Binance",
      },
      bybit: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Bybit",
      },
    };
    const exchangeConfig = config[exchange as keyof typeof config];
    return (
      <Badge variant="secondary" className={exchangeConfig?.color}>
        {exchangeConfig?.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: {
        color: "bg-green-50 text-green-700 border-green-200",
        label: "Active",
      },
      paused: {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        label: "Paused",
      },
      inactive: {
        color: "bg-gray-50 text-gray-600 border-gray-200",
        label: "Inactive",
      },
    };
    const statusConfig = config[status as keyof typeof config];
    return (
      <Badge variant="secondary" className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    );
  };

  // Calculate team statistics
  const teamStats = selectedTeam
    ? {
        totalAds: filteredAds.length,
        activeAds: filteredAds.filter((ad) => ad.status === "active").length,
        totalOrders: filteredAds.reduce((sum, ad) => sum + ad.currentOrders, 0),
        totalVolume: filteredAds.reduce(
          (sum, ad) => sum + parseFloat(ad.totalVolume.replace(/,/g, "")),
          0
        ),
      }
    : null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Loading Teams
              </h2>
              <p className="text-gray-600">
                Please wait while we load your team data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Team-Based Ad Management
              </h1>
              <p className="text-gray-600 mb-4">
                {selectedTeam
                  ? `Managing P2P operations for ${selectedTeam.name}`
                  : "Join a team to start managing P2P trading operations"}
              </p>

              {/* Team Selector - Show when user has multiple teams */}
              {teams.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="teamSelector"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active Team:
                  </Label>
                  <Select
                    value={selectedTeam?.id || ""}
                    onValueChange={(teamId) => {
                      const team = teams.find((t) => t.id === teamId);
                      if (team) {
                        setSelectedTeam(team);
                      }
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select active team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.owner.avatar} />
                              <AvatarFallback className="text-xs">
                                {team.owner.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{team.name}</span>
                            {team.owner.id === user?.id && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                Owner
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!selectedTeam && allTeamsForJoining.length > 0 && (
                <Button onClick={() => setIsJoinTeamDialogOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Join Team
                </Button>
              )}
              {userRole.type === "main_user" && (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/dashboard/profile")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Teams
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user) {
                    const allTeams = teamStorage.getAllTeams();
                    const userTeams = allTeams.filter(
                      (team) =>
                        team.owner.id === user.id ||
                        team.members.some((member) => member.id === user.id)
                    );
                    setTeams(userTeams);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Teams
              </Button>
              <Button
                onClick={() => setIsCreateAdDialogOpen(true)}
                disabled={!selectedTeam}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Ad
              </Button>
            </div>
          </div>
        </div>

        {/* Team Information */}
        {selectedTeam ? (
          <Card className="border-gray-200 bg-white shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Current Team: {selectedTeam.name}
              </CardTitle>
              <CardDescription>{selectedTeam.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedTeam.owner.avatar} />
                    <AvatarFallback>
                      {selectedTeam.owner.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      Owner: {selectedTeam.owner.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedTeam.members.length} team members
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTeam.exchanges.okx.connected && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 text-xs"
                    >
                      OKX
                    </Badge>
                  )}
                  {selectedTeam.exchanges.binance.connected && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-50 text-yellow-700 text-xs"
                    >
                      Binance
                    </Badge>
                  )}
                  {selectedTeam.exchanges.bybit.connected && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 text-xs"
                    >
                      Bybit
                    </Badge>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {selectedTeam.activeAds} active ads
                  </p>
                  <p className="text-sm text-gray-500">
                    Volume: ${selectedTeam.totalVolume}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200 bg-white shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                No Team Selected
              </CardTitle>
              <CardDescription>
                You need to join a team to access P2P trading operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Join a Trading Team
                </h3>
                <p className="text-gray-500 mb-4">
                  Connect with a main user's team to start managing P2P
                  advertisements and orders
                </p>
                <Button onClick={() => setIsJoinTeamDialogOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Browse Available Teams
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {selectedTeam && teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Ads
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.totalAds}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Ads
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.activeAds}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.totalOrders}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Volume
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${teamStats.totalVolume.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SasaPay Usage Tracking */}
        {selectedTeam && (
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SasaPay Daily Usage Tracking
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Monitor daily transaction limits for buy ad management
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={`${
                    usageStatus.status === "safe"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : usageStatus.status === "warning"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : usageStatus.status === "critical"
                      ? "bg-orange-100 text-orange-800 border-orange-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }`}
                >
                  {usageStatus.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatKesAmount(dailyUsed)}
                  </div>
                  <div className="text-sm text-blue-700">Used Today</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {usageStatus.percentage.toFixed(1)}% of daily limit
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {formatKesAmount(sasaPayLimits.maxDailyRemaining)}
                  </div>
                  <div className="text-sm text-green-700">Available Today</div>
                  <div className="text-xs text-green-600 mt-1">
                    {(
                      (sasaPayLimits.maxDailyRemaining /
                        SASAPAY_LIMITS.DAILY_LIMIT) *
                      100
                    ).toFixed(1)}
                    % remaining
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatKesAmount(sasaPayLimits.recommendedMaxOrder)}
                  </div>
                  <div className="text-sm text-purple-700">
                    Recommended Max Order
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    80% of available capacity
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">
                    {formatKesAmount(SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION)}
                  </div>
                  <div className="text-sm text-amber-700">API Single Limit</div>
                  <div className="text-xs text-amber-600 mt-1">
                    Hard system limit
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Daily Usage Progress
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatKesAmount(dailyUsed)} /{" "}
                    {formatKesAmount(SASAPAY_LIMITS.DAILY_LIMIT)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 usage-progress-bar ${
                      usageStatus.status === "safe"
                        ? "bg-green-500"
                        : usageStatus.status === "warning"
                        ? "bg-yellow-500"
                        : usageStatus.status === "critical"
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    data-width={Math.min(usageStatus.percentage, 100)}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {usageStatus.message}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Controls */}
        <Card className="border-gray-200 bg-white shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by cryptocurrency or fiat currency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterExchange}
                  onValueChange={setFilterExchange}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exchanges</SelectItem>
                    <SelectItem value="okx">OKX</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ads Table */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">
                  {selectedTeam
                    ? `${selectedTeam.name} - Advertisements`
                    : "Select a Team"}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {selectedTeam
                    ? "Manage P2P advertisements across multiple exchanges"
                    : "Please select a team to view and manage advertisements"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedTeam ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Exchange
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Pair
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Price
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Performance
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAds.map((ad) => (
                      <tr
                        key={ad.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getExchangeBadge(ad.exchange)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {ad.cryptocurrency}/{ad.fiatCurrency}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className={
                              ad.side === "buy"
                                ? "border-green-200 text-green-700"
                                : "border-red-200 text-red-700"
                            }
                          >
                            {ad.side.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {ad.unitPrice} {ad.fiatCurrency}
                            </p>
                            <p className="text-sm text-gray-500">
                              ±{ad.priceMargin}% margin
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {ad.availableAmount} {ad.cryptocurrency}
                            </p>
                            <p className="text-sm text-gray-500">
                              {ad.minOrderSize} - {ad.maxOrderSize}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(ad.status)}
                            {ad.isHidden && (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {ad.completedOrders} orders
                            </p>
                            <p className="text-sm text-gray-500">
                              {ad.successRate}% success
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdStatus(ad.id)}
                            >
                              {ad.status === "active" ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleEditAd(ad)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Ad
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleViewAd(ad)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteAd(ad.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Ad
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAds.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No ads found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ||
                      filterStatus !== "all" ||
                      filterExchange !== "all"
                        ? "Try adjusting your filters or search terms"
                        : "Create your first advertisement to get started"}
                    </p>
                    {!searchTerm &&
                      filterStatus === "all" &&
                      filterExchange === "all" && (
                        <Button onClick={() => setIsCreateAdDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Ad
                        </Button>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No team selected
                </h3>
                <p className="text-gray-500 mb-4">
                  Team creation is available in your profile page. Team members
                  can join existing teams here.
                </p>
                <Button
                  onClick={() => (window.location.href = "/dashboard/profile")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Go to Profile for Team Creation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Components */}
        <JoinTeamDialog
          isOpen={isJoinTeamDialogOpen}
          onClose={() => setIsJoinTeamDialogOpen(false)}
          availableTeams={allTeamsForJoining}
          onJoinTeam={handleJoinTeam}
        />

        <CreateAdDialog
          isOpen={isCreateAdDialogOpen}
          onClose={() => setIsCreateAdDialogOpen(false)}
          onCreateAd={handleCreateAd}
          selectedTeam={selectedTeam}
        />

        <ViewAdDialog
          isOpen={isViewAdDialogOpen}
          onClose={() => setIsViewAdDialogOpen(false)}
          ad={selectedAd}
        />

        <EditAdDialog
          isOpen={isEditAdDialogOpen}
          onClose={() => setIsEditAdDialogOpen(false)}
          onUpdateAd={handleUpdateAd}
          ad={selectedAd}
        />
      </div>
    </div>
  );
}
