import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";

export interface ExchangeOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
}

export class ExchangeOAuthService {
  private supabase = getBrowserDbClient()

  async getOAuthConfig(exchange: string): Promise<ExchangeOAuthConfig | null> {
    const { data, error } = await this.supabase
      .from("exchange_oauth_apps")
      .select("*")
      .eq("exchange_name", exchange)
      .eq("is_active", true)
      .single()

    if (error || !data) return null

    const configs = {
      okx: {
        authUrl: "https://www.okx.com/oauth/v1/authorize",
        tokenUrl: "https://www.okx.com/oauth/v1/token",
      },
      binance: {
        authUrl: "https://accounts.binance.com/oauth/authorize",
        tokenUrl: "https://api.binance.com/oauth/token",
      },
      bybit: {
        authUrl: "https://api.bybit.com/oauth/authorize",
        tokenUrl: "https://api.bybit.com/oauth/token",
      },
    }

    const exchangeConfig = configs[exchange as keyof typeof configs]
    if (!exchangeConfig) return null

    return {
      clientId: data.client_id,
      clientSecret: data.client_secret_encrypted, // In production, decrypt this
      redirectUri: data.redirect_uri,
      scopes: data.scopes,
      authUrl: exchangeConfig.authUrl,
      tokenUrl: exchangeConfig.tokenUrl,
    }
  }

  generateAuthUrl(exchange: string, config: ExchangeOAuthConfig, state?: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(" "),
      response_type: "code",
      state: state || crypto.randomUUID(),
    })

    return `${config.authUrl}?${params.toString()}`
  }

  async exchangeCodeForToken(exchange: string, code: string, config: ExchangeOAuthConfig) {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`)
    }

    return response.json()
  }

  async refreshAccessToken(exchange: string, refreshToken: string, config: ExchangeOAuthConfig) {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    return response.json()
  }
}

