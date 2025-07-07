import { OKXExchange } from "@/lib/exchanges/okx-exchange";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Debug: Check if credentials are loaded
console.log("🔍 Environment Debug:");
console.log("- OKX_API_KEY:", process.env.OKX_API_KEY ? "✅ Found" : "❌ Missing");
console.log("- OKX_API_SECRET:", process.env.OKX_API_SECRET ? "✅ Found" : "❌ Missing");
console.log("- OKX_API_PASSPHRASE:", process.env.OKX_API_PASSPHRASE ? "✅ Found" : "❌ Missing");
console.log("");

// ================================================================
// P2P ORDER BOOK EMULATOR - SUPPLY & DEMAND ANALYSIS ALGORITHM
// ================================================================

interface MarketAd {
  adId: string;
  side: "buy" | "sell";
  unitPrice: number;
  availableAmount: number;
  minOrderSize: number;
  maxOrderSize: number;
  creator: {
    userId: string;
    nickName: string;
    completionRate: string;
    completedOrders: string;
  };
  paymentMethods: string[];
  liquidity: number; // availableAmount * unitPrice
  priceScore: number; // Competitive advantage score
}

interface OrderBookSnapshot {
  timestamp: number;
  cryptoCurrency: string;
  fiatCurrency: string;
  // Supply side (sell ads - users selling crypto, we can buy)
  sellAds: MarketAd[];
  // Demand side (buy ads - users buying crypto, we can sell)
  buyAds: MarketAd[];
  // Market analysis
  analysis: {
    bestBuyPrice: number;    // Cheapest price users are SELLING crypto (we can buy from)
    bestSellPrice: number;   // Highest price users are BUYING crypto (we can sell to)
    totalSupply: number;     // Total crypto being SOLD by users (we can buy)
    totalDemand: number;     // Total crypto being BOUGHT by users (we can sell)
    marketMakingSpread: number;  // Profit opportunity between buy/sell zones
    spreadPercentage: number;
    liquidityScore: number;
    competitiveAnalysis: {
      topSellers: MarketAd[];  // Competitors selling crypto
      topBuyers: MarketAd[];   // Competitors buying crypto
    };
    optimalZones: {
      buyZone: { minPrice: number; maxPrice: number; volume: number };
      sellZone: { minPrice: number; maxPrice: number; volume: number };
    };
  };
}

interface OptimalAdStrategy {
  action: "buy" | "sell";
  suggestedPrice: number;
  suggestedAmount: number;
  profitPotential: number;
  confidence: number;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
}

interface AlgorithmConfig {
  minSpread: number;        // Minimum profitable spread (e.g., 0.01 = 1%)
  maxRiskAmount: number;    // Maximum amount to risk per trade
  minLiquidity: number;     // Minimum liquidity required
  priceBuffer: number;      // Buffer from best price (e.g., 0.005 = 0.5%)
  competitorAnalysis: boolean;
  dynamicPricing: boolean;
}

class P2POrderBookEmulator {
  private okx: OKXExchange;
  private config: AlgorithmConfig;
  private orderBookHistory: OrderBookSnapshot[] = [];

  constructor(okx: OKXExchange, config: AlgorithmConfig) {
    this.okx = okx;
    this.config = config;
  }

