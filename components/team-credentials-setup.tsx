"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeam } from "@/lib/hooks/use-team";
import { AlertTriangle, ExternalLink, Key, Shield, Users } from "lucide-react";
import { useState } from "react";

interface TeamCredentialsSetupProps {
  teamId: string;
  isOwner: boolean;
}

export function TeamCredentialsSetup({
  teamId,
  isOwner,
}: TeamCredentialsSetupProps) {
  const [selectedExchange, setSelectedExchange] = useState<string>("");
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [sharedTradingEnabled, setSharedTradingEnabled] = useState(true);
  const { currentTeam } = useTeam();

  const exchanges = [
    {
      id: "okx",
      name: "OKX",
      icon: "🟡",
      description: "Connect your OKX P2P trading account",
      authUrl: "/dashboard/team/credentials?exchange=okx",
    },
    {
      id: "binance",
      name: "Binance",
      icon: "🟨",
      description: "Connect your Binance P2P trading account",
      authUrl: "/dashboard/team/credentials?exchange=binance",
    },
    {
      id: "bybit",
      name: "Bybit",
      icon: "🟣",
      description: "Connect your Bybit P2P trading account",
      authUrl: "/dashboard/team/credentials?exchange=bybit",
    },
  ];

  const handleExchangeSetup = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    setIsSetupDialogOpen(true);
  };

  const handleConnectExchange = (authUrl: string) => {
    // Redirect to exchange OAuth with team setup flag
    window.location.href = `${authUrl}&team_id=${teamId}`;
  };

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Trading Credentials
          </CardTitle>
          <CardDescription>
            Only team owners can set up shared trading credentials for the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Contact your team owner to set up shared exchange credentials for
              team trading operations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Trading Credentials
          </CardTitle>
          <CardDescription>
            Set up shared exchange credentials for your team. All team members
            will use your account for trading operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> When you connect an exchange, all team
              members will perform trading operations using your exchange
              account. You maintain full control and can revoke access at any
              time.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Switch
              id="shared-trading"
              checked={sharedTradingEnabled}
              onCheckedChange={setSharedTradingEnabled}
            />
            <Label htmlFor="shared-trading">
              Enable shared trading for team members
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Connections</CardTitle>
          <CardDescription>
            Connect your exchange accounts to enable team trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {exchanges.map((exchange) => (
              <div
                key={exchange.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{exchange.icon}</div>
                  <div>
                    <h3 className="font-semibold">{exchange.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {exchange.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* For now, show all exchanges as available to connect */}
                  {/* TODO: Add exchange connection status to Team model */}
                  <Button
                    variant="outline"
                    onClick={() => handleExchangeSetup(exchange.id)}
                  >
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Member Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Member Permissions
          </CardTitle>
          <CardDescription>
            Configure what team members can do with shared credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="permissions" className="w-full">
            <TabsList>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Create Advertisements</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow members to create new P2P ads
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Manage Orders</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow members to handle order operations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Update Advertisements</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow members to modify existing ads
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Payment Methods</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow members to manage payment methods
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Team activity will appear here once members start using shared
                  credentials
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connect {exchanges.find((e) => e.id === selectedExchange)?.name}
            </DialogTitle>
            <DialogDescription>
              You'll be redirected to{" "}
              {exchanges.find((e) => e.id === selectedExchange)?.name} to
              authorize team access. This will allow your team members to
              perform trading operations using your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>What happens next:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    • You'll authorize our app to access your P2P trading
                    account
                  </li>
                  <li>
                    • Team members can create ads and manage orders using your
                    credentials
                  </li>
                  <li>
                    • All operations are logged and attributed to the performing
                    team member
                  </li>
                  <li>
                    • You can revoke access at any time from your exchange
                    settings
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSetupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const exchange = exchanges.find(
                  (e) => e.id === selectedExchange
                );
                if (exchange) {
                  handleConnectExchange(exchange.authUrl);
                }
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Connect to{" "}
              {exchanges.find((e) => e.id === selectedExchange)?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
