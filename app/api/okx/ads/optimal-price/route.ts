import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cryptoCurrency = searchParams.get("cryptoCurrency");
    const fiatCurrency = searchParams.get("fiatCurrency");

    if (!cryptoCurrency || !fiatCurrency) {
      return NextResponse.json(
        { error: "cryptoCurrency and fiatCurrency are required" },
        { status: 400 },
      );
    }

    const authResult = await getOkxExchangeForAuthenticatedUser();
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, { status: authResult.status });
    }

    const okxExchange = authResult.okxExchange;
    const data = await okxExchange.getOptimalPrice(cryptoCurrency, fiatCurrency);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get optimal ad price API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