  /**
   * Capture real-time market snapshot by aggregating all marketplace ads
   */
  async captureMarketSnapshot(cryptoCurrency: string, fiatCurrency: string): Promise<OrderBookSnapshot> {
    console.log(`📊 Capturing market snapshot for ${cryptoCurrency}/${fiatCurrency}...`);
    
    try {
      // Get marketplace ads - this returns both buy and sell ads
      const marketplaceData = await this.okx.getMarketplaceAds({
        cryptoCurrency,
        fiatCurrency,
        side: "all", // Get all ads to see complete market
        paymentMethod: "bank"
      });

      // MARKETPLACE PERSPECTIVE TO MARKET MAKER PERSPECTIVE MAPPING:
      // Marketplace "sell ads" = Others selling USDT (have USDT, want KES) = Competition for our SELL ads
      // Marketplace "buy ads" = Others buying USDT (have KES, want USDT) = Competition for our BUY ads

      // Process marketplace sell ads (others selling USDT for KES)
      // These compete with our SELL ads (where we also want to sell USDT for KES)
      const competitorSellAds: MarketAd[] = marketplaceData.sellAds.map(ad => ({
        adId: ad.adId,
        side: "sell" as const, // They're selling USDT (like us when we place sell ads)
        unitPrice: parseFloat(ad.unitPrice),
        availableAmount: parseFloat(ad.availableAmount),
        minOrderSize: parseFloat(ad.minOrderSize),
        maxOrderSize: parseFloat(ad.maxOrderSize),
        creator: ad.creator,
        paymentMethods: ad.paymentMethods,
        liquidity: parseFloat(ad.availableAmount) * parseFloat(ad.unitPrice),
        priceScore: 0
      }));

      // Process marketplace buy ads (others buying USDT for KES)
      // These compete with our BUY ads (where we also want to buy USDT for KES)
      const competitorBuyAds: MarketAd[] = marketplaceData.buyAds.map(ad => ({
        adId: ad.adId,
        side: "buy" as const, // They're buying USDT (like us when we place buy ads)
        unitPrice: parseFloat(ad.unitPrice),
        availableAmount: parseFloat(ad.availableAmount),
        minOrderSize: parseFloat(ad.minOrderSize),
        maxOrderSize: parseFloat(ad.maxOrderSize),
        creator: ad.creator,
        paymentMethods: ad.paymentMethods,
        liquidity: parseFloat(ad.availableAmount) * parseFloat(ad.unitPrice),
        priceScore: 0
      }));

      console.log(`📋 Market Data Retrieved:`);
      console.log(`   - Competitor Sell Ads (Our competition for selling): ${competitorSellAds.length} ads`);
      console.log(`   - Competitor Buy Ads (Our competition for buying): ${competitorBuyAds.length} ads`);

      // Sort by price for analysis
      competitorSellAds.sort((a, b) => a.unitPrice - b.unitPrice); // Lowest seller competitors first
      competitorBuyAds.sort((a, b) => b.unitPrice - a.unitPrice); // Highest buyer competitors first

      // Calculate market analysis
      const analysis = this.analyzeMarket(competitorSellAds, competitorBuyAds);

      const snapshot: OrderBookSnapshot = {
        timestamp: Date.now(),
        cryptoCurrency,
        fiatCurrency,
        sellAds: competitorSellAds, // Our sell competition
        buyAds: competitorBuyAds,   // Our buy competition
        analysis
      };

      // Store in history
      this.orderBookHistory.push(snapshot);
      
      // Keep only last 100 snapshots
      if (this.orderBookHistory.length > 100) {
        this.orderBookHistory = this.orderBookHistory.slice(-100);
      }

      return snapshot;

    } catch (error) {
      console.error("❌ Error capturing market snapshot:", error);
      throw error;
    }
  }

  /**
   * Analyze market competition for market making
   * @param competitorSellAds - Other people selling USDT (competing with our sell ads)
   * @param competitorBuyAds - Other people buying USDT (competing with our buy ads)
   */
  private analyzeMarket(competitorSellAds: MarketAd[], competitorBuyAds: MarketAd[]) {
    // Best competitor buy price = highest price others are willing to pay for USDT
    // We need to place our buy ads HIGHER than this to be competitive
    const bestCompetitorBuyPrice = competitorBuyAds.length > 0 ? competitorBuyAds[0].unitPrice : 0;
    
    // Best competitor sell price = lowest price others are selling USDT for
    // We need to place our sell ads LOWER than this to be competitive
    const bestCompetitorSellPrice = competitorSellAds.length > 0 ? competitorSellAds[0].unitPrice : 0;
    
    // Total USDT being bought by competitors (we compete against this)
    const totalCompetitorBuying = competitorBuyAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Total USDT being sold by competitors (we compete against this)
    const totalCompetitorSelling = competitorSellAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Market making spread (profit opportunity)
    const marketMakingSpread = bestCompetitorSellPrice - bestCompetitorBuyPrice;
    const spreadPercentage = bestCompetitorBuyPrice > 0 ? (marketMakingSpread / bestCompetitorBuyPrice) * 100 : 0;
    
    // Calculate liquidity score
    const liquidityScore = Math.min(totalCompetitorBuying, totalCompetitorSelling) / Math.max(totalCompetitorBuying, totalCompetitorSelling, 1);
    
    // Competitive analysis - top 3 competitors in each category
    const topCompetitorSellers = competitorSellAds.slice(0, 3);  // Top 3 cheapest competitor sellers
    const topCompetitorBuyers = competitorBuyAds.slice(0, 3);    // Top 3 highest competitor buyers
    
    // Calculate optimal zones for placing our ads
    // Our sell zone: Place sell ads slightly below best competitor sell price
    const ourSellZoneMax = bestCompetitorSellPrice > 0 ? bestCompetitorSellPrice * 0.999 : 0;
    const ourSellZoneMin = bestCompetitorSellPrice > 0 ? bestCompetitorSellPrice * 0.995 : 0;
    const sellZoneVolume = competitorSellAds.slice(0, 5).reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Our buy zone: Place buy ads slightly above best competitor buy price
    const ourBuyZoneMin = bestCompetitorBuyPrice > 0 ? bestCompetitorBuyPrice * 1.001 : 0;
    const ourBuyZoneMax = bestCompetitorBuyPrice > 0 ? bestCompetitorBuyPrice * 1.005 : 0;
    const buyZoneVolume = competitorBuyAds.slice(0, 5).reduce((sum, ad) => sum + ad.availableAmount, 0);

    return {
      bestBuyPrice: bestCompetitorBuyPrice,     // Renamed for clarity: best competitor buy price
      bestSellPrice: bestCompetitorSellPrice,   // Renamed for clarity: best competitor sell price
      totalSupply: totalCompetitorSelling,      // Total USDT being sold by competitors
      totalDemand: totalCompetitorBuying,       // Total USDT being bought by competitors
      marketMakingSpread,
      spreadPercentage,
      liquidityScore,
      competitiveAnalysis: {
        topSellers: topCompetitorSellers,
        topBuyers: topCompetitorBuyers
      },
      optimalZones: {
        buyZone: { minPrice: ourBuyZoneMin, maxPrice: ourBuyZoneMax, volume: buyZoneVolume },
        sellZone: { minPrice: ourSellZoneMin, maxPrice: ourSellZoneMax, volume: sellZoneVolume }
      }
    };
  }

