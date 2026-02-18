import type {
  AddPaymentMethodParams,
  AddPaymentMethodResponse,
  BalanceResponse,
  CancelAdResponse,
  CancelOrderResponse,
  CreateAdParams,
  CreateAdResponse,
  CreateOrderParams,
  CreateOrderResponse,
  DeletePaymentMethodResponse,
  EstimatedPriceParams,
  EstimatedPriceResponse,
  GetActiveAdsParams,
  GetActiveAdsResponse,
  GetAdResponse,
  GetMarketplaceAdsParams,
  GetMarketplaceAdsResponse,
  GetOrderResponse,
  GetOrdersParams,
  GetOrdersResponse,
  MarkAsPaidParams,
  MarkAsPaidResponse,
  MerchantProfileResponse,
  OptimalPriceResponse,
  P2PExchange,
  PaymentMethodsResponse,
  ReleaseCryptoParams,
  ReleaseCryptoResponse,
  UpdateAdParams,
  UpdateAdResponse,
  UpdateAdStatusResponse,
  UpdatePaymentMethodParams,
  UpdatePaymentMethodResponse,
  UserInfoResponse,
} from "./base-exchange"

export class OKXExchange implements P2PExchange {
  name = "OKX"
  isConnected = false
  private apiKey: string
  private apiSecret: string
  private passphrase: string
  private baseUrl = "https://www.okx.com"

  constructor(apiKey: string, apiSecret: string, passphrase: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.passphrase = passphrase
    this.isConnected = !!(apiKey && apiSecret && passphrase)
  }

  private async makeRequest(endpoint: string, method: "GET" | "POST" = "GET", data?: any) {
    const crypto = require('crypto')
    const url = `${this.baseUrl}${endpoint}`
    
    // Create ISO timestamp
    const timestamp = new Date().toISOString()
    
    // Create request body
    const body = data ? JSON.stringify(data) : ""
    
    // Create signature string: timestamp + method + endpoint + body
    const signatureString = timestamp + method + endpoint + body
    
    // Create HMAC SHA256 signature
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureString)
      .digest('base64')

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": this.apiKey,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": this.passphrase,
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("OKX API Error:", response.status, errorText)
        
        // Try to parse OKX error response
        let okxError = null
        try {
          okxError = JSON.parse(errorText)
        } catch (e) {
          // If parsing fails, use raw error text
        }
        
        // Handle specific OKX error codes
        if (okxError && okxError.code) {
          switch (okxError.code) {
            case 55723:
              throw new Error(`OKX_PERMISSION_ERROR: Your account doesn't have permission to create P2P ads. This may be due to: insufficient account verification level, regional restrictions, or API key permissions. Please check your OKX account settings and ensure your API key has P2P trading permissions.`)
            case 55800:
              throw new Error(`OKX_PARAMETER_ERROR: ${okxError.msg || 'Invalid parameters provided'}`)
            case 50026:
              throw new Error(`OKX_SYSTEM_ERROR: ${okxError.msg || 'System maintenance or temporary unavailability'}`)
            default:
              throw new Error(`OKX_API_ERROR_${okxError.code}: ${okxError.msg || 'Unknown OKX API error'}`)
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("OKX API request failed:", error)
      throw error
    }
  }

