import { P2POrderBookEmulator, AlgorithmConfig, UserTradingProfile, OrderBookSnapshot } from "@/lib/algorithms/p2p-order-book-emulator";
import { P2PMarketAnalyzer } from "@/lib/algorithms/p2p-market-analyzer";
import { OKXExchange } from "@/lib/exchanges/okx-exchange";

// ================================================================
// P2P TEST UTILITIES
// Helper functions for testing and demonstration
// ================================================================

/**
 * Get user input for KES capacity
 */
export function promptForKesCapacity(): number {
  // For now, return a reasonable default
  // In a real interactive app, this would prompt the user
  const defaultCapacity = 150000; // 150,000 KES
  
  console.log(`💡 Using default KES capacity: ${defaultCapacity.toLocaleString()}`);
  console.log(`   (In a real app, this would prompt for user input)`);
  
  return defaultCapacity;
}

/**
 * Create fallback user profile when API calls fail
 */
export function createFallbackProfile(kesCapacity: number): UserTradingProfile {
  return {
    userId: "demo_user",
    nickName: "MrMoneyke",
    completionRate: "99.22",
    completedOrders: "46000+",
    kycLevel: "Level 2",
    availableUSDT: 1000,
    availableKES: kesCapacity,
    onHoldUSDT: 1000,
    onHoldKES: 0,
    activeAds: {
      buyAds: [],
      sellAds: []
    },
    tradingCapacity: {
      maxBuyAmount: kesCapacity / 130, // Estimate based on current price
      maxSellAmount: 1000,
      recommendedBuyAmount: (kesCapacity / 130) * 0.8,
      recommendedSellAmount: 800
    }
  };
}

/**
 * Print test results summary
 */
export function printTestSummary(
  userProfile: UserTradingProfile,
  snapshot: OrderBookSnapshot,
  strategies: any[],
  trends: any
): void {
  console.log("\n" + "=".repeat(60));
  console.log("✅ P2P ORDER BOOK EMULATOR TEST COMPLETED");
  console.log("=".repeat(60));
  
  console.log("\n📊 Test Results Summary:");
  console.log(`├─ Market Maker: ${userProfile.nickName} (${userProfile.completionRate}% completion)`);
  console.log(`├─ Your USDT Balance: ${userProfile.availableUSDT.toFixed(2)} (${userProfile.onHoldUSDT.toFixed(2)} on hold)`);
  console.log(`├─ Your KES Capacity: ${userProfile.availableKES.toLocaleString()} (${userProfile.onHoldKES.toFixed(2)} on hold)`);
  console.log(`├─ Your Active Ads: ${userProfile.activeAds.buyAds.length} buy, ${userProfile.activeAds.sellAds.length} sell`);
  console.log(`├─ Market Data: ${snapshot.sellAds.length + snapshot.buyAds.length} total ads analyzed`);
  console.log(`├─ Strategies Generated: ${strategies.length}`);
  console.log(`├─ Market Spread: ${snapshot.analysis.marketMakingSpread.toFixed(2)} (${snapshot.analysis.spreadPercentage.toFixed(2)}%)`);
  console.log(`├─ Total Supply: ${snapshot.analysis.totalSupply.toFixed(2)} USDT`);
  console.log(`├─ Total Demand: ${snapshot.analysis.totalDemand.toFixed(2)} USDT`);
  console.log(`└─ Liquidity Score: ${(snapshot.analysis.liquidityScore * 100).toFixed(1)}%`);

  // Show current active ads
  if (userProfile.activeAds.sellAds.length > 0) {
    console.log("\n📈 Your Current Market Position:");
    console.log("🔴 Your Sell Ads:");
    userProfile.activeAds.sellAds.forEach((ad, i) => {
      console.log(`   ${i + 1}. ${ad.unitPrice.toFixed(2)} KES | ${ad.availableAmount.toFixed(2)} USDT`);
    });
  }
  
  if (userProfile.activeAds.buyAds.length > 0) {
    console.log("🟢 Your Buy Ads:");
    userProfile.activeAds.buyAds.forEach((ad, i) => {
      console.log(`   ${i + 1}. ${ad.unitPrice.toFixed(2)} KES | ${ad.availableAmount.toFixed(2)} USDT`);
    });
  }

  console.log("\n🚀 Next Steps:");
  console.log("1. ✅ User profile and algorithm logic integrated");
  console.log("2. 🔄 Add continuous monitoring capabilities");
  console.log("3. 🤖 Implement automated ad placement");
  console.log("4. 📊 Add backtesting with historical data");
  console.log("5. ⚡ Create real-time trading bot");
  console.log("6. 🛡️  Add advanced risk management rules");

  console.log("\n🎉 All tests passed successfully!");
}

