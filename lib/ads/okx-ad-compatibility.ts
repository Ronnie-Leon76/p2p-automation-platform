export interface OKXPaymentCompatibility {
  okx_type: string;
  sasapay_method: string;
  compatibility_score: number;
  auto_selectable: boolean;
}

export const OKX_SASAPAY_COMPATIBILITY: OKXPaymentCompatibility[] = [
  {
    okx_type: "MPESA",
    sasapay_method: "sasapay_mpesa",
    compatibility_score: 100,
    auto_selectable: true,
  },
  {
    okx_type: "AIRTEL_MONEY",
    sasapay_method: "sasapay_airtel",
    compatibility_score: 100,
    auto_selectable: true,
  },
  {
    okx_type: "BANK",
    sasapay_method: "sasapay_bank",
    compatibility_score: 95,
    auto_selectable: true,
  },
  {
    okx_type: "SWIFT",
    sasapay_method: "sasapay_bank",
    compatibility_score: 90,
    auto_selectable: true,
  },
  {
    okx_type: "PAY_NOW",
    sasapay_method: "sasapay_mpesa",
    compatibility_score: 75,
    auto_selectable: true,
  },
  {
    okx_type: "ALIPAY",
    sasapay_method: "sasapay_mpesa",
    compatibility_score: 60,
    auto_selectable: false,
  },
  {
    okx_type: "WXPAY",
    sasapay_method: "sasapay_mpesa",
    compatibility_score: 60,
    auto_selectable: false,
  },
];

function normalizePaymentMethodNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      if (typeof item === "string") return item;
      return (
        item?.type ||
        item?.paymentMethodType ||
        item?.paymentMethodName ||
        item?.methodType ||
        item?.method ||
        item?.name ||
        item?.channelType ||
        ""
      );
    })
    .filter(Boolean);
}

function parseNumberStrict(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function convertOKXAdsToAds(
  adsData: any[],
  context?: { source?: "cache" | "api" | "fallback"; isStale?: boolean },
) {
  return adsData.map((ad: any) => {
    const supportedPaymentTypes = normalizePaymentMethodNames(
      ad.paymentMethods || ad.paymentInfos || ad.paymentInfoList || [],
    );
    const sasapayCompatible = supportedPaymentTypes.some((method: string) =>
      OKX_SASAPAY_COMPATIBILITY.some(
        (comp) => comp.okx_type === method && comp.auto_selectable,
      ),
    );

    const unitPrice = parseNumberStrict(ad.unitPrice);
    const availableAmount = parseNumberStrict(ad.availableAmount);
    const cryptoAmountRaw = parseNumberStrict(ad.cryptoAmount);
    const minOrderLimit = parseNumberStrict(ad.minOrderSize);
    const maxOrderLimit = parseNumberStrict(ad.maxOrderSize);
    const completionRate = parseNumberStrict(ad.creator?.completionRate);
    const totalOrders = parseNumberStrict(ad.creator?.completedOrders);
    const issues: string[] = [];
    if (unitPrice === null || unitPrice <= 0) issues.push("unitPrice");
    if (availableAmount === null || availableAmount <= 0) issues.push("availableAmount");
    if (minOrderLimit === null) issues.push("minOrderLimit");
    if (maxOrderLimit === null) issues.push("maxOrderLimit");

    return {
      id: ad.adId || ad.id || Math.random().toString(),
      // Keep side as-is from OKX. Flipping it creates incorrect ad semantics in UI.
      type: (ad.side === "sell" ? "sell" : "buy") as "buy" | "sell",
      cryptoCurrency: ad.cryptoCurrency || "USDT",
      fiatCurrency: ad.fiatCurrency || "KES",
      unitPrice: unitPrice ?? Number.NaN,
      // Prefer explicit total amount if present; otherwise fallback to available.
      cryptoAmount: cryptoAmountRaw ?? availableAmount ?? Number.NaN,
      availableAmount: availableAmount ?? Number.NaN,
      minOrderLimit: minOrderLimit ?? Number.NaN,
      maxOrderLimit: maxOrderLimit ?? Number.NaN,
      status: (
        ad.status === "online" || ad.status === "show"
          ? "active"
          : ad.status === "offline" || ad.status === "hidden"
            ? "paused"
            : "active"
      ) as
        | "active"
        | "paused"
        | "completed"
        | "cancelled",
      paymentMethods: supportedPaymentTypes,
      completionRate: completionRate ?? Number.NaN,
      totalOrders: totalOrders ?? 0,
      createdAt: ad.createdTimestamp
        ? new Date(parseInt(ad.createdTimestamp)).toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceType: "limit" as "limit" | "floating_market",
      targetGroup: "all" as "all" | "common" | "certified" | "diamond",
      dataQuality: (issues.length === 0 ? "complete" : "incomplete") as "complete" | "incomplete",
      dataIssues: issues,
      dataSource: (context?.source || "unknown") as "cache" | "api" | "fallback" | "unknown",
      stale: Boolean(context?.isStale),
      okx_integration: {
        adId: ad.adId || ad.id,
        supported_payment_types: supportedPaymentTypes,
        sasapay_compatible: sasapayCompatible,
        auto_payment_routing: sasapayCompatible && supportedPaymentTypes.length > 1,
      },
    };
  });
}

export function getSasaPayCompatibility(ad: any) {
  if (!ad.okx_integration) return { compatible: false, methods: [], score: 0 };

  const compatibleMethods = ad.okx_integration.supported_payment_types
    .map((okxType: string) =>
      OKX_SASAPAY_COMPATIBILITY.find((comp) => comp.okx_type === okxType),
    )
    .filter(Boolean) as OKXPaymentCompatibility[];

  const averageScore =
    compatibleMethods.length > 0
      ? compatibleMethods.reduce((sum, method) => sum + method.compatibility_score, 0) /
        compatibleMethods.length
      : 0;

  return {
    compatible: compatibleMethods.length > 0,
    methods: compatibleMethods,
    score: averageScore,
    auto_selectable: compatibleMethods.some((method) => method.auto_selectable),
  };
}

export function getRecommendedSasaPayMethod(amount: number, availableMethods: OKXPaymentCompatibility[]): string {
  if (amount > 50000) {
    const bankMethod = availableMethods.find((m) => m.sasapay_method === "sasapay_bank");
    if (bankMethod) return bankMethod.sasapay_method;
  }

  if (amount < 1000) {
    const mobileMethod = availableMethods.find(
      (m) => m.sasapay_method === "sasapay_mpesa" || m.sasapay_method === "sasapay_airtel",
    );
    if (mobileMethod) return mobileMethod.sasapay_method;
  }

  const bestMethod = availableMethods.reduce((best, current) =>
    current.compatibility_score > best.compatibility_score ? current : best,
  );

  return bestMethod?.sasapay_method || "sasapay_mpesa";
}
