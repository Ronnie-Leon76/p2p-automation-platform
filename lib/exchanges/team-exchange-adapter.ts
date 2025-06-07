import type { P2PExchange } from "./base-exchange"
import { OKXExchange } from "./okx-exchange"
import { TeamDelegationService } from "@/lib/team/delegation-service"

export class TeamExchangeAdapter implements P2PExchange {
  name: string
  isConnected = false
  private delegationService: TeamDelegationService
  private teamId: string
  private userId: string
  private exchangeProvider: string
  private baseExchange: P2PExchange | null = null

  constructor(teamId: string, userId: string, exchangeProvider: string) {
    this.name = `Team ${exchangeProvider.toUpperCase()}`
    this.delegationService = new TeamDelegationService()
    this.teamId = teamId
    this.userId = userId
    this.exchangeProvider = exchangeProvider
  }

  async initialize(): Promise<boolean> {
    try {
      const accessToken = await this.delegationService.getDecryptedAccessToken(this.teamId, this.exchangeProvider)
      if (!accessToken) return false

      // Initialize the appropriate exchange with team credentials
      switch (this.exchangeProvider) {
        case "okx":
          // For OKX, we need API key, secret, and passphrase
          // In a real implementation, these would be stored securely
          this.baseExchange = new OKXExchange(accessToken, "", "")
          break
        // Add other exchanges as needed
        default:
          return false
      }

      this.isConnected = true
      return true
    } catch (error) {
      console.error("Error initializing team exchange adapter:", error)
      return false
    }
  }

  private async checkPermission(operationType: string, scope = "all"): Promise<boolean> {
    return this.delegationService.canPerformOperation(this.userId, this.teamId, operationType, scope)
  }

  private async logOperation(
    operationType: string,
    externalId?: string,
    data?: any,
    success = true,
    error?: string,
  ): Promise<void> {
    await this.delegationService.logTeamOperation(
      this.teamId,
      this.userId,
      operationType,
      this.exchangeProvider,
      externalId,
      data,
      success,
      error,
    )
  }

  async createAd(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("create_ads"))) {
      throw new Error("Insufficient permissions to create ads")
    }

    try {
      const result = await this.baseExchange.createAd(params)
      await this.logOperation("create_ad", result.adId, params, result.success, result.error)
      return result
    } catch (error) {
      await this.logOperation(
        "create_ad",
        undefined,
        params,
        false,
        error instanceof Error ? error.message : "Unknown error",
      )
      throw error
    }
  }

  async updateAd(adId: string, params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_ads"))) {
      throw new Error("Insufficient permissions to update ads")
    }

    try {
      const result = await this.baseExchange.updateAd(adId, params)
      await this.logOperation("update_ad", adId, params, result.success, result.error)
      return result
    } catch (error) {
      await this.logOperation(
        "update_ad",
        adId,
        params,
        false,
        error instanceof Error ? error.message : "Unknown error",
      )
      throw error
    }
  }

  async cancelAd(adId: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_ads"))) {
      throw new Error("Insufficient permissions to cancel ads")
    }

    try {
      const result = await this.baseExchange.cancelAd(adId)
      await this.logOperation("cancel_ad", adId, {}, result.success, result.error)
      return result
    } catch (error) {
      await this.logOperation("cancel_ad", adId, {}, false, error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }

  async createOrder(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("create_orders"))) {
      throw new Error("Insufficient permissions to create orders")
    }

    try {
      const result = await this.baseExchange.createOrder(params)
      await this.logOperation("create_order", result.orderId, params, result.success, result.error)
      return result
    } catch (error) {
      await this.logOperation(
        "create_order",
        undefined,
        params,
        false,
        error instanceof Error ? error.message : "Unknown error",
      )
      throw error
    }
  }

  async markOrderAsPaid(orderId: string, params?: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_orders"))) {
      throw new Error("Insufficient permissions to mark orders as paid")
    }

    try {
      const result = await this.baseExchange.markOrderAsPaid(orderId, params)
      await this.logOperation("mark_order_paid", orderId, params, result.success, result.error)
      return result
    } catch (error) {
      await this.logOperation(
        "mark_order_paid",
        orderId,
        params,
        false,
        error instanceof Error ? error.message : "Unknown error",
      )
      throw error
    }
  }

  async releaseCrypto(orderId: string, params?: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_orders"))) {
      throw new Error("Insufficient permissions to release crypto")
    }

    try {
      const result = await this.baseExchange.releaseCrypto(orderId, params)
      await this.logOperation("release_crypto", orderId, params, result.success, result.error)
      return result
    } catch (error) {
      await this.logOperation(
        "release_crypto",
        orderId,
        params,
        false,
        error instanceof Error ? error.message : "Unknown error",
      )
      throw error
    }
  }

  // Delegate all other methods to the base exchange
  async getAd(adId: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getAd(adId)
  }

  async getActiveAds(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getActiveAds(params)
  }

  async getMarketplaceAds(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getMarketplaceAds(params)
  }

  async updateAdStatus(adId: string, status: "hidden" | "show"): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_ads"))) {
      throw new Error("Insufficient permissions to update ad status")
    }
    return this.baseExchange.updateAdStatus(adId, status)
  }

  async getOrder(orderId: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getOrder(orderId)
  }

  async getOrders(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getOrders(params)
  }

  async cancelOrder(orderId: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_orders"))) {
      throw new Error("Insufficient permissions to cancel orders")
    }
    return this.baseExchange.cancelOrder(orderId)
  }

  async getOptimalPrice(cryptoCurrency: string, fiatCurrency: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getOptimalPrice(cryptoCurrency, fiatCurrency)
  }

  async getEstimatedPrice(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getEstimatedPrice(params)
  }

  async getUserInfo(): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getUserInfo()
  }

  async getBalance(currency: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getBalance(currency)
  }

  async getPaymentMethods(): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    return this.baseExchange.getPaymentMethods()
  }

  async addPaymentMethod(params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_payment_methods"))) {
      throw new Error("Insufficient permissions to add payment methods")
    }
    return this.baseExchange.addPaymentMethod(params)
  }

  async updatePaymentMethod(id: string, params: any): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_payment_methods"))) {
      throw new Error("Insufficient permissions to update payment methods")
    }
    return this.baseExchange.updatePaymentMethod(id, params)
  }

  async deletePaymentMethod(id: string): Promise<any> {
    if (!this.baseExchange) throw new Error("Exchange not initialized")
    if (!(await this.checkPermission("manage_payment_methods"))) {
      throw new Error("Insufficient permissions to delete payment methods")
    }
    return this.baseExchange.deletePaymentMethod(id)
  }
}
