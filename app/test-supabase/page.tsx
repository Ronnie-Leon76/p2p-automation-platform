"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  testSupabaseCRUD,
  testSupabaseConnection,
} from "@/lib/services/test-supabase";
import { useState } from "react";

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const runCRUDTest = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Override console.log to capture output
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      addLog(args.join(" "));
      originalLog(...args);
    };

    console.error = (...args) => {
      addLog(`ERROR: ${args.join(" ")}`);
      originalError(...args);
    };

    try {
      addLog("🚀 Starting Supabase CRUD test...");
      const success = await testSupabaseCRUD();

      if (success) {
        addLog("✅ All tests passed successfully!");
      } else {
        addLog("❌ Some tests failed");
      }
    } catch (error) {
      addLog(`❌ Test failed with error: ${error}`);
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      setIsLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      addLog("🏥 Running health check...");
      const health = await testSupabaseConnection();

      if (health) {
        addLog(`✅ Health check passed. Mode: ${health.mode}`);
        addLog(
          `Services status: Ad=${health.services.ad}, Team=${health.services.team}, User=${health.services.user}`
        );
      } else {
        addLog("❌ Health check failed");
      }
    } catch (error) {
      addLog(`❌ Health check failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase CRUD Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={runHealthCheck}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? "Running..." : "Health Check"}
            </Button>

            <Button onClick={runCRUDTest} disabled={isLoading}>
              {isLoading ? "Running..." : "Run CRUD Test"}
            </Button>
          </div>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Current Environment:</strong>{" "}
              {process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false"
                ? "Live Supabase"
                : "Mock Data"}
            </p>
            <p>
              <strong>Supabase URL:</strong>{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
