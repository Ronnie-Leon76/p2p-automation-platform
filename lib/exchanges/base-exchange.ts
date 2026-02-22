// Base interface for all P2P exchanges
export interface P2PExchange {
  // Exchange identification
  name: string
  isConnected: boolean

  // Ad Management
  createAd(params: CreateAdParams): Promise<CreateAdResponse>
  updateAd(adId: string, params: UpdateAdParams): Promise<UpdateAdResponse>
  cancelAd(adId: string): Promise<CancelAdResponse>
  getAd(adId: string): Promise<GetAdResponse>
  getActiveAds(params: GetActiveAdsParams): Promise<GetActiveAdsResponse>
  getUserAds(): Promise<GetActiveAdsResponse>  // Get user's own ads
  getMarketplaceAds(params: GetMarketplaceAdsParams): Promise<GetMarketplaceAdsResponse>
  updateAdStatus(adId: string, status: "hidden" | "show"): Promise<UpdateAdStatusResponse>

  // Order Management
  createOrder(params: CreateOrderParams): Promise<CreateOrderResponse>
  getOrder(orderId: string): Promise<GetOrderResponse>
  getOrders(params: GetOrdersParams): Promise<GetOrdersResponse>
  getTradingSummaryWithUser(params: GetTradingSummaryWithUserParams): Promise<GetTradingSummaryWithUserResponse>
  cancelOrder(orderId: string): Promise<CancelOrderResponse>
  markOrderAsPaid(orderId: string, params?: MarkAsPaidParams): Promise<MarkAsPaidResponse>
  releaseCrypto(orderId: string, params?: ReleaseCryptoParams): Promise<ReleaseCryptoResponse>

  // Pricing
  getOptimalPrice(cryptoCurrency: string, fiatCurrency: string): Promise<OptimalPriceResponse>
  getEstimatedPrice(params: EstimatedPriceParams): Promise<EstimatedPriceResponse>

  // User Management
  getUserInfo(): Promise<UserInfoResponse>
  getMerchantProfile(): Promise<MerchantProfileResponse>
  getBalance(currency: string): Promise<BalanceResponse>

  // Payment Methods
  getPaymentMethods(): Promise<PaymentMethodsResponse>
  addPaymentMethod(params: AddPaymentMethodParams): Promise<AddPaymentMethodResponse>
  updatePaymentMethod(id: string, params: UpdatePaymentMethodParams): Promise<UpdatePaymentMethodResponse>
  deletePaymentMethod(id: string): Promise<DeletePaymentMethodResponse>
}

// Common types used across all exchanges
export interface CreateAdParams {
  side: "buy" | "sell"
  cryptoCurrency: string
  fiatCurrency: string
  cryptoAmount: string
  minOrderLimit: string
  maxOrderLimit: string
  unitPrice?: string
  priceMargin?: string
  type: "limit" | "floating_market"
  paymentMethods?: string[]
  paymentMethodIds?: string[]
  targetGroup?: "common" | "certified" | "diamond" | "all"
  minKycLevel?: string
  minCompletedOrders?: string
  minCompletionRate?: string
  remark?: string
  automatedMessage?: string
}

export interface CreateAdResponse {
  adId: string
  success: boolean
  error?: string
}

export interface UpdateAdParams extends Partial<CreateAdParams> {
  online?: boolean
}

export interface UpdateAdResponse {
  oldAdId?: string
  newAdId?: string
  success: boolean
  error?: string
}

export interface CancelAdResponse {
  adId: string
  success: boolean
  error?: string
}

export interface GetAdResponse {
  adId: string
  side: string
  cryptoCurrency: string
  fiatCurrency: string
  unitPrice: string
  availableAmount: string
  minOrderSize: string
  maxOrderSize: string
  creator: {
    userId: string
    nickName: string
    completionRate: string
    completedOrders: string
    kycLevel: string
  }
  paymentMethods: string[]
  status: string
  createdTimestamp: string
}

export interface GetActiveAdsParams {
  side: "buy" | "sell"
  cryptoCurrency: string
  fiatCurrency: string
}

export interface GetActiveAdsResponse {
  ads: GetAdResponse[]
}

export interface GetMarketplaceAdsParams {
  side?: "buy" | "sell" | "all"
  cryptoCurrency: string
  fiatCurrency: string
  targetGroup?: string
  paymentMethod?: string
  limit?: string
}

export interface GetMarketplaceAdsResponse {
  buyAds: GetAdResponse[]
  sellAds: GetAdResponse[]
}

export interface UpdateAdStatusResponse {
  adId: string
  success: boolean
  error?: string
}