  /**
   * Calculate optimal ad placement strategy
   */
  calculateOptimalStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy[] {
    const strategies: OptimalAdStrategy[] = [];
    const { analysis } = snapshot;

    // Strategy 1: Buy Low (if good supply available)
    if (analysis.totalSupply > 0 && analysis.bestBuyPrice > 0) {
      const buyStrategy = this.calculateBuyStrategy(snapshot);
      if (buyStrategy) strategies.push(buyStrategy);
    }

    // Strategy 2: Sell High (if good demand available)
    if (analysis.totalDemand > 0 && analysis.bestSellPrice > 0) {
      const sellStrategy = this.calculateSellStrategy(snapshot);
      if (sellStrategy) strategies.push(sellStrategy);
    }

    // Strategy 3: Market Making (if spread is profitable)
    if (analysis.marketMakingSpread > 0 && analysis.spreadPercentage > this.config.minSpread * 100) {
      const marketMakingStrategy = this.calculateMarketMakingStrategy(snapshot);
      if (marketMakingStrategy) strategies.push(marketMakingStrategy);
    }

    return strategies;
  }

  /**
   * Calculate buy strategy (place competitive buy ads)
   * Our buy ads compete with other people buying USDT
   */
  private calculateBuyStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy | null {
    const { analysis, buyAds: competitorBuyAds } = snapshot;
    
    if (competitorBuyAds.length === 0) {
      // No competition for buying - great opportunity!
      const basePrice = analysis.bestSellPrice > 0 ? analysis.bestSellPrice * 0.95 : 130; // Default fallback
      return {
        action: "buy",
        suggestedPrice: basePrice,
        suggestedAmount: Math.min(1000, this.config.maxRiskAmount / basePrice),
        profitPotential: (analysis.bestSellPrice - basePrice) * 1000,
        confidence: 0.9,
        reasoning: `No buy competition! Place buy ads at ${basePrice.toFixed(2)} - no one else is buying USDT.`,
        riskLevel: "low"
      };
    }

    // Compete by placing buy ads HIGHER than competitor buy prices
    const competitivePrice = analysis.optimalZones.buyZone.maxPrice;
    const suggestedAmount = Math.min(
      analysis.optimalZones.buyZone.volume * 0.3, 
      this.config.maxRiskAmount / competitivePrice
    );
    
    // Calculate profit potential (sell price - buy price)
    const profitPerUnit = analysis.bestSellPrice - competitivePrice;
    const profitPotential = profitPerUnit * suggestedAmount;
    
    const confidence = Math.min(
      analysis.liquidityScore * 0.4 +
      (analysis.totalDemand / (analysis.totalSupply + 1)) * 0.4 +
      (profitPotential > 0 ? 0.2 : 0),
      1
    );

    return {
      action: "buy",
      suggestedPrice: competitivePrice,
      suggestedAmount,
      profitPotential,
      confidence,
      reasoning: `Compete with ${competitorBuyAds.length} buyers. Place buy ads at ${competitivePrice.toFixed(2)} (above their ${analysis.bestBuyPrice.toFixed(2)}). Potential profit: ${profitPerUnit.toFixed(2)} per USDT.`,
      riskLevel: profitPotential > 0 ? "low" : "medium"
    };
  }

