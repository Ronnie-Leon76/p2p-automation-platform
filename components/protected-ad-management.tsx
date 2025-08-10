"use client";

import { TeamSwitcher } from "@/components/team-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeam } from "@/lib/hooks/use-team";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertCircle,
  BarChart3,
  DollarSign,
  Download,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Ad {
  id: string;
  team_id: string;
  exchange_name: string;
  external_ad_id: string | null;
  side: string;
  crypto_currency: string;
  fiat_currency: string;
  crypto_amount: number | null;
  unit_price: number | null;
  min_order_limit: number | null;
  max_order_limit: number | null;
  status: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export function ProtectedAdManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentTeam } = useTeam();
  const supabase = createClient();

  useEffect(() => {
    if (!currentTeam) return;

    const fetchAds = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("ads")
          .select("*")
          .eq("team_id", currentTeam.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAds(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [currentTeam, supabase]);

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex items-center justify-center h-64">
          <Card className="border-0 shadow-sm bg-white max-w-md w-full">
            <CardContent className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Team Selected
              </h3>
              <p className="text-gray-600 mb-4">
                Please select or create a team to manage ads.
              </p>
              <TeamSwitcher />
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
            <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your P2P trading advertisements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TeamSwitcher />
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button disabled className="opacity-50 gap-2">
              <Plus className="h-4 w-4" />
              Create Ad (Protected)
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Protection Notice */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <strong>Protected Environment:</strong> Ad creation and modification
            features are disabled as OKX doesn't provide a sandbox environment.
            This protects your live trading operations from accidental changes
            during development.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Ads
                    </p>
                    <p className="text-xs text-gray-500">All advertisements</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {ads.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ads.filter((ad) => ad.status === "active").length} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Buy Ads</p>
                    <p className="text-xs text-gray-500">Purchase orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {ads.filter((ad) => ad.side === "buy").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Sell Ads
                    </p>
                    <p className="text-xs text-gray-500">Sale orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {ads.filter((ad) => ad.side === "sell").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Exchanges
                    </p>
                    <p className="text-xs text-gray-500">Connected platforms</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(ads.map((ad) => ad.exchange_name)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ads Table */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Your Advertisements
                </CardTitle>
                <CardDescription className="text-gray-600">
                  View and manage your P2P trading advertisements
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-gray-600 font-medium">
                    Loading advertisements...
                  </span>
                </div>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  No advertisements found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Connect your exchange API and create your first ad to get
                  started.
                </p>
                <Button variant="outline" size="sm" disabled>
                  Create Your First Ad
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold text-gray-700">
                        Exchange
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Trading Pair
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Unit Price
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Order Limits
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => (
                      <TableRow
                        key={ad.id}
                        className="border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {ad.exchange_name.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ad.side === "buy" ? "default" : "secondary"
                            }
                            className={
                              ad.side === "buy"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }
                          >
                            {ad.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {ad.crypto_currency}/{ad.fiat_currency}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {ad.unit_price
                            ? `$${ad.unit_price.toLocaleString()}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {ad.crypto_amount
                            ? ad.crypto_amount.toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {ad.min_order_limit && ad.max_order_limit
                            ? `$${ad.min_order_limit.toLocaleString()} - $${ad.max_order_limit.toLocaleString()}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ad.status === "active" ? "default" : "secondary"
                            }
                            className={
                              ad.status === "active"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }
                          >
                            {ad.status.charAt(0).toUpperCase() +
                              ad.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(ad.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
