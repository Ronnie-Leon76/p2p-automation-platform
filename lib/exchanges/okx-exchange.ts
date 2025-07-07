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
      const response = await this.makeRequest("/api/v5/p2p/ad/create", "POST", params)
      return {
        adId: response.data?.adId || "",
        success: response.code === 0,
        error: response.code !== 0 ? response.msg : undefined,
      }
    } catch (error) {
      return {
        adId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
    const response = await this.makeRequest(`/api/v5/p2p/ad/active-list?${queryParams}`)

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

    return { ads }
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

    return { paymentMethods }
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
