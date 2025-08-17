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
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { MockAuthService } from "@/lib/auth/mock-auth";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Settings,
  Shield,
  TestTube,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ExchangeCredentials {
  exchange: "okx" | "binance" | "bybit";
  api_key: string;
  api_secret: string;
  passphrase?: string;
  testnet?: boolean;
  permissions?: string[];
}

interface ExchangeConnectionStatus {
  connected: boolean;
  lastChecked: string;
  balance?: string;
  permissions?: string[];
  status: "active" | "error" | "pending";
  errorMessage?: string;
}

export function ExchangeSettings() {
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Environment-aware auth
  const mockAuth = useMockAuth();
  const supabaseAuth = useSupabaseAuth();
  
  const user = isDevelopment ? mockAuth.user : supabaseAuth.user;
  
  const { toast } = useToast();
  const mockAuthService = MockAuthService.getInstance();

  useEffect(() => {
    setIsClient(true);
    setIsDevelopment(process.env.NODE_ENV === "development");
  }, []);

  const [credentials, setCredentials] = useState<ExchangeCredentials>({
    exchange: "okx",
    api_key: "",
    api_secret: "",
    passphrase: "",
    testnet: true,
    permissions: [],
  });

  const [connectionStatus, setConnectionStatus] =
    useState<ExchangeConnectionStatus>({
      connected: false,
      lastChecked: "",
      status: "pending",
    });

  const [isEditing, setIsEditing] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load existing credentials on mount
  useEffect(() => {
    const userCredentials = isDevelopment 
      ? (user as any)?.exchange_credentials 
      : (user as any)?.user_metadata?.exchange_credentials;
      
    if (userCredentials) {
      setCredentials({
        exchange: userCredentials.exchange as
          | "okx"
          | "binance"
          | "bybit",
        api_key: userCredentials.api_key,
        api_secret: userCredentials.api_secret,
        passphrase: userCredentials.passphrase || "",
        testnet: true, // Default to testnet for development
        permissions: ["read", "trade"], // Mock permissions
      });

      setConnectionStatus({
        connected: true,
        lastChecked: new Date().toISOString(),
        balance: "1,234.56 USDT",
        permissions: ["read", "trade"],
        status: "active",
      });
    }
  }, [user]);

  const handleSaveCredentials = async () => {
    if (!credentials.api_key || !credentials.api_secret) {
      toast({
        title: "Missing Credentials",
        description: "Please provide both API key and secret.",
        variant: "destructive",
      });
      return;
    }

    if (credentials.exchange === "okx" && !credentials.passphrase) {
      toast({
        title: "Missing Passphrase",
        description: "OKX requires an API passphrase.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Test connection first
      await testConnection();

      // Save to localStorage (in real app, this would be encrypted and sent to backend)
      const updatedUser = {
        ...user,
        exchange_credentials: {
          exchange: credentials.exchange,
          api_key: credentials.api_key,
          api_secret: credentials.api_secret,
          passphrase: credentials.passphrase,
        },
      };

      if (typeof window !== "undefined") {
        const currentSession = JSON.parse(
          localStorage.getItem("mock_auth_session") || "{}"
        );
        currentSession.user = updatedUser;
        localStorage.setItem(
          "mock_auth_session",
          JSON.stringify(currentSession)
        );
        localStorage.setItem(
          "mock_exchange_credentials",
          JSON.stringify(updatedUser.exchange_credentials)
        );
      }

      setIsEditing(false);
      setConnectionStatus({
        connected: true,
        lastChecked: new Date().toISOString(),
        balance: "1,234.56 USDT",
        permissions: ["read", "trade"],
        status: "active",
      });

      toast({
        title: "Credentials Saved",
        description: `Successfully connected to ${credentials.exchange.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect with provided credentials.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async (): Promise<boolean> => {
    setIsTestingConnection(true);

    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock validation
      if (
        credentials.api_key.length < 10 ||
        credentials.api_secret.length < 10
      ) {
        throw new Error("Invalid credentials format");
      }

      setConnectionStatus({
        connected: true,
        lastChecked: new Date().toISOString(),
        balance: "1,234.56 USDT",
        permissions: ["read", "trade"],
        status: "active",
      });

      toast({
        title: "Connection Successful",
        description: `Connected to ${credentials.exchange.toUpperCase()} successfully.`,
      });

      return true;
    } catch (error) {
      setConnectionStatus({
        connected: false,
        lastChecked: new Date().toISOString(),
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Connection failed",
      });

      toast({
        title: "Connection Failed",
        description:
          "Unable to connect to exchange. Please check your credentials.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDeleteCredentials = () => {
    if (typeof window !== "undefined") {
      const currentSession = JSON.parse(
        localStorage.getItem("mock_auth_session") || "{}"
      );
      delete currentSession.user.exchange_credentials;
      localStorage.setItem("mock_auth_session", JSON.stringify(currentSession));
      localStorage.removeItem("mock_exchange_credentials");
    }

    setCredentials({
      exchange: "okx",
      api_key: "",
      api_secret: "",
      passphrase: "",
      testnet: true,
      permissions: [],
    });

    setConnectionStatus({
      connected: false,
      lastChecked: "",
      status: "pending",
    });

    setIsDeleteDialogOpen(false);
    setIsEditing(false);

    toast({
      title: "Credentials Removed",
      description: "Exchange credentials have been deleted.",
    });
  };

  const getExchangeInfo = (exchange: string) => {
    const info = {
      okx: {
        name: "OKX",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Wallet,
        requiresPassphrase: true,
        description: "Global cryptocurrency exchange with P2P trading",
      },
      binance: {
        name: "Binance",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Wallet,
        requiresPassphrase: false,
        description: "World's largest cryptocurrency exchange",
      },
      bybit: {
        name: "Bybit",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Wallet,
        requiresPassphrase: false,
        description: "Derivatives and P2P trading platform",
      },
    };
    return info[exchange as keyof typeof info];
  };

  const exchangeInfo = getExchangeInfo(credentials.exchange);

  return (
    <div className="space-y-6">
      {/* Current Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Exchange Connection
              </CardTitle>
              <CardDescription>
                Manage your exchange API credentials for automated trading
              </CardDescription>
            </div>
            {connectionStatus.connected && (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connectionStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <exchangeInfo.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">
                      {exchangeInfo.name}
                    </p>
                    <p className="text-sm text-green-700">
                      {exchangeInfo.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-900">
                    {connectionStatus.balance}
                  </p>
                  <p className="text-sm text-green-700">
                    Last checked:{" "}
                    {new Date(
                      connectionStatus.lastChecked
                    ).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-gray-600">Testnet Mode:</span>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700"
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    {credentials.testnet ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-gray-600">Permissions:</span>
                  <div className="flex gap-1">
                    {connectionStatus.permissions?.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Edit Credentials
                </Button>
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  className="flex-1"
                >
                  {isTestingConnection ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Exchange Connected
              </h3>
              <p className="text-gray-600 mb-4">
                Connect your exchange account to enable automated P2P trading
              </p>
              <Button onClick={() => setIsEditing(true)}>
                <Key className="h-4 w-4 mr-2" />
                Connect Exchange
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Security Notice</h4>
              <p className="text-sm text-amber-800 mt-1">
                Your API credentials are stored securely and encrypted. Never
                share your API keys or secrets with anyone. We recommend using
                testnet for development and limiting API permissions to only
                what's needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Credentials Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {connectionStatus.connected ? "Edit" : "Add"} Exchange Credentials
            </DialogTitle>
            <DialogDescription>
              Configure your exchange API credentials for automated trading
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Exchange Platform</Label>
              <Select
                value={credentials.exchange}
                onValueChange={(value: "okx" | "binance" | "bybit") =>
                  setCredentials((prev) => ({ ...prev, exchange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="okx">
                    OKX - Recommended for beginners
                  </SelectItem>
                  <SelectItem value="binance">
                    Binance - Most popular
                  </SelectItem>
                  <SelectItem value="bybit">
                    Bybit - Advanced features
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type={showSecrets ? "text" : "password"}
                value={credentials.api_key}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    api_key: e.target.value,
                  }))
                }
                placeholder="Enter your API key"
              />
            </div>

            <div>
              <Label htmlFor="api-secret">API Secret</Label>
              <div className="relative">
                <Input
                  id="api-secret"
                  type={showSecrets ? "text" : "password"}
                  value={credentials.api_secret}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      api_secret: e.target.value,
                    }))
                  }
                  placeholder="Enter your API secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {getExchangeInfo(credentials.exchange).requiresPassphrase && (
              <div>
                <Label htmlFor="passphrase">Passphrase</Label>
                <Input
                  id="passphrase"
                  type={showSecrets ? "text" : "password"}
                  value={credentials.passphrase}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      passphrase: e.target.value,
                    }))
                  }
                  placeholder="Enter your API passphrase"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="testnet"
                checked={credentials.testnet}
                onCheckedChange={(checked) =>
                  setCredentials((prev) => ({ ...prev, testnet: checked }))
                }
              />
              <Label htmlFor="testnet">
                Use Testnet (Recommended for development)
              </Label>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Required Permissions:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Read account information</li>
                <li>• Place and cancel orders</li>
                <li>• Access P2P trading features</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCredentials}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Save & Test Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Exchange Credentials</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove your exchange credentials? This
              will disable automated trading.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              This action cannot be undone. You'll need to re-enter your
              credentials to reconnect.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCredentials}>
              Remove Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