  async createAd(params: CreateAdParams): Promise<CreateAdResponse> {
    try {
      // Check if we have all required parameters
      if (!params.side || !params.cryptoCurrency || !params.fiatCurrency || !params.cryptoAmount) {
        return {
          adId: "",
          success: false,
          error: "Missing required parameters: side, cryptoCurrency, fiatCurrency, cryptoAmount"
        }
      }

      console.log("Creating OKX P2P ad with parameters:", params)
      
      // Prepare the request body according to the correct OKX API documentation
      const requestBody: any = {
        side: params.side, // "buy" or "sell"
        cryptoCurrency: params.cryptoCurrency, // e.g. "USDT", "BTC"
        fiatCurrency: params.fiatCurrency, // e.g. "KES", "USD"
        cryptoAmount: params.cryptoAmount, // Amount of crypto to list
        minOrderLimit: params.minOrderLimit, // Minimum order size
        maxOrderLimit: params.maxOrderLimit, // Maximum order size
        type: params.type, // "limit" | "floating_market"
      }

      // Add price information based on price type
      if (params.type === "limit" && params.unitPrice) {
        requestBody.unitPrice = params.unitPrice
      } else if (params.type === "floating_market" && params.priceMargin) {
        requestBody.priceMargin = params.priceMargin
      }

      // Add optional parameters
      if (params.paymentMethods && params.paymentMethods.length > 0) {
        requestBody.paymentMethods = params.paymentMethods
      }

      if (params.paymentMethodIds && params.paymentMethodIds.length > 0) {
        requestBody.paymentMethodIds = params.paymentMethodIds
      }

      // Only add allowed optional fields based on OKX API error message
      // Allowed fields: [quoteAmountPerOrder, completedOrderQuantity, minSellOrderQuantity, 
      // minCompletionRate, unpaidOrderTimeoutMinutes, maxUserCreatedDate, userType, 
      // verificationAdsAllowed, whitelistTakerRegionEnabled, automatedMessage, remark, unenterMarket]
      
      if (params.minCompletionRate && params.minCompletionRate !== "0") {
        requestBody.minCompletionRate = params.minCompletionRate
      }

      if (params.remark && params.remark.trim() !== "" && params.remark !== "n") {
        requestBody.remark = params.remark
      }

      if (params.automatedMessage && params.automatedMessage.trim() !== "" && params.automatedMessage !== "n") {
        requestBody.automatedMessage = params.automatedMessage
      }

      // Map targetGroup to userType (allowed field)
      if (params.targetGroup && params.targetGroup !== "all") {
        requestBody.userType = params.targetGroup
      }

      console.log("OKX API request body:", requestBody)

      // Make the API request to create the ad
      const response = await this.makeRequest("/api/v5/p2p/ad/create", "POST", requestBody)
      
      console.log("OKX create ad response:", response)

      // Check if the request was successful
      if (response.code === "0" && response.data) {
        return {
          adId: response.data[0]?.adId || response.data.adId,
          success: true,
        }
      } else {
        return {
          adId: "",
          success: false,
          error: response.msg || "Failed to create ad",
        }
      }
    } catch (error) {
      console.error("Error in createAd:", error)
      
      // Provide more specific error messages based on common issues
      let errorMessage = error instanceof Error ? error.message : "Unknown error"
      
      if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        errorMessage = "❌ OKX API endpoint not found. Please verify your API credentials have P2P trading permissions."
      } else if (errorMessage.includes("55723")) {
        errorMessage = "❌ OKX API error 55723: This might indicate insufficient permissions, incorrect endpoint, or rate limiting. Please verify your API keys have P2P trading permissions enabled."
      } else if (errorMessage.includes("50026")) {
        errorMessage = "❌ OKX API error 50026: Invalid request format. Please check the parameter structure."
      } else if (errorMessage.includes("50001")) {
        errorMessage = "❌ OKX API error 50001: Parameter error. Please check all required parameters are provided correctly."
      }
      
      return {
        adId: "",
        success: false,
        error: errorMessage,
      }
    }
  }

  async updateAd(adId: string, params: UpdateAdParams): Promise<UpdateAdResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/ad/update", "POST", { adId, ...params })
      return {
        oldAdId: response.data?.oldAdId,
        newAdId: response.data?.newAdId,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async cancelAd(adId: string): Promise<CancelAdResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/ad/cancel", "POST", { adId })
      return {
        adId: response.data?.adId || adId,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        adId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getAd(adId: string): Promise<GetAdResponse> {
    const response = await this.makeRequest(`/api/v5/p2p/ad?adId=${adId}`)
    const data = response.data?.[0]

    return {
      adId: data?.adId || "",
      side: data?.side || "",
      cryptoCurrency: data?.cryptoCurrency || "",
      fiatCurrency: data?.fiatCurrency || "",
      unitPrice: data?.unitPrice || "",
      availableAmount: data?.availableAmount || "",
      minOrderSize: data?.minOrderSize || "",
      maxOrderSize: data?.maxOrderSize || "",
      creator: {
        userId: data?.creator?.id || "",
        nickName: data?.creator?.nickName || "",
        completionRate: data?.creator?.completionRate || "",
        completedOrders: data?.creator?.completedOrders || "",
        kycLevel: data?.creator?.kycLevel || "",
      },
      paymentMethods: data?.paymentMethods || [],
      status: data?.status || "",
      createdTimestamp: data?.createdTimestamp || "",
    }
  }

  async getActiveAds(params: GetActiveAdsParams): Promise<GetActiveAdsResponse> {
    // required params: side:String, cryptoCurrency:String, fiatCurrency:String
    const { side, cryptoCurrency, fiatCurrency } = params
    if (!side || !cryptoCurrency || !fiatCurrency) {
      throw new Error("Missing required parameters")
    }
    const queryParams = new URLSearchParams(params as any).toString()
    console.log("🔍 OKX getActiveAds request URL:", `/api/v5/p2p/ad/active-list?${queryParams}`)
    
    const response = await this.makeRequest(`/api/v5/p2p/ad/active-list?${queryParams}`)
    console.log("📦 Raw OKX API response:", response)
    console.log("📊 Response data type:", typeof response)
    console.log("📊 Response keys:", Object.keys(response || {}))
    console.log("📊 Response.data:", response?.data)
    console.log("📊 Response.data type:", typeof response?.data)
    console.log("📊 Response.data length:", Array.isArray(response?.data) ? response.data.length : "not array")

    const ads = (response.data || []).map((ad: any) => ({
      adId: ad.adId,
      side: ad.side,
      cryptoCurrency: ad.cryptoCurrency,
      fiatCurrency: ad.fiatCurrency,
      unitPrice: ad.unitPrice,
      availableAmount: ad.availableAmount,
      minOrderSize: ad.minOrderSize,
      maxOrderSize: ad.maxOrderSize,
      creator: {
        userId: ad.creator?.userId || "",
        nickName: ad.creator?.nickName || "",
        completionRate: ad.creator?.completionRate || "",
        completedOrders: ad.creator?.completedOrders || "",
        kycLevel: ad.creator?.kycLevel || "",
      },
      paymentMethods: ad.paymentMethods || [],
      status: ad.status,
      createdTimestamp: ad.createdTimestamp,
    }))

    console.log("📊 Mapped ads:", ads)
    console.log("📊 Mapped ads length:", ads.length)

    return { ads }
  }

  // Get user's own ads (different from marketplace ads)
  async getUserAds(): Promise<GetActiveAdsResponse> {
    console.log("🔍 Getting user's own ads...")

    try {
      // Attempt to retrieve user info first so we can pass required params where needed
      let resolvedUserId: string | null = null
      try {
        const info = await this.getUserInfo()
        // OKX user info shape may vary
        resolvedUserId = (info as any)?.userId || (info as any)?.id || null
      } catch (err) {
        // Non-fatal: continue without userId if we can't get user info
        resolvedUserId = null
      }

      // Try different possible endpoints for user's own ads. For endpoints that need a userId
      // we only call them when we have one to avoid 52900 (missing userId) errors.
      const possibleEndpointFns: Array<() => string | null> = [
        () => '/api/v5/p2p/ad/my-list',     // Common pattern for user's own ads
        () => '/api/v5/p2p/ad/list',        // Alternative pattern
        () => resolvedUserId ? `/api/v5/p2p/merchant/ads?userId=${encodeURIComponent(resolvedUserId)}` : null,
        () => '/api/v5/p2p/ads/own',        // Alternative own ads endpoint
      ]

      for (const epFn of possibleEndpointFns) {
        const endpoint = epFn()
        if (!endpoint) continue

        try {
          console.log(`🧪 Trying endpoint: ${endpoint}`)
          const response = await this.makeRequest(endpoint)

          // Only log lightweight info to avoid huge error blobs in logs
          if (response && response.data) {
            const ads = (response.data || []).map((ad: any) => ({
              adId: ad.adId,
              side: ad.side,
              cryptoCurrency: ad.cryptoCurrency,
              fiatCurrency: ad.fiatCurrency,
              unitPrice: ad.unitPrice,
              availableAmount: ad.availableAmount,
              minOrderSize: ad.minOrderSize,
              maxOrderSize: ad.maxOrderSize,
              creator: {
                userId: ad.creator?.userId || "",
                nickName: ad.creator?.nickName || "",
                completionRate: ad.creator?.completionRate || "",
                completedOrders: ad.creator?.completedOrders || "",
                kycLevel: ad.creator?.kycLevel || "",
              },
              paymentMethods: ad.paymentMethods || [],
              status: ad.status,
              createdTimestamp: ad.createdTimestamp,
            }))

            console.log(`✅ Found ${ads.length} user ads from ${endpoint}`)
            return { ads }
          }
        } catch (error) {
          // Keep logs concise and continue trying other endpoints. Many accounts/regions
          // don't expose every historical OKX endpoint and will return 404/400; treat
          // those as non-fatal and try fallbacks.
          const msg = error instanceof Error ? error.message : String(error)
          console.log(`❌ Endpoint ${endpoint} failed: ${msg}`)
          continue
        }
      }

      // If no dedicated endpoint works, fall back to empty result
      console.log("⚠️ No working endpoint found for user's own ads, returning empty result")
      return { ads: [] }

    } catch (error) {
      console.error("❌ Error getting user ads:", error)
      return { ads: [] }
    }
  }

  async getMarketplaceAds(params: GetMarketplaceAdsParams): Promise<GetMarketplaceAdsResponse> {
    const queryParams = new URLSearchParams(params as any).toString()
    const response = await this.makeRequest(`/api/v5/p2p/ad/marketplace-list?${queryParams}`)

    const mapAds = (ads: any[]) =>
      ads.map((ad: any) => ({
        adId: ad.adId,
        side: ad.side,
        cryptoCurrency: ad.cryptoCurrency,
        fiatCurrency: ad.fiatCurrency,
        unitPrice: ad.unitPrice,
        availableAmount: ad.availableAmount,
        minOrderSize: ad.minOrderSize,
        maxOrderSize: ad.maxOrderSize,
        creator: {
          userId: ad.creator?.userId || "",
          nickName: ad.creator?.nickName || "",
          completionRate: ad.creator?.completionRate || "",
          completedOrders: ad.creator?.completedOrders || "",
          kycLevel: ad.creator?.kycLevel || "",
        },
        paymentMethods: ad.paymentMethods || [],
        status: ad.status || "",
        createdTimestamp: ad.createdTimestamp || "",
      }))

    return {
      buyAds: mapAds(response.data?.[0]?.buyAds || []),
      sellAds: mapAds(response.data?.[0]?.sellAds || []),
    }
  }

  async updateAdStatus(adId: string, status: "hidden" | "show"): Promise<UpdateAdStatusResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/ad/update-active-status", "POST", { adId, status })
      return {
        adId: response.data?.adId || adId,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        adId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/order/create", "POST", params)
      return {
        orderId: response.data?.orderId || "",
        status: response.data?.status || "",
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        orderId: "",
        status: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getOrder(orderId: string): Promise<GetOrderResponse> {
    const response = await this.makeRequest(`/api/v5/p2p/order?orderId=${orderId}`)
    const data = response.data?.[0]

    return {
      orderId: data?.orderId || "",
      side: data?.side || "",
      cryptoCurrency: data?.cryptoCurrency || "",
      fiatCurrency: data?.fiatCurrency || "",
      cryptoAmount: data?.cryptoAmount || "",
      fiatAmount: data?.fiatAmount || "",
      unitPrice: data?.unitPrice || "",
      orderStatus: data?.orderStatus || "",
      paymentStatus: data?.paymentStatus || "",
      createdTimestamp: data?.createdTimestamp || "",
      counterpartyDetail: {
        userId: data?.counterpartyDetail?.userId || "",
        nickName: data?.counterpartyDetail?.nickName || "",
        completionRate: data?.counterpartyDetail?.completionRate || "",
      },
    }
  }

  async getOrders(params: GetOrdersParams): Promise<GetOrdersResponse> {
    const queryParams = new URLSearchParams(params as any).toString()
    const response = await this.makeRequest(`/api/v5/p2p/order/list?${queryParams}`)

    const orders = (response.data || []).map((order: any) => ({
      orderId: order.orderId,
      side: order.side,
      cryptoCurrency: order.cryptoCurrency,
      fiatCurrency: order.fiatCurrency,
      cryptoAmount: order.cryptoAmount,
      fiatAmount: order.fiatAmount,
      unitPrice: order.unitPrice,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdTimestamp: order.createdTimestamp,
      counterpartyDetail: {
        userId: order.counterpartyDetail?.userId || "",
        nickName: order.counterpartyDetail?.nickName || "",
        completionRate: order.counterpartyDetail?.completionRate || "",
      },
    }))

    return { orders }
  }

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/order/cancel", "POST", {
        orderId,
        verificationType: "2",
      })
      return {
        orderId: response.data?.orderId || orderId,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        orderId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async markOrderAsPaid(orderId: string, params?: MarkAsPaidParams): Promise<MarkAsPaidResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/order/mark-as-paid", "POST", {
        orderId,
        ...params,
      })
      return {
        orderId: response.data?.orderId || orderId,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        orderId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async releaseCrypto(orderId: string, params?: ReleaseCryptoParams): Promise<ReleaseCryptoResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/order/release-crypto", "POST", {
        orderId,
        verificationType: "2",
        ...params,
      })
      return {
        orderId: response.data?.orderId || orderId,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        orderId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getOptimalPrice(cryptoCurrency: string, fiatCurrency: string): Promise<OptimalPriceResponse> {
    const response = await this.makeRequest(
      `/api/v5/p2p/ad/optimal-price?cryptoCurrency=${cryptoCurrency}&fiatCurrency=${fiatCurrency}`,
    )
    const data = response.data?.[0]

    return {
      currentHighestBuyAdPrice: data?.currentHighestBuyAdPrice || "",
      currentLowestSellAdPrice: data?.currentLowestSellAdPrice || "",
    }
  }

  async getEstimatedPrice(params: EstimatedPriceParams): Promise<EstimatedPriceResponse> {
    const queryParams = new URLSearchParams(params as any).toString()
    const response = await this.makeRequest(`/api/v5/p2p/p2p-ticker/estimated-price?${queryParams}`)

    return {
      price: response.data?.[0]?.price || "",
    }
  }

  async getUserInfo(): Promise<UserInfoResponse> {
    const response = await this.makeRequest("/api/v5/p2p/user/basic-info")
    const data = response.data?.[0]

    return {
      userId: data?.userId || "",
      nickName: data?.nickName || "",
      userType: data?.type || "",
      completedOrders: data?.completedOrders || "",
      completionRate: data?.completionRate || "",
      kycLevel: data?.kycLevel || "",
    }
  }

  async getMerchantProfile(): Promise<MerchantProfileResponse> {
    const response = await this.makeRequest("/api/v5/p2p/merchant/profile")
    const data = response.data?.[0]
    
    console.log("🏪 OKX Merchant Profile Raw Response:", data)

    return {
      userId: data?.merchantId || "",
      nickName: data?.nickName || "",
      userType: data?.userType || "",
      completedOrders: data?.completedBuyOrders || "0",
      completionRate: data?.merchantInfo30DayOrderInfo?.[0]?.completionRate30Day || "0",
      kycLevel: data?.isKycVerified ? "2" : "1",
      totalOrderAmount: data?.commonOrderTotal || "0",
      positiveRate: data?.positiveReviewPercentage || "0",
      tradingVolume: data?.commonOrderTotal || "0",
      avgReleaseTime: "0", // Not provided in this API
      avgPayTime: "0", // Not provided in this API
      totalTradingCount: data?.totalOrders || "0",
      isMerchant: true, // This is always true for merchant profile
      merchantLevel: data?.auditStatus === "1" ? "verified" : "unverified",
      merchantScore: data?.positiveReviewPercentage || "0",
      blockReasons: [],
      isBlocked: data?.isDisabled || false,
      registerTime: data?.merchantRegisteredTimestamp || "",
      lastActiveTime: "",
      avgConfirmTime: "0",
      safetyLevel: data?.isKycVerified ? "high" : "medium",
      tradingPreferences: {
        acceptsNewTraders: true,
        requiresKyc: data?.isKycVerified || false,
        minOrderAmount: "0",
        maxOrderAmount: "0",
        preferredPaymentMethods: [],
      },
    }
  }

  async getBalance(currency: string): Promise<BalanceResponse> {
    const response = await this.makeRequest(`/api/v5/p2p/user/balance?currencySymbol=${currency}`)
    const data = response.data?.[0]

    return {
      availableAmount: data?.availableAmount || "",
      onHoldAmount: data?.onHoldAmount || "",
      currencySymbol: data?.currencySymbol || currency,
    }
  }

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const response = await this.makeRequest("/api/v5/p2p/payment-method/list")

    const paymentMethods = (response.data || []).map((pm: any) => ({
      paymentMethodId: pm.paymentMethodId,
      type: pm.type,
      currency: pm.currency,
      isDisabled: pm.isDisabled,
      paymentMethodName: pm.paymentMethodName,
    }))

    return { paymentMethods, length: paymentMethods.length }
  }

  async addPaymentMethod(params: AddPaymentMethodParams): Promise<AddPaymentMethodResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/payment-method/add", "POST", params)
      return {
        paymentMethodId: response.data?.paymentMethodId || "",
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        paymentMethodId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async updatePaymentMethod(id: string, params: UpdatePaymentMethodParams): Promise<UpdatePaymentMethodResponse> {
    try {
      const response = await this.makeRequest("/api/v5/p2p/payment-method/update", "POST", {
        ...params,
        paymentMethodId: id,
      })
      return {
        paymentMethodId: response.data?.paymentMethodId || id,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        paymentMethodId: id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async deletePaymentMethod(id: string): Promise<DeletePaymentMethodResponse> {
    try {
      const response = await this.makeRequest(`/api/v5/p2p/payment-method/delete?paymentMethodId=${id}`)
      return {
        paymentMethodId: response.data?.paymentMethodId || id,
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        paymentMethodId: id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
