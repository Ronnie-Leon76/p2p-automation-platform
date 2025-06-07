import { createClient } from "@/lib/supabase/server"
import { ExchangeOAuthService } from "@/lib/auth/exchange-oauth"

export interface TeamCredentials {
  id: string
  team_id: string
  exchange_provider: string
  owner_user_id: string
  encrypted_access_token: string
  encrypted_refresh_token?: string
  token_expires_at?: string
  api_permissions: string[]
  is_active: boolean
}

export interface TeamMemberPermission {
  permission_type: string
  permission_scope: string
  is_active: boolean
}

export class TeamDelegationService {
  private supabase = createClient()
  private oauthService = new ExchangeOAuthService()

  async setupTeamCredentials(
    teamId: string,
    ownerUserId: string,
    exchangeProvider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
  ): Promise<boolean> {
    try {
      // Encrypt tokens (in production, use proper encryption)
      const encryptedAccessToken = this.encryptToken(accessToken)
      const encryptedRefreshToken = refreshToken ? this.encryptToken(refreshToken) : null

      const { error } = await this.supabase.from("team_exchange_credentials").upsert({
        team_id: teamId,
        exchange_provider: exchangeProvider,
        owner_user_id: ownerUserId,
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt?.toISOString(),
        api_permissions: ["p2p_trading", "account_read", "order_management"],
        is_active: true,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Update team to use shared credentials
      await this.supabase
        .from("teams")
        .update({
          primary_exchange_provider: exchangeProvider,
          uses_shared_credentials: true,
          shared_trading_enabled: true,
        })
        .eq("id", teamId)

      return true
    } catch (error) {
      console.error("Error setting up team credentials:", error)
      return false
    }
  }

  async getTeamCredentials(teamId: string, exchangeProvider: string): Promise<TeamCredentials | null> {
    try {
      const { data, error } = await this.supabase
        .from("team_exchange_credentials")
        .select("*")
        .eq("team_id", teamId)
        .eq("exchange_provider", exchangeProvider)
        .eq("is_active", true)
        .single()

      if (error || !data) return null

      return data
    } catch (error) {
      console.error("Error fetching team credentials:", error)
      return null
    }
  }

  async getDecryptedAccessToken(teamId: string, exchangeProvider: string): Promise<string | null> {
    try {
      const credentials = await this.getTeamCredentials(teamId, exchangeProvider)
      if (!credentials) return null

      // Check if token is expired
      if (credentials.token_expires_at && new Date(credentials.token_expires_at) <= new Date()) {
        // Try to refresh token
        const refreshed = await this.refreshTeamToken(teamId, exchangeProvider)
        if (!refreshed) return null

        // Get updated credentials
        const updatedCredentials = await this.getTeamCredentials(teamId, exchangeProvider)
        if (!updatedCredentials) return null

        return this.decryptToken(updatedCredentials.encrypted_access_token)
      }

      return this.decryptToken(credentials.encrypted_access_token)
    } catch (error) {
      console.error("Error getting decrypted access token:", error)
      return null
    }
  }

  async refreshTeamToken(teamId: string, exchangeProvider: string): Promise<boolean> {
    try {
      const credentials = await this.getTeamCredentials(teamId, exchangeProvider)
      if (!credentials || !credentials.encrypted_refresh_token) return false

      const refreshToken = this.decryptToken(credentials.encrypted_refresh_token)
      const config = await this.oauthService.getOAuthConfig(exchangeProvider)
      if (!config) return false

      const tokenData = await this.oauthService.refreshAccessToken(exchangeProvider, refreshToken, config)

      // Update credentials with new tokens
      const { error } = await this.supabase
        .from("team_exchange_credentials")
        .update({
          encrypted_access_token: this.encryptToken(tokenData.access_token),
          encrypted_refresh_token: tokenData.refresh_token
            ? this.encryptToken(tokenData.refresh_token)
            : credentials.encrypted_refresh_token,
          token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", credentials.id)

      return !error
    } catch (error) {
      console.error("Error refreshing team token:", error)
      return false
    }
  }

  async grantMemberPermissions(
    teamMemberId: string,
    permissions: Array<{ type: string; scope: string }>,
    grantedBy: string,
  ): Promise<boolean> {
    try {
      const permissionRecords = permissions.map((perm) => ({
        team_member_id: teamMemberId,
        permission_type: perm.type,
        permission_scope: perm.scope,
        granted_by: grantedBy,
        is_active: true,
      }))

      const { error } = await this.supabase.from("team_member_permissions").upsert(permissionRecords)

      return !error
    } catch (error) {
      console.error("Error granting member permissions:", error)
      return false
    }
  }

  async getMemberPermissions(teamMemberId: string): Promise<TeamMemberPermission[]> {
    try {
      const { data, error } = await this.supabase
        .from("team_member_permissions")
        .select("permission_type, permission_scope, is_active")
        .eq("team_member_id", teamMemberId)
        .eq("is_active", true)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching member permissions:", error)
      return []
    }
  }

  async canPerformOperation(userId: string, teamId: string, operationType: string, scope = "all"): Promise<boolean> {
    try {
      // Check if user is team owner
      const { data: team } = await this.supabase.from("teams").select("owner_id").eq("id", teamId).single()

      if (team?.owner_id === userId) return true

      // Check team member permissions
      const { data: member } = await this.supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single()

      if (!member) return false

      const permissions = await this.getMemberPermissions(member.id)
      return permissions.some(
        (perm) =>
          perm.permission_type === operationType &&
          (perm.permission_scope === "all" || perm.permission_scope === scope) &&
          perm.is_active,
      )
    } catch (error) {
      console.error("Error checking operation permission:", error)
      return false
    }
  }

  async logTeamOperation(
    teamId: string,
    performedBy: string,
    operationType: string,
    exchangeProvider: string,
    externalOperationId?: string,
    operationData?: any,
    success = true,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.supabase.from("team_operation_logs").insert({
        team_id: teamId,
        performed_by_user_id: performedBy,
        operation_type: operationType,
        exchange_provider: exchangeProvider,
        external_operation_id: externalOperationId,
        operation_data: operationData,
        success,
        error_message: errorMessage,
      })
    } catch (error) {
      console.error("Error logging team operation:", error)
    }
  }

  private encryptToken(token: string): string {
    // In production, use proper encryption like AES-256
    // For now, just base64 encode (NOT SECURE)
    return Buffer.from(token).toString("base64")
  }

  private decryptToken(encryptedToken: string): string {
    // In production, use proper decryption
    // For now, just base64 decode (NOT SECURE)
    return Buffer.from(encryptedToken, "base64").toString()
  }
}
