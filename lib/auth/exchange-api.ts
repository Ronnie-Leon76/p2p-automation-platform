export interface ExchangeUserInfo {
  userId: string
  username: string
  email?: string
  kycLevel: number
  completionRate: number
  completedOrders: number
  isVerified: boolean
  traderType: string
  permissions: string[]
  teamInfo?: {
    teamId: string
    teamName: string
    role: string
    permissions: string[]
  }
}

export class ExchangeAPIService {
  async getUserInfo(exchange: string, accessToken: string): Promise<ExchangeUserInfo> {
    switch (exchange) {
      case "okx":
        return this.getOKXUserInfo(accessToken)
      case "binance":
        return this.getBinanceUserInfo(accessToken)
      case "bybit":
        return this.getBybitUserInfo(accessToken)
      default:
        throw new Error(`Unsupported exchange: ${exchange}`)
    }
  }

  private async getOKXUserInfo(accessToken: string): Promise<ExchangeUserInfo> {
    const response = await fetch("https://www.okx.com/api/v5/p2p/user/basic-info", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch OKX user info")
    }

    const data = await response.json()
    const userInfo = data.data?.[0]

    // Get team info if available
    let teamInfo
    try {
      const teamResponse = await fetch("https://www.okx.com/api/v5/p2p/user/team-info", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        teamInfo = teamData.data?.[0]
      }
    } catch (error) {
      console.warn("Failed to fetch team info:", error)
    }

    return {
      userId: userInfo.userId,
      username: userInfo.nickName,
      email: userInfo.email,
      kycLevel: Number.parseInt(userInfo.kycLevel) || 0,
      completionRate: Number.parseFloat(userInfo.completionRate) || 0,
      completedOrders: Number.parseInt(userInfo.completedOrders) || 0,
      isVerified: userInfo.kycLevel >= 2,
      traderType: userInfo.type || "individual",
      permissions: userInfo.permissions || [],
      teamInfo: teamInfo
        ? {
            teamId: teamInfo.teamId,
            teamName: teamInfo.teamName,
            role: teamInfo.role,
            permissions: teamInfo.permissions || [],
          }
        : undefined,
    }
  }

  private async getBinanceUserInfo(accessToken: string): Promise<ExchangeUserInfo> {
    const response = await fetch("https://api.binance.com/sapi/v1/c2c/orderBook/ticker", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch Binance user info")
    }

    const data = await response.json()

    // Binance API structure (adjust based on actual API)
    return {
      userId: data.userId,
      username: data.username,
      email: data.email,
      kycLevel: data.kycLevel || 0,
      completionRate: data.completionRate || 0,
      completedOrders: data.completedOrders || 0,
      isVerified: data.isVerified || false,
      traderType: data.traderType || "individual",
      permissions: data.permissions || [],
    }
  }

  private async getBybitUserInfo(accessToken: string): Promise<ExchangeUserInfo> {
    const response = await fetch("https://api.bybit.com/v5/user/query-api", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch Bybit user info")
    }

    const data = await response.json()

    // Bybit API structure (adjust based on actual API)
    return {
      userId: data.result.userId,
      username: data.result.username,
      email: data.result.email,
      kycLevel: data.result.kycLevel || 0,
      completionRate: data.result.completionRate || 0,
      completedOrders: data.result.completedOrders || 0,
      isVerified: data.result.isVerified || false,
      traderType: data.result.traderType || "individual",
      permissions: data.result.permissions || [],
    }
  }

  async getTraderMetrics(exchange: string, accessToken: string, userId: string) {
    switch (exchange) {
      case "okx":
        return this.getOKXTraderMetrics(accessToken, userId)
      case "binance":
        return this.getBinanceTraderMetrics(accessToken, userId)
      case "bybit":
        return this.getBybitTraderMetrics(accessToken, userId)
      default:
        throw new Error(`Unsupported exchange: ${exchange}`)
    }
  }

  private async getOKXTraderMetrics(accessToken: string, userId: string) {
    const response = await fetch(`https://www.okx.com/api/v5/p2p/user/statistics?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch OKX trader metrics")
    }

    const data = await response.json()
    return data.data?.[0]
  }

  private async getBinanceTraderMetrics(accessToken: string, userId: string) {
    // Implement Binance trader metrics API call
    return {}
  }

  private async getBybitTraderMetrics(accessToken: string, userId: string) {
    // Implement Bybit trader metrics API call
    return {}
  }
}