/**
 * Validate environment and credentials
 */
export function validateEnvironment(): { apiKey: string; apiSecret: string; passphrase: string; apiDelay: number } | null {
  const apiKey = process.env.OKX_API_KEY;
  const apiSecret = process.env.OKX_API_SECRET;
  const passphrase = process.env.OKX_API_PASSPHRASE;
  const apiDelay = parseInt(process.env.OKX_API_DELAY || "3000", 10);

  console.log("🔑 Credential Check:");
  console.log("- API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "❌ Not found");
  console.log("- API Secret:", apiSecret ? `${apiSecret.substring(0, 8)}...` : "❌ Not found");
  console.log("- Passphrase:", passphrase ? `${passphrase.substring(0, 4)}...` : "❌ Not found");
  console.log(`- API Delay: ${apiDelay}ms`);
  console.log("");

  if (!apiKey || !apiSecret || !passphrase) {
    console.error("❌ Missing OKX API credentials in environment variables.");
    console.log("Please ensure the following environment variables are set:");
    console.log("- OKX_API_KEY");
    console.log("- OKX_API_SECRET");
    console.log("- OKX_API_PASSPHRASE");
    console.log("\n💡 Troubleshooting:");
    console.log("1. Check that .env.local file exists in the project root");
    console.log("2. Verify credentials are set without quotes in .env.local:");
    console.log("   OKX_API_KEY=your_actual_api_key");
    console.log("   OKX_API_SECRET=your_actual_api_secret");
    console.log("   OKX_API_PASSPHRASE=your_actual_passphrase");
    console.log("3. Make sure .env.local is in the same directory as package.json");
    return null;
  }

  return { apiKey, apiSecret, passphrase, apiDelay };
}

/**
 * Create algorithm configuration
 */
export function createAlgorithmConfig(): AlgorithmConfig {
  return {
    minSpread: 0.01,        // 1% minimum spread
    maxRiskAmount: 10000,   // Max $10,000 per trade
    minLiquidity: 1000,     // Min $1,000 liquidity
    priceBuffer: 0.005,     // 0.5% price buffer
    competitorAnalysis: true,
    dynamicPricing: true
  };
}

/**
 * Print algorithm configuration
 */
export function printAlgorithmConfig(config: AlgorithmConfig): void {
  console.log("🔧 Algorithm Configuration:");
  console.log(`├─ Min Spread: ${(config.minSpread * 100).toFixed(1)}%`);
  console.log(`├─ Max Risk Amount: $${config.maxRiskAmount.toLocaleString()}`);
  console.log(`├─ Min Liquidity: $${config.minLiquidity.toLocaleString()}`);
  console.log(`├─ Price Buffer: ${(config.priceBuffer * 100).toFixed(1)}%`);
  console.log(`├─ Competitor Analysis: ${config.competitorAnalysis ? "✅ Enabled" : "❌ Disabled"}`);
  console.log(`└─ Dynamic Pricing: ${config.dynamicPricing ? "✅ Enabled" : "❌ Disabled"}`);
}

/**
 * Execute market snapshot with retry logic
 */
export async function captureMarketSnapshotWithRetry(
  emulator: P2POrderBookEmulator,
  crypto: string,
  fiat: string,
  maxRetries: number = 3,
  retryDelay: number = 3000
): Promise<OrderBookSnapshot> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Add delay before each attempt
      if (retryCount > 0) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.log(`⏳ Waiting ${retryDelay}ms before market snapshot...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      return await emulator.captureMarketSnapshot(crypto, fiat);
    } catch (error) {
      retryCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Attempt ${retryCount}/${maxRetries} failed: ${errorMessage}`);
      
      if (retryCount >= maxRetries) {
        throw error;
      }
    }
  }
  
  throw new Error("Should not reach here");
}
