/**
 * SasaPay Configuration and Constants
 * Centralized configuration for SasaPay transaction limits, fees, and validation
 */

export const SASAPAY_LIMITS = {
  // B2C Transaction Limits
  MAX_SINGLE_TRANSACTION: 150000, // KES 150,000 maximum single B2C transaction
  DAILY_LIMIT: 500000, // KES 500,000 daily B2C limit
  MIN_TRANSACTION: 1, // KES 1 minimum transaction
  
  // C2B Transaction Limits (receiving payments)
  C2B_MAX_SINGLE: 999999999, // No specific limit mentioned for C2B receiving
  
  // Fee Structure
  C2B_FEE_PERCENT: 0.2, // 0.2% for C2B (receiving)
  C2B_FEE_CAP: 150, // Capped at KES 150
  
  // B2C Fee Table (tiered structure)
  B2C_FEE_TABLE: [
    { min: 1, max: 100, fee: 0 },
    { min: 101, max: 500, fee: 7 },
    { min: 501, max: 1000, fee: 11 },
    { min: 1001, max: 2500, fee: 19 },
    { min: 2501, max: 5000, fee: 24 },
    { min: 5001, max: 10000, fee: 24 },
    { min: 10001, max: 15000, fee: 29 },
    { min: 15001, max: 20000, fee: 29 },
    { min: 20001, max: 150000, fee: 39 },
  ],
} as const;

export const SASAPAY_CONFIG = {
  SUPPORTED_CURRENCIES: ['KES'] as const,
  DEFAULT_CURRENCY: 'KES' as const,
  NETWORK_CODES: {
    SAFARICOM: '63902',
    AIRTEL: '63903',
  } as const,
  CHANNELS: {
    MPESA: 'mpesa',
    AIRTEL: 'airtel',
  } as const,
} as const;

/**
 * Calculate B2C transaction fee based on SasaPay's tiered structure
 */
export function calculateB2CFee(amount: number): number {
  for (const tier of SASAPAY_LIMITS.B2C_FEE_TABLE) {
    if (amount >= tier.min && amount <= tier.max) {
      return tier.fee;
    }
  }
  // For amounts above the highest tier, return the highest fee
  return SASAPAY_LIMITS.B2C_FEE_TABLE[SASAPAY_LIMITS.B2C_FEE_TABLE.length - 1].fee;
}

/**
 * Calculate C2B transaction fee (0.2% capped at 150 KES)
 */
export function calculateC2BFee(amount: number): number {
  const fee = amount * (SASAPAY_LIMITS.C2B_FEE_PERCENT / 100);
  return Math.min(fee, SASAPAY_LIMITS.C2B_FEE_CAP);
}

/**
 * Validate if a B2C transaction amount is within SasaPay limits
 */
export function validateB2CTransaction(
  amount: number,
  dailyUsed: number = 0
): {
  isValid: boolean;
  reason?: string;
  maxAllowed?: number;
  type?: 'single' | 'daily';
} {
  // Check minimum amount
  if (amount < SASAPAY_LIMITS.MIN_TRANSACTION) {
    return {
      isValid: false,
      reason: `Amount must be at least KES ${SASAPAY_LIMITS.MIN_TRANSACTION}`,
      maxAllowed: SASAPAY_LIMITS.MIN_TRANSACTION,
      type: 'single',
    };
  }

  // Check single transaction limit
  if (amount > SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION) {
    return {
      isValid: false,
      reason: `Amount exceeds maximum single transaction limit of KES ${SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION.toLocaleString()}`,
      maxAllowed: SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION,
      type: 'single',
    };
  }

  // Check daily limit
  if (dailyUsed + amount > SASAPAY_LIMITS.DAILY_LIMIT) {
    const remainingDaily = SASAPAY_LIMITS.DAILY_LIMIT - dailyUsed;
    return {
      isValid: false,
      reason: `Amount would exceed daily limit of KES ${SASAPAY_LIMITS.DAILY_LIMIT.toLocaleString()}`,
      maxAllowed: remainingDaily,
      type: 'daily',
    };
  }

  return { isValid: true };
}

/**
 * Get recommended order limits for P2P ads using SasaPay
 */