  /**
   * Calculate sell strategy (place competitive sell ads)
   * Our sell ads compete with other people selling USDT
   */
  private calculateSellStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy | null {
    const { analysis, sellAds: competitorSellAds } = snapshot;
    
    if (competitorSellAds.length === 0) {
      // No competition for selling - great opportunity!
      const basePrice = analysis.bestBuyPrice > 0 ? analysis.bestBuyPrice * 1.05 : 135; // Default fallback
      return {
        action: "sell",
        suggestedPrice: basePrice,
        suggestedAmount: Math.min(1000, this.config.maxRiskAmount / basePrice),
        profitPotential: (basePrice - analysis.bestBuyPrice) * 1000,
        confidence: 0.9,
        reasoning: `No sell competition! Place sell ads at ${basePrice.toFixed(2)} - no one else is selling USDT.`,
        riskLevel: "low"
      };
    }

    // Compete by placing sell ads LOWER than competitor sell prices
    const competitivePrice = analysis.optimalZones.sellZone.minPrice;
    const suggestedAmount = Math.min(
      analysis.optimalZones.sellZone.volume * 0.3,
      this.config.maxRiskAmount / competitivePrice
    );
    
    // Calculate profit potential (sell price - buy price)
    const profitPerUnit = competitivePrice - analysis.bestBuyPrice;
    const profitPotential = profitPerUnit * suggestedAmount;
    
    const confidence = Math.min(
      analysis.liquidityScore * 0.4 +
      (analysis.totalSupply / (analysis.totalDemand + 1)) * 0.4 +
      (profitPotential > 0 ? 0.2 : 0),
      1
    );

    return {
      action: "sell",
      suggestedPrice: competitivePrice,
      suggestedAmount,
      profitPotential,
      confidence,
      reasoning: `Compete with ${competitorSellAds.length} sellers. Place sell ads at ${competitivePrice.toFixed(2)} (below their ${analysis.bestSellPrice.toFixed(2)}). Potential profit: ${profitPerUnit.toFixed(2)} per USDT.`,
      riskLevel: profitPotential > 0 ? "low" : "medium"
    };
  }

  /**
   * Calculate market making strategy (profit from spread between competitors)
   */
  private calculateMarketMakingStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy | null {
    const { analysis } = snapshot;
    
    if (analysis.marketMakingSpread <= 0) return null;

    // Our optimal placement:
    // - Buy ads: Slightly above best competitor buy price
    // - Sell ads: Slightly below best competitor sell price
    const ourBuyPrice = analysis.optimalZones.buyZone.maxPrice;   // Above competitor buyers
    const ourSellPrice = analysis.optimalZones.sellZone.minPrice; // Below competitor sellers
    
    if (ourBuyPrice >= ourSellPrice) {
      // No profitable spread available
      return null;
    }
    
    const maxAmount = this.config.maxRiskAmount / ourBuyPrice;
    const suggestedAmount = Math.min(maxAmount, analysis.totalSupply * 0.1);
    
    const profitPotential = (ourSellPrice - ourBuyPrice) * suggestedAmount;
    const confidence = analysis.liquidityScore * 0.6 + (analysis.spreadPercentage / 10) * 0.4;

    return {
      action: "buy", // Start with buy order
      suggestedPrice: ourBuyPrice,
      suggestedAmount,
      profitPotential,
      confidence,
      reasoning: `Market making opportunity. Buy at ${ourBuyPrice.toFixed(2)} (above competitor buyers), sell at ${ourSellPrice.toFixed(2)} (below competitor sellers). Spread: ${(ourSellPrice - ourBuyPrice).toFixed(2)}.`,
      riskLevel: analysis.spreadPercentage > 2 ? "low" : "medium"
    };
  }

