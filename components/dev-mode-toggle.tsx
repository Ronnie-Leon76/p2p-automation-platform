"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { serviceFactory } from "@/lib/services/service-factory";
import { Activity, Database, RefreshCw, Server } from "lucide-react";
import { useEffect, useState } from "react";

interface HealthStatus {
  mode: "mock" | "live";
  services: {
    ad: boolean;
    team: boolean;
    user: boolean;
  };
  timestamp: string;
}

export function DevModeToggle() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    // Initialize with current mode
    setUseMockData(serviceFactory.isUsingMockData());
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const health = await serviceFactory.healthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = async () => {
    try {
      if (useMockData) {
        await serviceFactory.switchToLiveData();
        setUseMockData(false);
      } else {
        await serviceFactory.switchToMockData();
        setUseMockData(true);
      }
      await checkHealth();
    } catch (error) {
      console.error("Failed to switch mode:", error);
      // If switching to live data fails, fall back to mock
      if (!useMockData) {
        await serviceFactory.switchToMockData();
        setUseMockData(true);
        await checkHealth();
      }
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    const results: any = { success: false, errors: [] };

    try {
      const { adService, teamService, userService } =
        serviceFactory.getServices();

      // Test user service
      try {
        const user = await userService.getCurrentUser();
        results.user = { success: true, data: user };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.user = { success: false, error: errorMessage };
        results.errors.push("User service failed");
      }

      // Test team service
      try {
        const teams = await teamService.getAllTeams();
        results.teams = { success: true, count: teams.length };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.teams = { success: false, error: errorMessage };
        results.errors.push("Team service failed");
      }

      // Test ad service
      try {
        const ads = await adService.getAllAds();
        results.ads = { success: true, count: ads.length };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.ads = { success: false, error: errorMessage };
        results.errors.push("Ad service failed");
      }

      results.success = results.errors.length === 0;
      results.mode = serviceFactory.isUsingMockData() ? "mock" : "live";
      results.timestamp = new Date().toISOString();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.success = false;
      results.errors.push(`General error: ${errorMessage}`);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Development Mode Control</h2>
          <p className="text-gray-600">
            Switch between mock data and live backend testing
          </p>
        </div>
        <Badge variant={useMockData ? "secondary" : "default"}>
          {useMockData ? (
            <>
              <Database className="w-4 h-4 mr-1" />
              Mock Data
            </>
          ) : (
            <>
              <Server className="w-4 h-4 mr-1" />
              Live Backend
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Service Health Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Use Mock Data:</span>
                <Switch
                  checked={useMockData}
                  onCheckedChange={toggleMode}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Check Health
            </Button>
          </div>

          {healthStatus && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      healthStatus.services.ad
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Ad Service {healthStatus.services.ad ? "✓" : "✗"}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      healthStatus.services.team
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Team Service {healthStatus.services.team ? "✓" : "✗"}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      healthStatus.services.user
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    User Service {healthStatus.services.user ? "✓" : "✗"}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-gray-600">
                Last checked:{" "}
                {new Date(healthStatus.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} disabled={isLoading} className="w-full">
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            Run Service Tests
          </Button>

          {testResults && (
            <div className="space-y-3">
              <div
                className={`p-3 rounded border ${
                  testResults.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="font-medium">
                  Test Results ({testResults.mode} mode)
                </div>
                <div className="text-sm text-gray-600">
                  {testResults.success
                    ? "All tests passed!"
                    : `${testResults.errors.length} errors found`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testResults.user && (
                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm">User Service</div>
                    <div
                      className={`text-sm ${
                        testResults.user.success
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {testResults.user.success
                        ? `✓ User: ${
                            testResults.user.data?.full_name || "Unknown"
                          }`
                        : `✗ Error: ${testResults.user.error}`}
                    </div>
                  </div>
                )}

                {testResults.teams && (
                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm">Team Service</div>
                    <div
                      className={`text-sm ${
                        testResults.teams.success
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {testResults.teams.success
                        ? `✓ ${testResults.teams.count} teams found`
                        : `✗ Error: ${testResults.teams.error}`}
                    </div>
                  </div>
                )}

                {testResults.ads && (
                  <div className="p-3 border rounded">
                    <div className="font-medium text-sm">Ad Service</div>
                    <div
                      className={`text-sm ${
                        testResults.ads.success
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {testResults.ads.success
                        ? `✓ ${testResults.ads.count} ads found`
                        : `✗ Error: ${testResults.ads.error}`}
                    </div>
                  </div>
                )}
              </div>

              {testResults.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">Errors:</div>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {testResults.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <div>
            1. <code>npm run dev:db:up</code>
          </div>
          <div>
            2. Update <code>.env.local</code> with Postgres/Better Auth values
          </div>
          <div>
            3. <code>node scripts/dev-helper.js --apply-schema</code>
          </div>
          <div>4. Toggle to "Live Backend" mode above</div>
          <div>5. Run service tests to verify everything works</div>
        </CardContent>
      </Card>
    </div>
  );
}