export function getSasaPayOrderLimits(dailyUsed: number = 0): {
  maxSingleOrder: number;
  maxDailyRemaining: number;
  dailyUsed: number;
  dailyLimit: number;
  recommendedMaxOrder: number;
  warningThreshold: number;
} {
  const dailyRemaining = SASAPAY_LIMITS.DAILY_LIMIT - dailyUsed;
  const maxSingleOrder = Math.min(SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION, dailyRemaining);
  
  // Recommend setting max order to 80% of available capacity to allow for multiple orders
  const recommendedMaxOrder = Math.floor(maxSingleOrder * 0.8);
  
  // Warning threshold at 90% of daily limit
  const warningThreshold = Math.floor(SASAPAY_LIMITS.DAILY_LIMIT * 0.9);

  return {
    maxSingleOrder: Math.max(0, maxSingleOrder),
    maxDailyRemaining: Math.max(0, dailyRemaining),
    dailyUsed,
    dailyLimit: SASAPAY_LIMITS.DAILY_LIMIT,
    recommendedMaxOrder: Math.max(0, recommendedMaxOrder),
    warningThreshold,
  };
}

/**
 * Check if daily usage is approaching limits
 */
export function getDailyUsageStatus(dailyUsed: number): {
  status: 'safe' | 'warning' | 'critical' | 'exhausted';
  percentage: number;
  message: string;
  color: string;
} {
  const percentage = (dailyUsed / SASAPAY_LIMITS.DAILY_LIMIT) * 100;
  
  if (percentage >= 100) {
    return {
      status: 'exhausted',
      percentage,
      message: 'Daily limit exhausted',
      color: 'red',
    };
  } else if (percentage >= 90) {
    return {
      status: 'critical',
      percentage,
      message: 'Daily limit critical - less than 10% remaining',
      color: 'red',
    };
  } else if (percentage >= 70) {
    return {
      status: 'warning',
      percentage,
      message: 'Daily limit warning - 70% used',
      color: 'yellow',
    };
  } else {
    return {
      status: 'safe',
      percentage,
      message: 'Daily usage within safe limits',
      color: 'green',
    };
  }
}

/**
 * Format currency amount for display
 */
export function formatKesAmount(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

/**
 * Validate and suggest optimal buy ad configuration
 */
export function validateBuyAdConfiguration(
  maxOrderSize: number,
  minOrderSize: number,
  dailyUsed: number = 0
): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  optimizedConfig?: {
    maxOrderSize: number;
    minOrderSize: number;
    reason: string;
  };
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const limits = getSasaPayOrderLimits(dailyUsed);
  
  // Validate maximum order size
  if (maxOrderSize > limits.maxSingleOrder) {
    warnings.push(
      `Max order size (${formatKesAmount(maxOrderSize)}) exceeds SasaPay single transaction limit (${formatKesAmount(SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION)})`
    );
  }
  
  if (maxOrderSize > limits.maxDailyRemaining) {
    warnings.push(
      `Max order size (${formatKesAmount(maxOrderSize)}) exceeds remaining daily capacity (${formatKesAmount(limits.maxDailyRemaining)})`
    );
  }
  
  // Validate minimum order size
  if (minOrderSize > maxOrderSize) {
    warnings.push('Minimum order size cannot be greater than maximum order size');
  }
  
  if (minOrderSize < SASAPAY_LIMITS.MIN_TRANSACTION) {
    warnings.push(`Minimum order size should be at least ${formatKesAmount(SASAPAY_LIMITS.MIN_TRANSACTION)}`);
  }
  
  // Provide suggestions
  if (maxOrderSize === SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION) {
    suggestions.push('Consider setting max order to 80% of limit to allow multiple orders per day');
  }
  
  const usageStatus = getDailyUsageStatus(dailyUsed);
  if (usageStatus.status !== 'safe') {
    suggestions.push(`Daily usage is at ${usageStatus.percentage.toFixed(1)}% - consider reducing order sizes`);
  }
  
  // Provide optimized configuration
  const optimizedConfig = {
    maxOrderSize: Math.min(maxOrderSize, limits.recommendedMaxOrder),
    minOrderSize: Math.max(minOrderSize, SASAPAY_LIMITS.MIN_TRANSACTION),
    reason: 'Optimized for multiple daily transactions within SasaPay limits',
  };
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
    optimizedConfig: warnings.length > 0 ? optimizedConfig : undefined,
  };
}
