"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  AlertCircle,
  Download,
  Wallet,
  Key,
  Shield,
  ExternalLink,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react"

interface ExchangeSetupProps {
  exchange: "okx" | "binance" | "bybit"
  onComplete: (data: {
    exchange: string
    address?: string
    signature?: string
    apiKey: string
    apiSecret: string
    passphrase?: string
    accessToken?: string
    refreshToken?: string
  }) => void
}

const EXCHANGE_CONFIGS = {
  okx: {
    name: "OKX",
    color: "from-blue-500 to-blue-600",
    authType: "wallet", // Uses wallet extension
    walletExtension: "OKX Wallet",
    extensionUrl: "https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge",
    apiUrl: "https://www.okx.com/account/my-api",
    hasPassphrase: true,
    permissions: ["Read account information", "P2P trading permissions", "Order management"],
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/okx-logo_udbnjv.png",
  },
  binance: {
    name: "Binance",
    color: "from-yellow-400 to-yellow-500",
    authType: "oauth", // Uses OAuth2
    oauthUrl: "https://accounts.binance.com/oauth/authorize",
    apiUrl: "https://www.binance.com/en/my/settings/api-management",
    hasPassphrase: false,
    permissions: ["Read account information", "P2P trading", "Spot trading"],
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/binance-logo_weqahc.png",
  },
  bybit: {
    name: "Bybit",
    color: "from-orange-500 to-orange-600",
    authType: "oauth", // Uses OAuth2
    oauthUrl: "https://api.bybit.com/oauth/authorize",
    apiUrl: "https://www.bybit.com/app/user/api-management",
    hasPassphrase: false,
    permissions: ["Read account information", "P2P trading", "Derivatives trading"],
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/bybit-logo_famhwh.png",
  },
}