  /**
   * Monitor market trends and detect opportunities
   */
  detectMarketTrends(snapshots: OrderBookSnapshot[]): {
    trend: "bullish" | "bearish" | "sideways";
    volatility: number;
    opportunities: string[];
  } {
    if (snapshots.length < 2) {
      return { trend: "sideways", volatility: 0, opportunities: [] };
    }

    const recent = snapshots.slice(-10);
    const priceChanges = recent.map((snapshot, i) => {
      if (i === 0) return 0;
      return snapshot.analysis.bestBuyPrice - recent[i - 1].analysis.bestBuyPrice;
    }).slice(1);

    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const volatility = Math.sqrt(
      priceChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / priceChanges.length
    );

    let trend: "bullish" | "bearish" | "sideways";
    if (avgChange > 0.01) trend = "bullish";
    else if (avgChange < -0.01) trend = "bearish";
    else trend = "sideways";

    const opportunities: string[] = [];
    
    // Detect opportunities based on trends
    if (trend === "bullish" && volatility < 0.5) {
      opportunities.push("🔥 Bullish trend with low volatility - good for buy orders");
    }
    if (trend === "bearish" && volatility < 0.5) {
      opportunities.push("📉 Bearish trend with low volatility - good for sell orders");
    }
    if (volatility > 1.0) {
      opportunities.push("⚡ High volatility detected - market making opportunities");
    }

    return { trend, volatility, opportunities };
  }

