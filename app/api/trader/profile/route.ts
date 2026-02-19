import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function mapMerchantProfile(userId: string, merchantData: any) {
  return {
    id: userId,
    full_name: merchantData?.nickName || "Trader",
    exchange_provider: "okx",
    exchange_user_id: merchantData?.merchantId || merchantData?.userId || "",
    kyc_level: merchantData?.isKycVerified ? 2 : 1,
    completion_rate: parseFloat(merchantData?.merchantInfo30DayOrderInfo?.[0]?.completionRate30Day || "0"),
    completed_orders: parseInt(merchantData?.completedBuyOrders || "0"),
    is_verified_trader: merchantData?.isKycVerified || false,
    trader_info: {
      ...merchantData,
      isMerchant: true,
      merchantLevel: merchantData?.auditStatus === "1" ? "verified" : "unverified",
      totalOrderAmount: merchantData?.commonOrderTotal,
      positiveRate: merchantData?.positiveReviewPercentage,
      tradingVolume: merchantData?.commonOrderTotal,
      exchange: "okx",
    },
    created_at: new Date().toISOString(),
  };
}

function mapBasicProfile(userId: string, profileData: any) {
  return {
    id: userId,
    full_name: profileData?.nickName || "Trader",
    exchange_provider: "okx",
    exchange_user_id: profileData?.userId || "",
    kyc_level: parseInt(profileData?.kycLevel || "0"),
    completion_rate: parseFloat(profileData?.completionRate || "0") * 100 || 0,
    completed_orders: parseInt(profileData?.completedOrders || "0"),
    is_verified_trader: profileData?.kycLevel === "2",
    trader_info: { ...profileData, exchange: "okx" },
    created_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      const now = new Date();
      const [merchantData, profileData, userProfile] = await Promise.all([
        prisma.userExchangeData.findFirst({
          where: {
            userId: user.id,
            exchange: "okx",
            dataType: "merchant_profile",
            expiresAt: { gt: now },
          },
          select: { data: true },
        }),
        prisma.userExchangeData.findFirst({
          where: {
            userId: user.id,
            exchange: "okx",
            dataType: "profile",
            expiresAt: { gt: now },
          },
          select: { data: true },
        }),
        prisma.appUser.findUnique({
          where: { id: user.id },
        }),
      ]);

      let profile: any = null;
      if (merchantData?.data) {
        profile = mapMerchantProfile(user.id, merchantData.data);
      } else if (profileData?.data) {
        profile = mapBasicProfile(user.id, profileData.data);
      } else if (userProfile) {
        profile = {
          id: userProfile.id,
          full_name: userProfile.fullName,
          exchange_provider: userProfile.exchangeProvider,
          created_at: userProfile.createdAt,
        };
      }

      return NextResponse.json(
        {
          profile,
          metrics: [],
          teams: [],
        },
        { status: 200 }
      );
    }

    const supabase = await createServerClient();
    const [{ data: merchantData }, { data: profileData }, { data: metricsData }, { data: teamsRaw }] = await Promise.all([
      supabase
        .from("user_exchange_data")
        .select("data")
        .eq("user_id", user.id)
        .eq("exchange", "okx")
        .eq("data_type", "merchant_profile")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle(),
      supabase
        .from("user_exchange_data")
        .select("data")
        .eq("user_id", user.id)
        .eq("exchange", "okx")
        .eq("data_type", "profile")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle(),
      supabase.from("trader_metrics").select("*").eq("user_id", user.id).order("metric_date", { ascending: false }).limit(30),
      supabase
        .from("exchange_team_members")
        .select(
          `
            *,
            exchange_teams(*)
          `
        )
        .eq("user_id", user.id),
    ]);

    let profile: any = null;
    if (merchantData?.data) {
      profile = mapMerchantProfile(user.id, merchantData.data);
    } else if (profileData?.data) {
      profile = mapBasicProfile(user.id, profileData.data);
    } else {
      const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
      profile = userProfile || null;
    }

    const teams = (teamsRaw || []).map((member: any) => ({
      ...member.exchange_teams,
      exchange_role: member.exchange_role,
    }));

    return NextResponse.json(
      {
        profile,
        metrics: metricsData || [],
        teams: teams || [],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load trader profile" }, { status: 500 });
  }
}
