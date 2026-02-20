export interface Ad {
  id: string;
  type: "buy" | "sell";
  cryptoCurrency: string;
  fiatCurrency: string;
  unitPrice: number;
  cryptoAmount: number;
  minOrderLimit: number;
  maxOrderLimit: number;
  availableAmount: number;
  status: "active" | "paused" | "completed" | "cancelled";
  paymentMethods: string[];
  completionRate: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
  priceType: "limit" | "floating_market";
  priceMargin?: number;
  targetGroup?: "common" | "certified" | "diamond" | "all";
  minKycLevel?: string;
  minCompletedOrders?: string;
  minCompletionRate?: string;
  remark?: string;
  automatedMessage?: string;
  okx_integration?: {
    adId: string;
    supported_payment_types: string[];
    sasapay_compatible: boolean;
    auto_payment_routing: boolean;
  };
}

export interface CreateAdFormData {
  side: "buy" | "sell";
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount: string;
  minOrderLimit: string;
  maxOrderLimit: string;
  unitPrice?: string;
  priceMargin?: string;
  type: "limit" | "floating_market";
  paymentMethods: string[];
  targetGroup: "common" | "certified" | "diamond" | "all";
  minKycLevel: string;
  minCompletedOrders: string;
  minCompletionRate: string;
  remark: string;
  automatedMessage: string;
}