export function ExchangeWalletSetup({ exchange, onComplete }: ExchangeSetupProps) {
  const config = EXCHANGE_CONFIGS[exchange]
  const [currentStep, setCurrentStep] = useState(1)
  const [authMethod, setAuthMethod] = useState<"wallet" | "oauth" | "api">("wallet")

  // Wallet-specific state
  const [walletInstalled, setWalletInstalled] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [signature, setSignature] = useState("")

  // OAuth-specific state
  const [oauthCompleted, setOauthCompleted] = useState(false)
  const [accessToken, setAccessToken] = useState("")
  const [refreshToken, setRefreshToken] = useState("")

  // API credentials state
  const [apiCredentials, setApiCredentials] = useState({
    apiKey: "",
    apiSecret: "",
    passphrase: "",
  })
  const [showSecrets, setShowSecrets] = useState({
    apiSecret: false,
    passphrase: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [permissionsVerified, setPermissionsVerified] = useState(false)

  // Check wallet installation for OKX
  useEffect(() => {
    if (exchange === "okx") {
      const checkWallet = () => {
        if (typeof window !== "undefined") {
          const isInstalled = !!(window as any).okxwallet || !!(window as any).ethereum?.isOkxWallet
          setWalletInstalled(isInstalled)
          if (isInstalled && currentStep === 1 && authMethod === "wallet") {
            setCurrentStep(2)
          }
        }
      }

      checkWallet()
      const interval = setInterval(checkWallet, 2000)
      return () => clearInterval(interval)
    }
  }, [exchange, currentStep, authMethod])

  // Initialize auth method based on exchange
  useEffect(() => {
    if (exchange === "okx") {
      setAuthMethod("wallet")
    } else {
      setAuthMethod("oauth")
      setCurrentStep(2) // Skip wallet installation for OAuth exchanges
    }
  }, [exchange])

  const connectWallet = async () => {
    setIsLoading(true)
    setError("")

    try {
      const okxWallet = (window as any).okxwallet || (window as any).ethereum

      if (!okxWallet) {
        throw new Error("OKX Wallet not found")
      }

      const accounts = await okxWallet.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      const address = accounts[0]
      setWalletAddress(address)

      const message = `Sign this message to authenticate with P2P Automation Platform.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`

      const sig = await okxWallet.request({
        method: "personal_sign",
        params: [message, address],
      })

      setSignature(sig)
      setWalletConnected(true)
      setCurrentStep(3)
    } catch (error: any) {
      setError(error.message || "Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const initiateOAuth = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/auth/${exchange}/authorize`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth")
      }

      // This will redirect to the exchange OAuth page
      window.location.href = response.url
    } catch (error: any) {
      setError(error.message || "Failed to start OAuth flow")
      setIsLoading(false)
    }
  }

  const verifyApiCredentials = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/${exchange}/verify-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiCredentials.apiKey,
          apiSecret: apiCredentials.apiSecret,
          passphrase: config.hasPassphrase ? apiCredentials.passphrase : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify credentials")
      }

      if (!result.hasP2PPermissions) {
        throw new Error(
          `API key does not have P2P trading permissions. Please enable P2P permissions in your ${config.name} API settings.`,
        )
      }

      setPermissionsVerified(true)
      setCurrentStep(4)
    } catch (error: any) {
      setError(error.message || "Failed to verify API credentials")
    } finally {
      setIsLoading(false)
    }
  }

  const completeSetup = () => {
    const setupData: any = {
      exchange,
      apiKey: apiCredentials.apiKey,
      apiSecret: apiCredentials.apiSecret,
    }

    if (config.hasPassphrase) {
      setupData.passphrase = apiCredentials.passphrase
    }

    if (authMethod === "wallet") {
      setupData.address = walletAddress
      setupData.signature = signature
    } else if (authMethod === "oauth") {
      setupData.accessToken = accessToken
      setupData.refreshToken = refreshToken
    }

    onComplete(setupData)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getSteps = () => {
    const baseSteps = [
      {
        number: 1,
        title: exchange === "okx" ? "Install OKX Wallet" : "OAuth Authentication",
        description:
          exchange === "okx"
            ? "Download and install the OKX Wallet browser extension"
            : `Authenticate with ${config.name} OAuth`,
        completed: exchange === "okx" ? walletInstalled : oauthCompleted,
        show: exchange === "okx" || authMethod === "oauth",
      },
      {
        number: 2,
        title: exchange === "okx" ? "Connect Wallet" : "API Credentials",
        description:
          exchange === "okx" ? "Connect your OKX Wallet to the application" : `Provide your ${config.name} API keys`,
        completed: exchange === "okx" ? walletConnected : false,
        show: true,
      },
      {
        number: 3,
        title: "API Credentials",
        description: `Provide your ${config.name} API keys for trading operations`,
        completed: permissionsVerified,
        show: true,
      },
      {
        number: 4,
        title: "Complete Setup",
        description: "Finalize your account setup",
        completed: false,
        show: true,
      },
    ]

    return baseSteps
      .filter((step) => step.show)
      .map((step, index) => ({
        ...step,
        number: index + 1,
      }))
  }

  const steps = getSteps()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Exchange Header */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center`}>
              <img
                src={config.logo || "/placeholder.svg"}
                alt={config.name}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling!.textContent = config.name.charAt(0)
                }}
              />
              <span className="text-white font-bold text-lg hidden"></span>
            </div>
            <div>
              <CardTitle className="text-white">{config.name} Account Setup</CardTitle>
              <CardDescription className="text-gray-300">
                Connect your {config.name} account for P2P trading automation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Setup Progress</CardTitle>
          <CardDescription className="text-gray-300">
            Complete these steps to connect your {config.name} account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : currentStep === step.number
                        ? `bg-gradient-to-r ${config.color} text-white`
                        : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${step.completed ? "text-green-400" : "text-white"}`}>{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
                {step.completed && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    Complete
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Authentication Method Selection for OKX */}
      {exchange === "okx" && currentStep === 1 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Choose Authentication Method</CardTitle>
            <CardDescription className="text-gray-300">Select how you'd like to authenticate with OKX</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as "wallet" | "api")}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="wallet" className="data-[state=active]:bg-blue-600">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Extension
                </TabsTrigger>
                <TabsTrigger value="api" className="data-[state=active]:bg-blue-600">
                  <Key className="w-4 h-4 mr-2" />
                  API Keys Only
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wallet" className="space-y-4 mt-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">Recommended: OKX Wallet Extension</h4>
                  <p className="text-gray-300 text-sm">
                    Use the official OKX Wallet browser extension for secure Web3 authentication. This provides the best
                    security and user experience.
                  </p>
                </div>
                <Button className="w-full" onClick={() => setCurrentStep(2)} disabled={!walletInstalled}>
                  {walletInstalled ? "Continue with Wallet" : "Install Wallet First"}
                </Button>
              </TabsContent>

              <TabsContent value="api" className="space-y-4 mt-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-medium mb-2">API Keys Only</h4>
                  <p className="text-gray-300 text-sm">
                    Skip wallet connection and use only API keys. Less secure but works without browser extension.
                  </p>
                </div>
                <Button className="w-full" onClick={() => setCurrentStep(3)}>
                  Continue with API Keys
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Install Wallet (OKX only) */}
      {exchange === "okx" && currentStep === 1 && authMethod === "wallet" && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="w-5 h-5" />
              Install OKX Wallet Extension
            </CardTitle>
            <CardDescription className="text-gray-300">
              You need the OKX Wallet browser extension to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Why do I need OKX Wallet?</h4>
              <p className="text-gray-300 text-sm">
                OKX uses Web3 wallet authentication for enhanced security. The wallet extension provides secure
                authentication and allows us to verify your identity cryptographically.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">Installation Steps:</h4>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span
                    className={`bg-gradient-to-r ${config.color} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5`}
                  >
                    1
                  </span>
                  Click the "Download OKX Wallet" button below
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className={`bg-gradient-to-r ${config.color} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5`}
                  >
                    2
                  </span>
                  Install the extension from the Chrome Web Store
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className={`bg-gradient-to-r ${config.color} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5`}
                  >
                    3
                  </span>
                  Create or import your wallet
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className={`bg-gradient-to-r ${config.color} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5`}
                  >
                    4
                  </span>
                  Return to this page to continue
                </li>
              </ol>
            </div>

            <Button
              className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              onClick={() => {
                if ('extensionUrl' in config) {
                  window.open(config.extensionUrl, "_blank")
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Download OKX Wallet Extension
            </Button>

            <p className="text-xs text-gray-400 text-center">
              After installation, this page will automatically detect the wallet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: OAuth Authentication (Binance/Bybit) */}
      {(exchange === "binance" || exchange === "bybit") && currentStep === 2 && !oauthCompleted && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {config.name} OAuth Authentication
            </CardTitle>
            <CardDescription className="text-gray-300">
              Authenticate with your {config.name} account using OAuth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`bg-gradient-to-r ${config.color} bg-opacity-10 border border-opacity-20 rounded-lg p-4`}>
              <h4 className="text-white font-medium mb-2">Secure OAuth Authentication</h4>
              <p className="text-gray-300 text-sm">
                You'll be redirected to {config.name}'s secure login page to authorize our application. We only request
                permissions for P2P trading operations.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">What happens next?</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Redirect to {config.name} login page
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Login with your {config.name} credentials
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Authorize P2P trading permissions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Return to complete setup
                </li>
              </ul>
            </div>

            <Button
              className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              onClick={initiateOAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continue with {config.name} OAuth
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Connect Wallet (OKX only) */}
      {exchange === "okx" && currentStep === 2 && authMethod === "wallet" && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect Your OKX Wallet
            </CardTitle>
            <CardDescription className="text-gray-300">
              Connect your wallet to authenticate with the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">OKX Wallet Detected</span>
              </div>
              <p className="text-gray-300 text-sm">
                Great! We found your OKX Wallet extension. Click connect to proceed.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">What happens when you connect?</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Your wallet address will be used for authentication
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  You'll sign a message to verify ownership
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  No transactions or fees required
                </li>
              </ul>
            </div>

            <Button
              className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              onClick={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect OKX Wallet
                </>
              )}
            </Button>

            {walletAddress && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Connected Address:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(walletAddress)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-white font-mono text-sm break-all">{walletAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: API Credentials */}
      {currentStep === 3 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              {config.name} API Credentials
            </CardTitle>
            <CardDescription className="text-gray-300">
              Provide your {config.name} API keys to enable P2P trading operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2">How to get your API keys:</h4>
              <ol className="space-y-1 text-gray-300 text-sm">
                <li>1. Go to {config.name} → Account → API Management</li>
                <li>2. Create a new API key with P2P trading permissions</li>
                <li>3. Copy the API Key, Secret Key{config.hasPassphrase ? ", and Passphrase" : ""}</li>
                <li>4. Paste them in the form below</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                onClick={() => window.open(config.apiUrl, "_blank")}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open {config.name} API Settings
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-white">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder={`Enter your ${config.name} API Key`}
                  value={apiCredentials.apiKey}
                  onChange={(e) => setApiCredentials((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret" className="text-white">
                  Secret Key
                </Label>
                <div className="relative">
                  <Input
                    id="apiSecret"
                    type={showSecrets.apiSecret ? "text" : "password"}
                    placeholder={`Enter your ${config.name} Secret Key`}
                    value={apiCredentials.apiSecret}
                    onChange={(e) => setApiCredentials((prev) => ({ ...prev, apiSecret: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowSecrets((prev) => ({ ...prev, apiSecret: !prev.apiSecret }))}
                  >
                    {showSecrets.apiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {config.hasPassphrase && (
                <div className="space-y-2">
                  <Label htmlFor="passphrase" className="text-white">
                    Passphrase
                  </Label>
                  <div className="relative">
                    <Input
                      id="passphrase"
                      type={showSecrets.passphrase ? "text" : "password"}
                      placeholder={`Enter your ${config.name} Passphrase`}
                      value={apiCredentials.passphrase}
                      onChange={(e) => setApiCredentials((prev) => ({ ...prev, passphrase: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowSecrets((prev) => ({ ...prev, passphrase: !prev.passphrase }))}
                    >
                      {showSecrets.passphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Required Permissions:</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                {config.permissions.map((permission, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-red-400" />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              onClick={verifyApiCredentials}
              disabled={
                isLoading ||
                !apiCredentials.apiKey ||
                !apiCredentials.apiSecret ||
                (config.hasPassphrase && !apiCredentials.passphrase)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify API Credentials
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete Setup */}
      {currentStep === 4 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Setup Complete!
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your {config.name} account has been successfully connected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-3">✅ Verification Complete</h4>
              <div className="space-y-2 text-sm">
                {authMethod === "wallet" && walletAddress && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Wallet Connected:</span>
                    <span className="text-green-400 font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">API Credentials:</span>
                  <span className="text-green-400">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">P2P Permissions:</span>
                  <span className="text-green-400">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Exchange:</span>
                  <span className="text-green-400">{config.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">What's Next?</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Access your P2P automation dashboard</li>
                <li>• Create and manage trading advertisements</li>
                <li>• Monitor orders and transactions</li>
                <li>• Set up team collaboration features</li>
              </ul>
            </div>

            <Button
              className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              onClick={completeSetup}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Setup & Continue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}