export interface CreateOrderParams {
  adId: string
  cryptoAmount: string
  cryptoCurrency: string
  fiatCurrency: string
  paymentMethod: string
  totalFiatAmount?: string
}

export interface CreateOrderResponse {
  orderId: string
  status: string
  success: boolean
  error?: string
}

export interface GetOrderResponse {
  orderId: string
  side: string
  cryptoCurrency: string
  fiatCurrency: string
  cryptoAmount: string
  fiatAmount: string
  unitPrice: string
  orderStatus: string
  paymentStatus: string
  createdTimestamp: string
  paymentMethodName?: string
  accountName?: string
  accountNumber?: string
  bankName?: string
  paymentTimestamp?: string
  counterpartyDetail: {
    userId: string
    nickName: string
    completionRate: string
  }
  pendingOrderDetails?: Record<string, unknown>
}

export interface GetOrdersParams {
  side?: "buy" | "sell" | "all"
  pageIndex: string
  pageSize: string
  cryptoCurrencies?: string
  fiatCurrencies?: string
  start?: string
  end?: string
  completionStatus?: "all" | "pending" | "completed"
  searchKeyword?: string
}

export interface GetOrdersResponse {
  orders: GetOrderResponse[]
  total?: number
  pageIndex?: number
  pageSize?: number
  hasMore?: boolean
}

export interface GetTradingSummaryWithUserParams {
  userId: string
  quoteCurrency?: string
}

export interface GetTradingSummaryWithUserResponse {
  userId: string
  tradeCount: number
  tradeAmount: number
  side: string | null
  totalOrders: number
  completedOrders: number
  canceledOrders: number
  disputedOrders: number
  completionRate: number
  totalAmount: number
  avgReleaseMinutes: number | null
  avgPaymentMinutes: number | null
  raw?: Record<string, unknown> | null
}

export interface CancelOrderResponse {
  orderId: string
  success: boolean
  error?: string
}

export interface MarkAsPaidParams {
  paymentProofFileUrls?: string[]
  makerPaymentMethodId?: string
}

export interface MarkAsPaidResponse {
  orderId: string
  success: boolean
  error?: string
}

export interface ReleaseCryptoParams {
  paymentProofFileUrls?: string[]
  verificationType: string
  amount?: string
}

export interface ReleaseCryptoResponse {
  orderId: string
  success: boolean
  error?: string
}

export interface OptimalPriceResponse {
  currentHighestBuyAdPrice: string
  currentLowestSellAdPrice: string
}

export interface EstimatedPriceParams {
  cryptoCurrency: string
  fiatCurrency: string
  side?: "buy" | "sell"
  paymentMethod?: string
}

export interface EstimatedPriceResponse {
  price: string
}

export interface UserInfoResponse {
  userId: string
  nickName: string
  userType: string
  completedOrders: string
  completionRate: string
  kycLevel: string
}

export interface MerchantProfileResponse {
  userId: string
  nickName: string
  userType: string
  completedOrders: string
  completionRate: string
  kycLevel: string
  totalOrderAmount: string
  positiveRate: string
  tradingVolume: string
  avgReleaseTime: string
  avgPayTime: string
  totalTradingCount: string
  isMerchant: boolean
  merchantLevel: string
  merchantScore: string
  blockReasons: string[]
  isBlocked: boolean
  registerTime: string
  lastActiveTime: string
  avgConfirmTime: string
  safetyLevel: string
  tradingPreferences: {
    acceptsNewTraders: boolean
    requiresKyc: boolean
    minOrderAmount: string
    maxOrderAmount: string
    preferredPaymentMethods: string[]
  }
}

export interface BalanceResponse {
  availableAmount: string
  onHoldAmount: string
  currencySymbol: string
}

export interface PaymentMethodsResponse {
  length: any
  paymentMethods: Array<{
    paymentMethodId: string
    type: string
    currency: string
    isDisabled: boolean
    paymentMethodName: string
  }>
}

export interface AddPaymentMethodParams {
  currency: string
  type: string
  isEnabled: boolean
  applicationType: string
  details: Record<string, any>
}

export interface AddPaymentMethodResponse {
  paymentMethodId: string
  success: boolean
  error?: string
}

export interface UpdatePaymentMethodParams extends AddPaymentMethodParams {
  paymentMethodId: string
}

export interface UpdatePaymentMethodResponse {
  paymentMethodId: string
  success: boolean
  error?: string
}

export interface DeletePaymentMethodResponse {
  paymentMethodId: string
  success: boolean
  error?: string
}