  /**
   * Print comprehensive market analysis
   */
  printMarketAnalysis(snapshot: OrderBookSnapshot, strategies: OptimalAdStrategy[]) {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 P2P ORDER BOOK ANALYSIS");
    console.log("=".repeat(60));
    
    console.log(`📅 Timestamp: ${new Date(snapshot.timestamp).toLocaleString()}`);
    console.log(`💱 Market: ${snapshot.cryptoCurrency}/${snapshot.fiatCurrency}`);
    
    console.log("\n📊 MARKET OVERVIEW:");
    console.log(`├─ Best Competitor Buy Price: ${snapshot.analysis.bestBuyPrice.toFixed(2)} (Others buying USDT)`);
    console.log(`├─ Best Competitor Sell Price: ${snapshot.analysis.bestSellPrice.toFixed(2)} (Others selling USDT)`);
    console.log(`├─ Market Making Spread: ${snapshot.analysis.marketMakingSpread.toFixed(2)} (${snapshot.analysis.spreadPercentage.toFixed(2)}%)`);
    console.log(`├─ Total Competitor Buying: ${snapshot.analysis.totalDemand.toFixed(2)} ${snapshot.cryptoCurrency}`);
    console.log(`├─ Total Competitor Selling: ${snapshot.analysis.totalSupply.toFixed(2)} ${snapshot.cryptoCurrency}`);
    console.log(`└─ Liquidity Score: ${(snapshot.analysis.liquidityScore * 100).toFixed(1)}%`);

    console.log("\n🔺 BUY COMPETITION ANALYSIS (Others Buying USDT - We Compete Here):");
    if (snapshot.buyAds.length === 0) {
      console.log("   No buy competition - excellent opportunity to place buy ads!");
    } else {
      snapshot.buyAds.slice(0, 5).forEach((ad, i) => {
        console.log(`${i + 1}. ${ad.unitPrice.toFixed(2)} KES | ${ad.availableAmount.toFixed(2)} ${snapshot.cryptoCurrency} | ${ad.creator.nickName}`);
      });
    }

    console.log("\n🔻 SELL COMPETITION ANALYSIS (Others Selling USDT - We Compete Here):");
    if (snapshot.sellAds.length === 0) {
      console.log("   No sell competition - excellent opportunity to place sell ads!");
    } else {
      snapshot.sellAds.slice(0, 5).forEach((ad, i) => {
        console.log(`${i + 1}. ${ad.unitPrice.toFixed(2)} KES | ${ad.availableAmount.toFixed(2)} ${snapshot.cryptoCurrency} | ${ad.creator.nickName}`);
      });
    }

    console.log("\n🎯 OPTIMAL STRATEGIES:");
    strategies.forEach((strategy, i) => {
      const riskEmoji = strategy.riskLevel === "low" ? "🟢" : strategy.riskLevel === "medium" ? "🟡" : "🔴";
      console.log(`${i + 1}. ${strategy.action.toUpperCase()} Strategy ${riskEmoji}`);
      console.log(`   ├─ Price: ${strategy.suggestedPrice.toFixed(2)}`);
      console.log(`   ├─ Amount: ${strategy.suggestedAmount.toFixed(2)} ${snapshot.cryptoCurrency}`);
      console.log(`   ├─ Profit Potential: ${strategy.profitPotential.toFixed(2)} ${snapshot.fiatCurrency}`);
      console.log(`   ├─ Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
      console.log(`   └─ Reasoning: ${strategy.reasoning}`);
    });

    // Market trends
    if (this.orderBookHistory.length > 1) {
      const trends = this.detectMarketTrends(this.orderBookHistory);
      console.log("\n📈 MARKET TRENDS:");
      console.log(`├─ Trend: ${trends.trend.toUpperCase()}`);
      console.log(`├─ Volatility: ${trends.volatility.toFixed(2)}`);
      console.log(`└─ Opportunities:`);
      trends.opportunities.forEach(opp => console.log(`   ${opp}`));
    }

    // Market making zones
    console.log("\n🎯 OPTIMAL AD PLACEMENT ZONES:");
    console.log(`🟢 Buy Zone (Place your buy ads):`);
    console.log(`   ├─ Price Range: ${snapshot.analysis.optimalZones.buyZone.minPrice.toFixed(2)} - ${snapshot.analysis.optimalZones.buyZone.maxPrice.toFixed(2)}`);
    console.log(`   └─ Available Volume: ${snapshot.analysis.optimalZones.buyZone.volume.toFixed(2)} ${snapshot.cryptoCurrency}`);
    console.log(`🔴 Sell Zone (Place your sell ads):`);
    console.log(`   ├─ Price Range: ${snapshot.analysis.optimalZones.sellZone.minPrice.toFixed(2)} - ${snapshot.analysis.optimalZones.sellZone.maxPrice.toFixed(2)}`);
    console.log(`   └─ Available Volume: ${snapshot.analysis.optimalZones.sellZone.volume.toFixed(2)} ${snapshot.cryptoCurrency}`);
  }
}

// Main execution function
export async function runP2POrderBookEmulator() {
  console.log("🚀 Starting P2P Order Book Emulator Algorithm...\n");
  
  // Get API credentials
  const apiKey = process.env.OKX_API_KEY;
  const apiSecret = process.env.OKX_API_SECRET;
  const passphrase = process.env.OKX_API_PASSPHRASE;

  console.log("🔑 Credential Check:");
  console.log("- API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "❌ Not found");
  console.log("- API Secret:", apiSecret ? `${apiSecret.substring(0, 8)}...` : "❌ Not found");
  console.log("- Passphrase:", passphrase ? `${passphrase.substring(0, 4)}...` : "❌ Not found");
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
    return;
  }

  const okx = new OKXExchange(apiKey, apiSecret, passphrase);

  if (!okx.isConnected) {
    console.error("❌ Failed to connect to OKX – missing credentials.");
    return;
  }

  console.log("✅ OKX Connected\n");

  // Algorithm configuration
  const config: AlgorithmConfig = {
    minSpread: 0.01,        // 1% minimum spread
    maxRiskAmount: 10000,   // Max $10,000 per trade
    minLiquidity: 1000,     // Min $1,000 liquidity
    priceBuffer: 0.005,     // 0.5% price buffer
    competitorAnalysis: true,
    dynamicPricing: true
  };

  const emulator = new P2POrderBookEmulator(okx, config);

  try {
    // Focus on USDT/KES market only (primary trading pair)
    const pair = { crypto: "USDT", fiat: "KES" };
    
    console.log(`\n🔄 Analyzing ${pair.crypto}/${pair.fiat} market for market making opportunities...`);
    
    // Capture market snapshot
    const snapshot = await emulator.captureMarketSnapshot(pair.crypto, pair.fiat);
    
    // Calculate optimal ad placement strategies
    const strategies = emulator.calculateOptimalStrategy(snapshot);
    
    // Print comprehensive analysis
    emulator.printMarketAnalysis(snapshot, strategies);

    console.log("\n" + "=".repeat(60));
    console.log("✅ P2P ORDER BOOK EMULATOR COMPLETED");
    console.log("=".repeat(60));
    console.log("\n💡 Next Steps:");
    console.log("1. Implement automatic ad placement based on strategies");
    console.log("2. Add real-time monitoring and alerts");
    console.log("3. Implement risk management rules");
    console.log("4. Add backtesting capabilities");
    console.log("5. Create automated trading bot");

  } catch (error) {
    console.error("❌ Error in P2P Order Book Emulator:", error);
  }
}

// Run the emulator if this file is executed directly
if (require.main === module) {
  runP2POrderBookEmulator().catch(console.error);
}
