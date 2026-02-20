import { ExchangeAPIService } from "@/lib/auth/exchange-api";
import { ExchangeOAuthService } from "@/lib/auth/exchange-oauth";
import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exchange: string }> },
) {
  try {
    const { exchange } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=missing_parameters`);
    }

    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/login?error=auth_required`);
    }

    const stateRecord = await prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateRecord || stateRecord.exchange !== exchange || stateRecord.expiresAt < new Date()) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=invalid_oauth_state`);
    }

    await prisma.oAuthState.delete({ where: { state } });

    const oauthService = new ExchangeOAuthService();
    const apiService = new ExchangeAPIService();

    const config = await oauthService.getOAuthConfig(exchange);
    if (!config) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=oauth_not_configured`);
    }

    const tokenData = await oauthService.exchangeCodeForToken(exchange, code, config);
    const userInfo = await apiService.getUserInfo(exchange, tokenData.access_token);

    await prisma.appUser.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email: authUser.email ?? userInfo.email ?? null,
        fullName: userInfo.username ?? authUser.user_metadata?.full_name ?? null,
        userType: (authUser.user_metadata?.user_type as string | undefined) ?? "merchant",
        exchangeProvider: exchange,
      },
      update: {
        email: authUser.email ?? userInfo.email ?? undefined,
        fullName: userInfo.username ?? authUser.user_metadata?.full_name ?? undefined,
        exchangeProvider: exchange,
      },
    });

    await prisma.userExchangeData.upsert({
      where: {
        userId_exchange_dataType: {
          userId: authUser.id,
          exchange,
          dataType: "oauth_token",
        },
      },
      create: {
        userId: authUser.id,
        exchange,
        dataType: "oauth_token",
        data: tokenData as any,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : new Date(Date.now() + 60 * 60 * 1000),
      },
      update: {
        data: tokenData as any,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await prisma.userExchangeData.upsert({
      where: {
        userId_exchange_dataType: {
          userId: authUser.id,
          exchange,
          dataType: "profile",
        },
      },
      create: {
        userId: authUser.id,
        exchange,
        dataType: "profile",
        data: userInfo as any,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      update: {
        data: userInfo as any,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      const metrics = await apiService.getTraderMetrics(exchange, tokenData.access_token, userInfo.userId);
      if (metrics) {
        await prisma.userExchangeData.upsert({
          where: {
            userId_exchange_dataType: {
              userId: authUser.id,
              exchange,
              dataType: "trader_metrics",
            },
          },
          create: {
            userId: authUser.id,
            exchange,
            dataType: "trader_metrics",
            data: metrics as any,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
          update: {
            data: metrics as any,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
      }
    } catch (metricsError) {
      console.warn("Failed to fetch trader metrics:", metricsError);
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/auth?error=${encodeURIComponent(error instanceof Error ? error.message : "oauth_failed")}`,
    );
  }
}
