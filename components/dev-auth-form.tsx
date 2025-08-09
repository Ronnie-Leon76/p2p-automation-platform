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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MockAuthService } from "@/lib/auth/mock-auth";
import { AlertCircle, Bot, Code2, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DevAuthFormProps {
  mode: "login" | "signup";
}

export function DevAuthForm({ mode }: DevAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const router = useRouter();
  const mockAuth = MockAuthService.getInstance();

  const handleMockAuth = async (
    exchange: "okx" | "binance" | "bybit",
    userIndex: number = 0
  ) => {
    setIsLoading(true);
    setSelectedExchange(exchange);
    setError("");

    try {
      let user;

      if (mode === "signup") {
        if (!email || !fullName) {
          throw new Error("Email and full name are required for signup");
        }
        user = await mockAuth.mockSignup(email, fullName, exchange);
      } else {
        user = await mockAuth.mockLogin(exchange, userIndex);
      }

      console.log(`🎭 Mock ${mode} successful:`, user);

      // Small delay to simulate real auth
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
      setSelectedExchange(null);
    }
  };

  const exchanges = [
    {
      id: "okx",
      name: "OKX (Real API)",
      description: "Uses your actual OKX credentials from .env",
      logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/okx-logo_udbnjv.png",
      color: "from-blue-500 to-blue-600",
      hasRealCredentials: !!(
        process.env.OKX_API_KEY && process.env.OKX_API_SECRET
      ),
    },
    {
      id: "binance",
      name: "Binance (Mock)",
      description: "Mock Binance trader for testing",
      logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/binance-logo_weqahc.png",
      color: "from-yellow-500 to-yellow-600",
      hasRealCredentials: false,
    },
    {
      id: "bybit",
      name: "Bybit (Mock)",
      description: "Mock Bybit trader for testing",
      logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/bybit-logo_famhwh.png",
      color: "from-orange-500 to-orange-600",
      hasRealCredentials: false,
    },
  ];

  return (
    <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-lg shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center shadow-lg">
            <Code2 className="h-7 w-7 text-green-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          🚧 Development {mode === "login" ? "Login" : "Signup"}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {mode === "login"
            ? "Quick mock login for testing dashboard features"
            : "Create a mock account to test the platform"}
        </CardDescription>

        <Alert className="bg-green-500/10 border-green-500/20 mt-4">
          <Settings className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400 text-sm">
            <strong>Development Mode:</strong> This uses mock authentication. No
            real exchange connections are made.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {mode === "signup" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="trader@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="fullName" className="text-white">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Trader"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-400 text-center mb-4">
            Choose mock exchange to continue
          </p>

          {exchanges.map((exchange) => (
            <Button
              key={exchange.id}
              variant="outline"
              className="w-full h-16 bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300 flex items-center justify-start gap-4 p-4"
              onClick={() => handleMockAuth(exchange.id as any)}
              disabled={isLoading}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <img
                    src={exchange.logo || "/placeholder.svg"}
                    alt={exchange.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling!.textContent =
                        exchange.name.charAt(0);
                    }}
                  />
                  <span className="text-white font-bold text-sm hidden"></span>
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    {exchange.name}
                    {exchange.hasRealCredentials && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        REAL API
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {exchange.description}
                  </div>
                </div>
              </div>
              {isLoading && selectedExchange === exchange.id && (
                <Loader2 className="h-4 w-4 animate-spin text-green-400" />
              )}
            </Button>
          ))}
        </div>

        {/* Quick Login Options for Login Mode */}
        {mode === "login" && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-gray-400 text-center mb-3">
              Quick Mock Users:
            </p>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-300 hover:text-white"
                onClick={() => handleMockAuth("okx", 0)}
                disabled={isLoading}
              >
                🎭 John Trader (OKX) - Real API Credentials
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-300 hover:text-white"
                onClick={() => handleMockAuth("binance", 1)}
                disabled={isLoading}
              >
                🎭 Jane Smith (Binance) - Mock Credentials
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-300 hover:text-white"
                onClick={() => handleMockAuth("bybit", 2)}
                disabled={isLoading}
              >
                🎭 Mike Johnson (Bybit) - Mock Credentials
              </Button>
            </div>
          </div>
        )}

        <div className="text-center text-sm pt-4">
          <span className="text-gray-400">
            {mode === "login"
              ? "Need to create a mock account?"
              : "Already have a mock account?"}
          </span>{" "}
          <Link
            href={mode === "login" ? "/auth/signup" : "/auth/login"}
            className="text-green-400 hover:text-green-300 font-medium"
          >
            {mode === "login" ? "Mock Signup" : "Mock Login"}
          </Link>
        </div>

        <div className="text-center text-xs text-gray-500 pt-2">
          <p className="flex items-center justify-center gap-1">
            <Bot className="h-3 w-3" />
            Development mode - No real accounts created
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
