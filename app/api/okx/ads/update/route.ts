import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth";
import type { UpdateAdParams } from "@/lib/exchanges/base-exchange";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { adId, ...formData } = await request.json();

    if (!adId) {
      return NextResponse.json({ error: "adId is required" }, { status: 400 });
    }

    const authResult = await getOkxExchangeForAuthenticatedUser();
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, { status: authResult.status });
    }

    const okxExchange = authResult.okxExchange;

    const updateParams: UpdateAdParams = {};
    const allowedKeys: Array<keyof UpdateAdParams> = [
      "side",
      "cryptoCurrency",
      "fiatCurrency",
      "cryptoAmount",
      "minOrderLimit",
      "maxOrderLimit",
      "unitPrice",
      "priceMargin",
      "type",
      "paymentMethods",
      "paymentMethodIds",
      "targetGroup",
      "minKycLevel",
      "minCompletedOrders",
      "minCompletionRate",
      "remark",
      "automatedMessage",
      "online",
    ];

    for (const key of allowedKeys) {
      if (formData[key] !== undefined) {
        (updateParams[key] as unknown) = formData[key];
      }
    }

    const result = await okxExchange.updateAd(adId, updateParams);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update ad" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        oldAdId: result.oldAdId || adId,
        newAdId: result.newAdId || adId,
        message: "Ad updated successfully",
      },
    });
  } catch (error) {
    console.error("Update ad API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
