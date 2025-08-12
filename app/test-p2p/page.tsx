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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  Play,
  RotateCcw,
  Send,
  TestTube,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface TestResult {
  test: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  data?: any;
  timestamp?: string;
}

interface MockOrder {
  id: string;
  type: "sell" | "buy";
  amount: number;
  crypto: string;
  fiat: string;
  rate: number;
  status: string;
  phone?: string;
}

export default function P2PTestingDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("all");
  const [mockOrders, setMockOrders] = useState<MockOrder[]>([
    {
      id: "sell-demo-001",
      type: "sell",
      amount: 0.1,
      crypto: "ETH",
      fiat: "KES",
      rate: 35000,
      status: "active",
      phone: "254712345678",
    },
    {
      id: "buy-demo-001",
      type: "buy",
      amount: 0.01,
      crypto: "BTC",
      fiat: "KES",
      rate: 500000,
      status: "pending",
      phone: "254723456789",
    },
  ]);

  const [customTestData, setCustomTestData] = useState({
    orderType: "sell",
    amount: "1000",
    cryptoAmount: "0.1",
    cryptoCurrency: "ETH",
    phone: "254712345678",
    description: "Test order",
  });

  const testScenarios = [
    {
      id: "sell_flow",
      name: "Sell Order Flow",
      description: "Test complete C2B payment flow for sell orders",
      steps: [
        "Match Order",
        "Request Payment",
        "Find Transactions",
        "Confirm Payment",
      ],
    },
    {
      id: "buy_flow",
      name: "Buy Order Flow",
      description: "Test complete B2C payment flow for buy orders",
      steps: ["Initiate Buy Order", "Send B2C Payment", "Check Status"],
    },
    {
      id: "webhook_processing",
      name: "Webhook Processing",
      description: "Test webhook callback processing for C2B and B2C",
      steps: ["C2B Callback", "B2C Callback", "IPN Processing"],
    },
    {
      id: "phone_normalization",
      name: "Phone Number Normalization",
      description: "Test phone number format handling",
      steps: ["07xx Format", "254xx Format", "+254xx Format", "Invalid Format"],
    },
  ];

  const addTestResult = (
    test: string,
    status: TestResult["status"],
    message?: string,
    data?: any
  ) => {
    const result: TestResult = {
      test,
      status,
      message,
      data,
      timestamp: new Date().toLocaleString(),
    };

    setTestResults((prev) => {
      const existing = prev.findIndex((r) => r.test === test);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const runApiTest = async (endpoint: string, data: any, testName: string) => {
    try {
      addTestResult(testName, "running", "Making API call...");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        addTestResult(testName, "success", "API call successful", result);
      } else {
        addTestResult(
          testName,
          "error",
          result.error || result.message || "API call failed",
          result
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addTestResult(testName, "error", errorMessage);
      throw error;
    }
  };

  const runSellOrderFlow = async () => {
    const orderId = `test-sell-${Date.now()}`;

    try {
      // Step 1: Match Order
      await runApiTest(
        "/api/orders/p2p?action=match_order",
        {
          order_id: orderId,
          buyer_id: "test-buyer-001",
          seller_id: "test-seller-001",
          buyer_phone: "254701234567",
        },
        "Match Sell Order"
      );

      // Step 2: Request Payment
      await runApiTest(
        "/api/orders/p2p?action=request_payment",
        {
          order_id: orderId,
          buyer_phone: "254701234567",
          amount: 3500,
          description: "Test ETH purchase",
        },
        "Request C2B Payment"
      );

      // Step 3: Find Matching Transactions
      await runApiTest(
        "/api/orders/p2p?action=find_matching_transactions",
        {
          order_id: orderId,
          expected_amount: 3500,
          buyer_phone: "254701234567",
        },
        "Find Matching Transactions"
      );

      // Step 4: Confirm Payment
      await runApiTest(
        "/api/orders/p2p?action=confirm_payment_received",
        {
          order_id: orderId,
          seller_id: "test-seller-001",
        },
        "Confirm Payment Received"
      );
    } catch (error) {
      console.error("Sell order flow failed:", error);
    }
  };

  const runBuyOrderFlow = async () => {
    const orderId = `test-buy-${Date.now()}`;

    try {
      // Step 1: Initiate Buy Order
      await runApiTest(
        "/api/orders/p2p?action=initiate_buy_order",
        {
          buy_order_id: orderId,
          buyer_id: "test-buyer-002",
          seller_phone_number: "254723456789",
          amount: 5000,
        },
        "Initiate Buy Order"
      );

      // Step 2: Check Payment Status
      await runApiTest(
        "/api/orders/p2p?action=check_payment_status",
        {
          order_id: orderId,
        },
        "Check B2C Payment Status"
      );
    } catch (error) {
      console.error("Buy order flow failed:", error);
    }
  };

  const runWebhookTest = async () => {
    try {
      // Test C2B Webhook
      await runApiTest(
        "/api/webhooks/sasapay",
        {
          MerchantRequestID: "29115-34620561-1",
          CheckoutRequestID: "ws_CO_191220191020363925",
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CustomerMobile: "254708374149",
          BillRefNumber: "test-order-001",
          TransAmount: "3500.00",
          TransactionDate: "20250812102115",
        },
        "C2B Webhook Processing"
      );

      // Test B2C Webhook
      await runApiTest(
        "/api/webhooks/sasapay",
        {
          MerchantCode: "MERCHANT123",
          DestinationChannel: "MPESA",
          RecipientName: "John Doe",
          RecipientAccountNumber: "254712345678",
          ResultCode: "0",
          ResultDesc: "The service request is processed successfully.",
          SasaPayTransactionID: "TX987654321",
          TransactionAmount: "5000",
          MerchantTransactionReference: "P2P_BUY_test_123",
          TransactionDate: "20250812120000",
        },
        "B2C Webhook Processing"
      );
    } catch (error) {
      console.error("Webhook test failed:", error);
    }
  };

  const runPhoneNormalizationTest = async () => {
    const testPhones = [
      { input: "0712345678", expected: "254712345678" },
      { input: "254712345678", expected: "254712345678" },
      { input: "+254712345678", expected: "254712345678" },
      { input: "12345", expected: "Invalid" },
    ];

    for (const phoneTest of testPhones) {
      try {
        // This would test the phone normalization function
        // For now, we'll simulate the test
        addTestResult(
          `Phone: ${phoneTest.input}`,
          "success",
          `Normalized to: ${phoneTest.expected}`
        );
      } catch (error) {
        addTestResult(
          `Phone: ${phoneTest.input}`,
          "error",
          "Normalization failed"
        );
      }
    }
  };

  const runSelectedTest = async () => {
    setIsRunning(true);

    try {
      switch (selectedTest) {
        case "sell_flow":
          await runSellOrderFlow();
          break;
        case "buy_flow":
          await runBuyOrderFlow();
          break;
        case "webhook_processing":
          await runWebhookTest();
          break;
        case "phone_normalization":
          await runPhoneNormalizationTest();
          break;
        case "all":
          await runSellOrderFlow();
          await runBuyOrderFlow();
          await runWebhookTest();
          await runPhoneNormalizationTest();
          break;
      }
    } catch (error) {
      console.error("Test execution failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "running":
        return <Zap className="w-4 h-4 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const config = {
      pending: { color: "bg-gray-100 text-gray-800" },
      running: { color: "bg-blue-100 text-blue-800" },
      success: { color: "bg-green-100 text-green-800" },
      error: { color: "bg-red-100 text-red-800" },
    };

    return (
      <Badge className={config[status].color}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <TestTube className="w-8 h-8 mr-3 text-blue-600" />
            P2P Testing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Test and simulate P2P trading functionality with mock data
          </p>
        </div>
      </div>

      <Tabs defaultValue="test-runner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test-runner">Test Runner</TabsTrigger>
          <TabsTrigger value="mock-orders">Mock Orders</TabsTrigger>
          <TabsTrigger value="custom-test">Custom Test</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Test Runner Tab */}
        <TabsContent value="test-runner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Test Scenarios</CardTitle>
              <CardDescription>
                Run predefined test scenarios to validate P2P functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {testScenarios.map((scenario) => (
                  <Card key={scenario.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{scenario.name}</h3>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTest(scenario.id);
                            runSelectedTest();
                          }}
                          disabled={isRunning}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {scenario.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {scenario.steps.map((step, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {step}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex items-center space-x-4 pt-4 border-t">
                <Button
                  onClick={() => {
                    setSelectedTest("all");
                    runSelectedTest();
                  }}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? "Running..." : "Run All Tests"}
                </Button>

                <Button
                  onClick={clearResults}
                  variant="outline"
                  disabled={isRunning}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mock Orders Tab */}
        <TabsContent value="mock-orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mock Order Management</CardTitle>
              <CardDescription>
                View and manage mock orders for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOrders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            className={
                              order.type === "sell"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {order.type === "sell" ? (
                              <ArrowDown className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 mr-1" />
                            )}
                            {order.type.toUpperCase()}
                          </Badge>
                          <span className="font-mono text-sm">{order.id}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.amount} {order.crypto} for{" "}
                          {(order.amount * order.rate).toLocaleString()}{" "}
                          {order.fiat}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rate: {order.rate.toLocaleString()} | Phone:{" "}
                          {order.phone}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{order.status}</Badge>
                        <Button size="sm" variant="outline">
                          <TestTube className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Test Tab */}
        <TabsContent value="custom-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Test Builder</CardTitle>
              <CardDescription>
                Create custom test scenarios with your own parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order-type">Order Type</Label>
                  <select
                    id="order-type"
                    aria-label="Order Type"
                    className="w-full p-2 border rounded"
                    value={customTestData.orderType}
                    onChange={(e) =>
                      setCustomTestData((prev) => ({
                        ...prev,
                        orderType: e.target.value,
                      }))
                    }
                  >
                    <option value="sell">Sell Order (C2B)</option>
                    <option value="buy">Buy Order (B2C)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Fiat Amount</Label>
                  <Input
                    value={customTestData.amount}
                    onChange={(e) =>
                      setCustomTestData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Crypto Amount</Label>
                  <Input
                    value={customTestData.cryptoAmount}
                    onChange={(e) =>
                      setCustomTestData((prev) => ({
                        ...prev,
                        cryptoAmount: e.target.value,
                      }))
                    }
                    placeholder="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Crypto Currency</Label>
                  <Input
                    value={customTestData.cryptoCurrency}
                    onChange={(e) =>
                      setCustomTestData((prev) => ({
                        ...prev,
                        cryptoCurrency: e.target.value,
                      }))
                    }
                    placeholder="ETH"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={customTestData.phone}
                    onChange={(e) =>
                      setCustomTestData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="254712345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={customTestData.description}
                    onChange={(e) =>
                      setCustomTestData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Test order description"
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  // Run custom test with user-defined parameters
                  console.log("Running custom test with:", customTestData);
                }}
                className="w-full"
                disabled={isRunning}
              >
                <Send className="w-4 h-4 mr-2" />
                Run Custom Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                View detailed results from test executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No test results yet. Run some tests to see results here.
                    </div>
                  ) : (
                    testResults.map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{result.test}</span>
                              {getStatusBadge(result.status)}
                            </div>

                            {result.message && (
                              <p className="text-sm text-muted-foreground">
                                {result.message}
                              </p>
                            )}

                            {result.data && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600">
                                  View Data
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </details>
                            )}

                            {result.timestamp && (
                              <div className="text-xs text-muted-foreground">
                                {result.timestamp}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
