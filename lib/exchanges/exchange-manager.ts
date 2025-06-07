import type { P2PExchange } from "./base-exchange"
import { OKXExchange } from "./okx-exchange"

export class ExchangeManager {
  private exchanges: Map<string, P2PExchange> = new Map()
  private activeExchange: string | null = null

  constructor() {
    // Initialize with available exchanges
    this.initializeExchanges()
  }

  private initializeExchanges() {
    // In a real application, these would come from environment variables or user settings
    const okxApiKey = process.env.OKX_API_KEY || ""
    const okxApiSecret = process.env.OKX_API_SECRET || ""
    const okxPassphrase = process.env.OKX_PASSPHRASE || ""

    if (okxApiKey && okxApiSecret && okxPassphrase) {
      const okxExchange = new OKXExchange(okxApiKey, okxApiSecret, okxPassphrase)
      this.exchanges.set("okx", okxExchange)

      if (!this.activeExchange) {
        this.activeExchange = "okx"
      }
    }

    // TODO: Add other exchanges
    // const binanceExchange = new BinanceExchange(...)
    // this.exchanges.set('binance', binanceExchange)

    // const bybitExchange = new BybitExchange(...)
    // this.exchanges.set('bybit', bybitExchange)
  }

  addExchange(name: string, exchange: P2PExchange) {
    this.exchanges.set(name, exchange)

    if (!this.activeExchange) {
      this.activeExchange = name
    }
  }

  getExchange(name?: string): P2PExchange | null {
    const exchangeName = name || this.activeExchange
    return exchangeName ? this.exchanges.get(exchangeName) || null : null
  }

  getActiveExchange(): P2PExchange | null {
    return this.activeExchange ? this.exchanges.get(this.activeExchange) || null : null
  }

  setActiveExchange(name: string): boolean {
    if (this.exchanges.has(name)) {
      this.activeExchange = name
      return true
    }
    return false
  }

  getAvailableExchanges(): Array<{ name: string; isConnected: boolean }> {
    return Array.from(this.exchanges.entries()).map(([name, exchange]) => ({
      name: exchange.name,
      isConnected: exchange.isConnected,
    }))
  }

  getAllExchanges(): Map<string, P2PExchange> {
    return new Map(this.exchanges)
  }
}

// Singleton instance
export const exchangeManager = new ExchangeManager()
