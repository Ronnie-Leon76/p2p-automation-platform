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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, EyeOff, Plus, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";

// Mock data for demonstration
const mockAds = [
  {
    id: "ad_001",
    side: "sell",
    cryptoCurrency: "USDT",
    fiatCurrency: "CNY",
    unitPrice: "7.25",
    availableAmount: "10000",
    minOrderSize: "100",
    maxOrderSize: "5000",
    status: "active",
    isHidden: false,
    createdAt: "2024-01-15T10:30:00Z",
    completedOrders: 45,
    totalVolume: "125000",
  },
  {
    id: "ad_002",
    side: "buy",
    cryptoCurrency: "BTC",
    fiatCurrency: "USD",
    unitPrice: "43250.00",
    availableAmount: "0.5",
    minOrderSize: "0.001",
    maxOrderSize: "0.1",
    status: "active",
    isHidden: false,
    createdAt: "2024-01-14T15:45:00Z",
    completedOrders: 12,
    totalVolume: "25000",
  },
  {
    id: "ad_003",
    side: "sell",
    cryptoCurrency: "ETH",
    fiatCurrency: "EUR",
    unitPrice: "2450.50",
    availableAmount: "5.0",
    minOrderSize: "0.01",
    maxOrderSize: "1.0",
    status: "paused",
    isHidden: true,
    createdAt: "2024-01-13T09:20:00Z",
    completedOrders: 8,
    totalVolume: "15000",
  },
];

export function AdManagement() {
  const [ads, setAds] = useState(mockAds);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleToggleAdStatus = (adId: string) => {
    setAds(
      ads.map((ad) =>
        ad.id === adId
          ? {
              ...ad,
              isHidden: !ad.isHidden,
              status: ad.isHidden ? "active" : "paused",
            }
          : ad
      )
    );
  };

  const handleDeleteAd = (adId: string) => {
    setAds(ads.filter((ad) => ad.id !== adId));
  };

  const handleEditAd = (ad: any) => {
    setSelectedAd(ad);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Ad Management
          </h2>
          <p className="text-gray-400">
            Create and manage your P2P trading advertisements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/20 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Create Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ad</DialogTitle>
              <DialogDescription>
                Set up a new P2P trading advertisement
              </DialogDescription>
            </DialogHeader>
            <CreateAdForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Ads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ads.length}</div>
            <p className="text-xs text-gray-400">
              {ads.filter((ad) => ad.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Volume
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$165K</div>
            <p className="text-xs text-gray-400">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Completed Orders
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">65</div>
            <p className="text-xs text-gray-400">+8% from last week</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Avg. Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">94.2%</div>
            <p className="text-xs text-gray-400">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Ads Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white">Your Advertisements</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your active and paused P2P trading ads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Order Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <Badge
                      variant={ad.side === "buy" ? "default" : "secondary"}
                    >
                      {ad.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {ad.cryptoCurrency}/{ad.fiatCurrency}
                  </TableCell>
                  <TableCell>{ad.unitPrice}</TableCell>
                  <TableCell>{ad.availableAmount}</TableCell>
                  <TableCell>
                    {ad.minOrderSize} - {ad.maxOrderSize}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ad.status === "active" ? "default" : "secondary"}
                    >
                      {ad.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{ad.completedOrders} orders</div>
                      <div className="text-muted-foreground">
                        ${ad.totalVolume}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdStatus(ad.id)}
                        className="text-yellow-400 hover:text-orange-400 hover:bg-white/10"
                      >
                        {ad.isHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAd(ad)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-white/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Ad Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Advertisement</DialogTitle>
            <DialogDescription>
              Update your P2P trading advertisement
            </DialogDescription>
          </DialogHeader>
          {selectedAd && (
            <EditAdForm
              ad={selectedAd}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAdForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="side">Ad Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crypto">Cryptocurrency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select crypto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiat">Fiat Currency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select fiat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount</Label>
              <Input id="amount" placeholder="Enter amount" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priceType">Price Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select price type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="floating">Floating Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input id="unitPrice" placeholder="Enter price" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">Price Margin (%)</Label>
              <Input id="margin" placeholder="Enter margin" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrder">Min Order Limit</Label>
              <Input id="minOrder" placeholder="Enter min limit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOrder">Max Order Limit</Label>
              <Input id="maxOrder" placeholder="Enter max limit" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kycLevel">Min KYC Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select KYC level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionRate">Min Completion Rate (%)</Label>
              <Input id="completionRate" placeholder="Enter rate" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remark">Remarks</Label>
            <Textarea
              id="remark"
              placeholder="Enter any additional instructions..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="autoMessage" />
            <Label htmlFor="autoMessage">Enable automated messages</Label>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-white/5 backdrop-blur-sm border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30"
        >
          Cancel
        </Button>
        <Button
          onClick={onClose}
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/20 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
        >
          Create Ad
        </Button>
      </DialogFooter>
    </div>
  );
}

function EditAdForm({ ad, onClose }: { ad: any; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editUnitPrice">Unit Price</Label>
          <Input id="editUnitPrice" defaultValue={ad.unitPrice} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editAvailable">Available Amount</Label>
          <Input id="editAvailable" defaultValue={ad.availableAmount} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editMinOrder">Min Order Limit</Label>
          <Input id="editMinOrder" defaultValue={ad.minOrderSize} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editMaxOrder">Max Order Limit</Label>
          <Input id="editMaxOrder" defaultValue={ad.maxOrderSize} />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-white/5 backdrop-blur-sm border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30"
        >
          Cancel
        </Button>
        <Button
          onClick={onClose}
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/20 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
        >
          Update Ad
        </Button>
      </DialogFooter>
    </div>
  );
}
