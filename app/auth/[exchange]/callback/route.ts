import { ExchangeAPIService } from "@/lib/auth/exchange-api"
import { ExchangeOAuthService } from "@/lib/auth/exchange-oauth"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { exchange: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=missing_parameters`)
    }

    const supabase = await createServerClient()
    const oauthService = new ExchangeOAuthService()
    const apiService = new ExchangeAPIService()

    // Get OAuth config
    const config = await oauthService.getOAuthConfig(params.exchange)
    if (!config) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=oauth_not_configured`)
    }

    // Exchange code for token
    const tokenData = await oauthService.exchangeCodeForToken(params.exchange, code, config)

    // Get user info from exchange
    const userInfo = await apiService.getUserInfo(params.exchange, tokenData.access_token)

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("exchange_provider", params.exchange)
      .eq("exchange_user_id", userInfo.userId)
      .single()

    let userId: string

    if (userError && userError.code === "PGRST116") {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: userInfo.email || `${userInfo.userId}@${params.exchange}.local`,
          full_name: userInfo.username,
          provider: params.exchange,
          exchange_provider: params.exchange,
          exchange_user_id: userInfo.userId,
          exchange_access_token: tokenData.access_token,
          exchange_refresh_token: tokenData.refresh_token,
          exchange_token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          exchange_permissions: userInfo.permissions,
          trader_info: {
            username: userInfo.username,
            traderType: userInfo.traderType,
            isVerified: userInfo.isVerified,
          },
          kyc_level: userInfo.kycLevel,
          completion_rate: userInfo.completionRate,
          completed_orders: userInfo.completedOrders,
          is_verified_trader: userInfo.isVerified,
          email_verified: true,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating user:", createError)
        return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=user_creation_failed`)
      }

      userId = newUser.id
    } else if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=database_error`)
    } else {
      // User exists, update tokens and info
      const { error: updateError } = await supabase
        .from("users")
        .update({
          exchange_access_token: tokenData.access_token,
          exchange_refresh_token: tokenData.refresh_token,
          exchange_token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          exchange_permissions: userInfo.permissions,
          trader_info: {
            username: userInfo.username,
            traderType: userInfo.traderType,
            isVerified: userInfo.isVerified,
          },
          kyc_level: userInfo.kycLevel,
          completion_rate: userInfo.completionRate,
          completed_orders: userInfo.completedOrders,
          is_verified_trader: userInfo.isVerified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)

      if (updateError) {
        console.error("Error updating user:", updateError)
        return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=user_update_failed`)
      }

      userId = existingUser.id
    }

    // Create OAuth session
    await supabase.from("oauth_sessions").insert({
      user_id: userId,
      exchange_name: params.exchange,
      access_token_encrypted: tokenData.access_token, // In production, encrypt this
      refresh_token_encrypted: tokenData.refresh_token,
      token_type: tokenData.token_type || "Bearer",
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      scopes: config.scopes,
      session_data: tokenData,
    })

    // Handle team info if available
    if (userInfo.teamInfo) {
      // Check if exchange team exists
      let { data: exchangeTeam, error: teamError } = await supabase
        .from("exchange_teams")
        .select("*")
        .eq("exchange_name", params.exchange)
        .eq("external_team_id", userInfo.teamInfo.teamId)
        .single()

      if (teamError && teamError.code === "PGRST116") {
        // Create new exchange team
        const { data: newTeam, error: createTeamError } = await supabase
          .from("exchange_teams")
          .insert({
            exchange_name: params.exchange,
            external_team_id: userInfo.teamInfo.teamId,
            team_name: userInfo.teamInfo.teamName,
            team_type: "exchange_team",
            team_permissions: userInfo.teamInfo.permissions,
            owner_user_id: userId,
          })
          .select()
          .single()

        if (!createTeamError) {
          exchangeTeam = newTeam
        }
      }

      // Add user to exchange team
      if (exchangeTeam) {
        await supabase
          .from("exchange_team_members")
          .upsert({
            exchange_team_id: exchangeTeam.id,
            user_id: userId,
            exchange_role: userInfo.teamInfo.role,
            permissions: userInfo.teamInfo.permissions,
          })
          .select()
      }
    }

    // Get trader metrics and store them
    try {
      const metrics = await apiService.getTraderMetrics(params.exchange, tokenData.access_token, userInfo.userId)
      if (metrics) {
        await supabase.from("trader_metrics").upsert({
          user_id: userId,
          exchange_name: params.exchange,
          metric_date: new Date().toISOString().split("T")[0],
          total_orders: metrics.totalOrders || 0,
          completed_orders: metrics.completedOrders || 0,
          cancelled_orders: metrics.cancelledOrders || 0,
          total_volume: metrics.totalVolume || 0,
          completion_rate: metrics.completionRate || 0,
          average_completion_time: metrics.averageCompletionTime || 0,
          rating: metrics.rating || 0,
          positive_feedback: metrics.positiveFeedback || 0,
          negative_feedback: metrics.negativeFeedback || 0,
          metrics_data: metrics,
        })
      }
    } catch (error) {
      console.warn("Failed to fetch trader metrics:", error)
    }

    // Sign in the user with Supabase
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userInfo.email || `${userInfo.userId}@${params.exchange}.local`,
      password: userInfo.userId, // Use exchange user ID as password
    })

    if (signInError) {
      // If sign in fails, create auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email: userInfo.email || `${userInfo.userId}@${params.exchange}.local`,
        password: userInfo.userId,
        options: {
          data: {
            exchange_provider: params.exchange,
            exchange_user_id: userInfo.userId,
            full_name: userInfo.username,
          },
        },
      })

      if (signUpError) {
        console.error("Auth error:", signUpError)
        return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=auth_failed`)
      }
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`)
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}/auth?error=${encodeURIComponent(error instanceof Error ? error.message : "oauth_failed")}`,
    )
  }
}
