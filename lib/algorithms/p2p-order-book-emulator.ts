import { OKXExchange } from "@/lib/exchanges/okx-exchange";

// ================================================================
// P2P ORDER BOOK EMULATOR - SUPPLY & DEMAND ANALYSIS ALGORITHM
// ================================================================

export interface MarketAd {
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

export interface OrderBookSnapshot {
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

export interface OptimalAdStrategy {
  action: "buy" | "sell";
  suggestedPrice: number;
  suggestedAmount: number;
  profitPotential: number;
  confidence: number;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
}

export interface AlgorithmConfig {
  minSpread: number;        // Minimum profitable spread (e.g., 0.01 = 1%)
  maxRiskAmount: number;    // Maximum amount to risk per trade
  minLiquidity: number;     // Minimum liquidity required
  priceBuffer: number;      // Buffer from best price (e.g., 0.005 = 0.5%)
  competitorAnalysis: boolean;
  dynamicPricing: boolean;
}

export interface UserTradingProfile {
  userId: string;
  nickName: string;
  completionRate: string;
  completedOrders: string;
  kycLevel: string;
  availableUSDT: number;
  availableKES: number;      // Calculated from active buy ads (OKX doesn't hold fiat)
  onHoldUSDT: number;
  onHoldKES: number;         // Always 0 (OKX doesn't hold fiat)
  activeAds: {
    buyAds: MarketAd[];   // Our current buy ads (we're buying USDT with KES)
    sellAds: MarketAd[];  // Our current sell ads (we're selling USDT for KES)
  };
  tradingCapacity: {
    maxBuyAmount: number;    // Max USDT we can buy (based on KES from buy ads)
    maxSellAmount: number;   // Max USDT we can sell (based on USDT balance)
    recommendedBuyAmount: number;  // Safe buy amount
    recommendedSellAmount: number; // Safe sell amount
  };
}

export interface MarketTrends {
  trend: "bullish" | "bearish" | "sideways";
  volatility: number;
  opportunities: string[];
}

export class P2POrderBookEmulator {
  private okx: OKXExchange;
  private config: AlgorithmConfig;
  private orderBookHistory: OrderBookSnapshot[] = [];
  private userProfile: UserTradingProfile | null = null;

  /**
   * Utility function to add delays between API calls
   */
  private async delay(ms: number, message?: string): Promise<void> {
    if (message) {
      console.log(`   ⏳ ${message} (${ms}ms)...`);
    }
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry wrapper for API calls with exponential backoff
   */
  private async retryApiCall<T>(
    apiCall: () => Promise<T>, 
    callName: string, 
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`   ⏳ Retry ${attempt}/${maxRetries} for ${callName} in ${delay}ms...`);
          await this.delay(delay);
        }
        
        const result = await apiCall();
        if (attempt > 1) {
          console.log(`   ✅ ${callName} succeeded on attempt ${attempt}`);
        }
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.log(`   ⚠️ ${callName} failed on attempt ${attempt}:`, error instanceof Error ? error.message : String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError!;
  }

  constructor(okx: OKXExchange, config: AlgorithmConfig) {
    this.okx = okx;
    this.config = config;
  }

  /**
   * Initialize user trading profile by fetching real data from OKX
   */
  async initializeUserProfile(cryptoCurrency: string = "USDT", fiatCurrency: string = "KES"): Promise<UserTradingProfile> {
    console.log("👤 Fetching your trading profile...");
    
    // Initialize with fallback values
    let userInfo: any = null;
    let usdtBalance: any = null;
    let kesBalance: any = null;
    let activeAds: any = null;
    let activeSellAds: any = null;
    
    // Step 1: Get user basic info
    try {
      userInfo = await this.retryApiCall(
        () => this.okx.getUserInfo(),
        "getUserInfo"
      );
      console.log(`   ✅ User: ${userInfo.nickName} (${userInfo.completionRate}% completion rate)`);
    } catch (error) {
      console.log(`   ❌ Failed to get user info, using fallback`);
      userInfo = {
        userId: "demo_user",
        nickName: "MrMoneyke",
        completionRate: "99.22",
        completedOrders: "1000+",
        kycLevel: "Level 3"
      };
    }

    // Step 2: Get USDT balance only (OKX doesn't hold fiat currencies like KES)
    await this.delay(2000, "Waiting before fetching USDT balance");
    
    try {
      usdtBalance = await this.retryApiCall(
        () => this.okx.getBalance(cryptoCurrency),
        `getBalance(${cryptoCurrency})`
      );
      console.log(`   💰 USDT Balance: ${usdtBalance.availableAmount} (${usdtBalance.onHoldAmount} on hold)`);
    } catch (error) {
      console.log(`   ❌ Failed to get USDT balance, using fallback`);
      usdtBalance = { availableAmount: "1000", onHoldAmount: "0" };
    }

    // Note: KES is not held by OKX - it's calculated from active buy ads

    // Step 3: Get active ads with individual retry
    await this.delay(2000, "Waiting before fetching buy ads");
    
    try {
      activeAds = await this.retryApiCall(
        () => this.okx.getActiveAds({
          side: "buy",
          cryptoCurrency,
          fiatCurrency
        }),
        "getActiveAds(buy)"
      );
    } catch (error) {
      console.log(`   ❌ Failed to get buy ads, using fallback`);
      activeAds = { ads: [] };
    }

    await this.delay(2000, "Waiting before fetching sell ads");
    
    try {
      activeSellAds = await this.retryApiCall(
        () => this.okx.getActiveAds({
          side: "sell",
          cryptoCurrency,
          fiatCurrency
        }),
        "getActiveAds(sell)"
      );
    } catch (error) {
      console.log(`   ❌ Failed to get sell ads, using fallback`);
      activeSellAds = { ads: [] };
    }

    // Process the data (whether real or fallback)
    const allMyAds = [...(activeAds?.ads || []), ...(activeSellAds?.ads || [])];
    
    // Separate your buy and sell ads
    const myBuyAds = allMyAds.filter(ad => ad.side === "buy").map(ad => ({
      adId: ad.adId,
      side: "buy" as const,
      unitPrice: parseFloat(ad.unitPrice),
      availableAmount: parseFloat(ad.availableAmount),
      minOrderSize: parseFloat(ad.minOrderSize),
      maxOrderSize: parseFloat(ad.maxOrderSize),
      creator: ad.creator,
      paymentMethods: ad.paymentMethods,
      liquidity: parseFloat(ad.availableAmount) * parseFloat(ad.unitPrice),
      priceScore: 0
    }));
    
    const mySellAds = allMyAds.filter(ad => ad.side === "sell").map(ad => ({
      adId: ad.adId,
      side: "sell" as const,
      unitPrice: parseFloat(ad.unitPrice),
      availableAmount: parseFloat(ad.availableAmount),
      minOrderSize: parseFloat(ad.minOrderSize),
      maxOrderSize: parseFloat(ad.maxOrderSize),
      creator: ad.creator,
      paymentMethods: ad.paymentMethods,
      liquidity: parseFloat(ad.availableAmount) * parseFloat(ad.unitPrice),
      priceScore: 0
    }));
    
    console.log(`   📈 Active Ads: ${myBuyAds.length} buy ads, ${mySellAds.length} sell ads`);
    
    // Calculate trading capacity based on available balances
    const availableUSDT = parseFloat(usdtBalance.availableAmount);
    const onHoldUSDT = parseFloat(usdtBalance.onHoldAmount);
    
    // Calculate KES from active buy ads (OKX doesn't hold fiat currencies)
    // KES available = sum of all your buy ads' liquidity (price * amount)
    const availableKES = myBuyAds.reduce((total, ad) => total + (ad.unitPrice * ad.availableAmount), 0);
    const onHoldKES = 0; // OKX doesn't hold KES, so it's always 0
    
    console.log(`   💰 Calculated KES from buy ads: ${availableKES.toFixed(2)} KES`);
    console.log(`   💡 Note: KES is calculated from your ${myBuyAds.length} active buy ads`);
    
    // Estimate current market price for capacity calculations
    let estimatedPrice = 130; // Default fallback
    if (myBuyAds.length > 0) estimatedPrice = myBuyAds[0].unitPrice;
    else if (mySellAds.length > 0) estimatedPrice = mySellAds[0].unitPrice;
    
    const maxBuyAmount = availableKES / estimatedPrice; // Max USDT we can buy with available KES
    const maxSellAmount = availableUSDT; // Max USDT we can sell
    
    // Conservative recommendations (use 80% of available balance)
    const recommendedBuyAmount = maxBuyAmount * 0.8;
    const recommendedSellAmount = maxSellAmount * 0.8;
    
    this.userProfile = {
      userId: userInfo.userId,
      nickName: userInfo.nickName,
      completionRate: userInfo.completionRate,
      completedOrders: userInfo.completedOrders,
      kycLevel: userInfo.kycLevel,
      availableUSDT,
      availableKES,
      onHoldUSDT,
      onHoldKES,
      activeAds: {
        buyAds: myBuyAds,
        sellAds: mySellAds
      },
      tradingCapacity: {
        maxBuyAmount,
        maxSellAmount,
        recommendedBuyAmount,
        recommendedSellAmount
      }
    };
    
    console.log(`   ✅ Trading Profile Initialized`);
    console.log(`   📊 Capacity: Buy up to ${recommendedBuyAmount.toFixed(2)} USDT, Sell up to ${recommendedSellAmount.toFixed(2)} USDT`);
    
    return this.userProfile;
  }

  /**
   * Capture real-time market snapshot by aggregating all marketplace ads
   */
  async captureMarketSnapshot(cryptoCurrency: string, fiatCurrency: string): Promise<OrderBookSnapshot> {
    console.log(`📊 Capturing market snapshot for ${cryptoCurrency}/${fiatCurrency}...`);
    
    try {
      // Add delay before marketplace API call
      await this.delay(1000, "Waiting before marketplace API call");
      
      // Get marketplace ads with retry logic
      const marketplaceData = await this.retryApiCall(
        () => this.okx.getMarketplaceAds({
          cryptoCurrency,
          fiatCurrency,
          side: "all", // Get all ads to see complete market
          paymentMethod: "all"
        }),
        "getMarketplaceAds"
      );

      // Process sell ads (users selling crypto - WE CAN BUY FROM THEM)
      // These are potential suppliers we can buy crypto from
      const sellAds: MarketAd[] = marketplaceData.sellAds.map(ad => ({
        adId: ad.adId,
        side: "sell" as const,
        unitPrice: parseFloat(ad.unitPrice),
        availableAmount: parseFloat(ad.availableAmount),
        minOrderSize: parseFloat(ad.minOrderSize),
        maxOrderSize: parseFloat(ad.maxOrderSize),
        creator: ad.creator,
        paymentMethods: ad.paymentMethods,
        liquidity: parseFloat(ad.availableAmount) * parseFloat(ad.unitPrice),
        priceScore: 0
      }));

      // Process buy ads (users buying crypto - WE CAN SELL TO THEM)  
      // These are potential customers we can sell crypto to
      const buyAds: MarketAd[] = marketplaceData.buyAds.map(ad => ({
        adId: ad.adId,
        side: "buy" as const,
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
      console.log(`   - Sell Ads (Supply): ${sellAds.length} ads`);
      console.log(`   - Buy Ads (Demand): ${buyAds.length} ads`);

      // Sort by price for analysis
      sellAds.sort((a, b) => a.unitPrice - b.unitPrice); // Cheapest sellers first
      buyAds.sort((a, b) => b.unitPrice - a.unitPrice);  // Highest buyers first

      // Calculate market analysis
      const analysis = this.analyzeMarket(sellAds, buyAds);

      const snapshot: OrderBookSnapshot = {
        timestamp: Date.now(),
        cryptoCurrency,
        fiatCurrency,
        sellAds,
        buyAds,
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
   * Analyze market supply/demand dynamics for market making
   */
  private analyzeMarket(sellAds: MarketAd[], buyAds: MarketAd[]) {
    // Sell ads = Users selling crypto = Supply (we can place BUY orders to compete)
    const bestBuyPrice = sellAds.length > 0 ? sellAds[0].unitPrice : 0;
    
    // Buy ads = Users buying crypto = Demand (we can place SELL orders to compete)
    const bestSellPrice = buyAds.length > 0 ? buyAds[0].unitPrice : 0;
    
    // Total crypto being sold by users (supply)
    const totalSupply = sellAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Total crypto being bought by users (demand)
    const totalDemand = buyAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Market making spread (profit opportunity)
    const marketMakingSpread = bestSellPrice - bestBuyPrice;
    const spreadPercentage = bestBuyPrice > 0 ? (marketMakingSpread / bestBuyPrice) * 100 : 0;
    
    // Calculate liquidity score
    const liquidityScore = Math.min(totalSupply, totalDemand) / Math.max(totalSupply, totalDemand, 1);
    
    // Competitive analysis - top 5 competitors in each category
    const topSellers = sellAds.slice(0, 5);  // Top 5 cheapest sellers
    const topBuyers = buyAds.slice(0, 5);    // Top 5 highest buyers
    
    // Calculate volume-weighted optimal zones for placing our ads
    const volumeWeightedBuyPrice = this.calculateVolumeWeightedBuyPrice(sellAds);
    const adLimitAwareSellPrice = this.calculateAdLimitAwareSellPrice(buyAds, 1000); // Assume 1000 USDT for calculation
    
    const sellZoneMin = adLimitAwareSellPrice - 0.10;
    const sellZoneMax = adLimitAwareSellPrice + 0.10;
    const sellZoneVolume = buyAds.slice(0, 5).reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    const buyZoneMin = volumeWeightedBuyPrice - 0.10;
    const buyZoneMax = volumeWeightedBuyPrice + 0.10;
    const buyZoneVolume = sellAds.slice(0, 5).reduce((sum, ad) => sum + ad.availableAmount, 0);

    return {
      bestBuyPrice,
      bestSellPrice,
      totalSupply,
      totalDemand,
      marketMakingSpread,
      spreadPercentage,
      liquidityScore,
      competitiveAnalysis: {
        topSellers,
        topBuyers
      },
      optimalZones: {
        buyZone: { minPrice: buyZoneMin, maxPrice: buyZoneMax, volume: buyZoneVolume },
        sellZone: { minPrice: sellZoneMin, maxPrice: sellZoneMax, volume: sellZoneVolume }
      }
    };
  }

  /**
   * Calculate optimal ad placement strategy based on user's real trading profile
   */
  calculateOptimalStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy[] {
    if (!this.userProfile) {
      console.warn("⚠️ User profile not initialized. Call initializeUserProfile() first.");
      return [];
    }

    const strategies: OptimalAdStrategy[] = [];
    const { analysis } = snapshot;

    // Strategy 1: Buy Low (if we have KES to buy USDT and there's supply)
    if (this.userProfile.availableKES > 100 && analysis.totalSupply > 0 && analysis.bestBuyPrice > 0) {
      const buyStrategy = this.calculateBuyStrategy(snapshot);
      if (buyStrategy) strategies.push(buyStrategy);
    }

    // Strategy 2: Sell High (if we have USDT to sell and there's demand)
    if (this.userProfile.availableUSDT > 10 && analysis.totalDemand > 0 && analysis.bestSellPrice > 0) {
      const sellStrategy = this.calculateSellStrategy(snapshot);
      if (sellStrategy) strategies.push(sellStrategy);
    }

    // Strategy 3: Market Making (if we have both currencies and spread is profitable)
    if (this.userProfile.availableUSDT > 10 && this.userProfile.availableKES > 100 && 
        analysis.marketMakingSpread > 0 && analysis.spreadPercentage > this.config.minSpread * 100) {
      const marketMakingStrategy = this.calculateMarketMakingStrategy(snapshot);
      if (marketMakingStrategy) strategies.push(marketMakingStrategy);
    }

    return strategies;
  }

  /**
   * Calculate buy strategy using volume-weighted analysis and ad limits
   */
  private calculateBuyStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy | null {
    const { analysis, sellAds } = snapshot;
    const user = this.userProfile!;
    
    if (sellAds.length === 0) {
      // No supply competition - great opportunity!
      const suggestedPrice = analysis.bestSellPrice * 0.98; // 2% below demand price
      const maxAffordable = user.availableKES / suggestedPrice;
      const suggestedAmount = Math.min(maxAffordable, user.tradingCapacity.recommendedBuyAmount);
      
      return {
        action: "buy",
        suggestedPrice,
        suggestedAmount,
        profitPotential: analysis.bestSellPrice * 0.02 * suggestedAmount,
        confidence: 0.9,
        reasoning: `No supply competition! You can afford ${maxAffordable.toFixed(2)} USDT. Place buy ad at ${suggestedPrice.toFixed(2)} to capture sellers.`,
        riskLevel: "low"
      };
    }

    // Volume-weighted analysis: Find the optimal price considering volume and liquidity
    const volumeWeightedPrice = this.calculateVolumeWeightedBuyPrice(sellAds);
    
    // Check your existing buy ads
    const myBuyAds = user.activeAds.buyAds;
    const myHighestBuyPrice = myBuyAds.length > 0 ? Math.max(...myBuyAds.map(ad => ad.unitPrice)) : 0;
    
    // Calculate competitive price based on volume analysis
    const competitivePrice = volumeWeightedPrice;
    const maxAffordable = user.availableKES / competitivePrice;
    const suggestedAmount = Math.min(
      maxAffordable,
      user.tradingCapacity.recommendedBuyAmount,
      this.calculateOptimalBuyAmount(sellAds, competitivePrice)
    );
    
    // Calculate profit potential (sell price - buy price)
    const profitPerUnit = analysis.bestSellPrice - competitivePrice;
    const profitPotential = profitPerUnit * suggestedAmount;
    
    // Check if this price is significantly better than your current ads
    const improvement = myHighestBuyPrice > 0 ? competitivePrice - myHighestBuyPrice : competitivePrice;
    
    const confidence = Math.min(
      analysis.liquidityScore * 0.3 +
      (user.tradingCapacity.recommendedBuyAmount > suggestedAmount ? 0.3 : 0.1) +
      (profitPotential > 0 ? 0.3 : 0) +
      (improvement > 0 ? 0.1 : 0),
      1
    );

    let reasoning = `Volume-weighted buy price: ${competitivePrice.toFixed(2)} (you can afford ${maxAffordable.toFixed(2)} USDT). `;
    reasoning += `Competing with ${sellAds.length} sellers. `;
    reasoning += myHighestBuyPrice > 0 ? `Current highest: ${myHighestBuyPrice.toFixed(2)}. ` : `No current buy ads. `;
    reasoning += `Potential profit: ${profitPerUnit.toFixed(2)} per USDT. `;
    reasoning += `Strategy: Target high-volume sellers, avoid low-volume outliers.`;

    return {
      action: "buy",
      suggestedPrice: competitivePrice,
      suggestedAmount,
      profitPotential,
      confidence,
      reasoning,
      riskLevel: profitPotential > 0 && suggestedAmount <= user.tradingCapacity.recommendedBuyAmount ? "low" : "medium"
    };
  }

  /**
   * Calculate volume-weighted optimal buy price
   * Avoids low-volume outliers and focuses on substantial liquidity
   */
  private calculateVolumeWeightedBuyPrice(sellAds: MarketAd[]): number {
    if (sellAds.length === 0) return 0;
    
    // Filter out very low volume ads (less than 50 USDT)
    const substantialAds = sellAds.filter(ad => ad.availableAmount >= 50);
    
    if (substantialAds.length === 0) {
      // If no substantial ads, use the second cheapest price to avoid outliers
      return sellAds.length > 1 ? sellAds[1].unitPrice : sellAds[0].unitPrice;
    }
    
    // Calculate cumulative volume and find the 70th percentile volume point
    const totalVolume = substantialAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
    const targetVolume = totalVolume * 0.7; // 70th percentile
    
    let cumulativeVolume = 0;
    let volumeWeightedPrice = 0;
    
    for (const ad of substantialAds) {
      cumulativeVolume += ad.availableAmount;
      volumeWeightedPrice = ad.unitPrice;
      
      if (cumulativeVolume >= targetVolume) {
        break;
      }
    }
    
    // Add small buffer above the volume-weighted price to be competitive
    return volumeWeightedPrice + 0.05; // 5 cents above
  }

  /**
   * Calculate optimal buy amount considering competition and volume
   */
  private calculateOptimalBuyAmount(sellAds: MarketAd[], targetPrice: number): number {
    // Find ads at or below our target price
    const competitiveAds = sellAds.filter(ad => ad.unitPrice <= targetPrice);
    
    if (competitiveAds.length === 0) return 0;
    
    // Calculate total available volume at competitive prices
    const totalCompetitiveVolume = competitiveAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Suggest 30% of available competitive volume to avoid dominating the market
    return totalCompetitiveVolume * 0.3;
  }

  /**
   * Calculate sell strategy using ad limits and high-volume buyer analysis
   */
  private calculateSellStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy | null {
    const { analysis, buyAds } = snapshot;
    const user = this.userProfile!;
    
    if (buyAds.length === 0) {
      // No demand competition - great opportunity!
      if (analysis.bestBuyPrice > 0) {
        const suggestedPrice = analysis.bestBuyPrice * 1.02; // 2% above supply price
        const suggestedAmount = Math.min(user.availableUSDT, user.tradingCapacity.recommendedSellAmount);
        
        return {
          action: "sell",
          suggestedPrice,
          suggestedAmount,
          profitPotential: analysis.bestBuyPrice * 0.02 * suggestedAmount,
          confidence: 0.9,
          reasoning: `No demand competition! You have ${user.availableUSDT.toFixed(2)} USDT. Place sell ad at ${suggestedPrice.toFixed(2)} to capture buyers.`,
          riskLevel: "low"
        };
      }
      return null;
    }

    // Ad limit-aware analysis: Find buyers with high limits and good volume
    const optimalSellPrice = this.calculateAdLimitAwareSellPrice(buyAds, user.availableUSDT);
    
    // Check your existing sell ads
    const mySellAds = user.activeAds.sellAds;
    const myLowestSellPrice = mySellAds.length > 0 ? Math.min(...mySellAds.map(ad => ad.unitPrice)) : Infinity;

    // Calculate competitive price based on ad limit analysis
    const competitivePrice = optimalSellPrice;
    const suggestedAmount = Math.min(
      user.availableUSDT,
      user.tradingCapacity.recommendedSellAmount,
      this.calculateOptimalSellAmount(buyAds, competitivePrice)
    );
    
    // Calculate profit potential (sell price - buy price)
    const profitPerUnit = competitivePrice - analysis.bestBuyPrice;
    const profitPotential = profitPerUnit * suggestedAmount;
    
    // Check if this price is significantly better than your current ads
    const improvement = myLowestSellPrice < Infinity ? myLowestSellPrice - competitivePrice : 0;
    
    const confidence = Math.min(
      analysis.liquidityScore * 0.3 +
      (user.tradingCapacity.recommendedSellAmount > suggestedAmount ? 0.3 : 0.1) +
      (profitPotential > 0 ? 0.3 : 0) +
      (improvement > 0 ? 0.1 : 0),
      1
    );

    let reasoning = `Ad limit-aware sell price: ${competitivePrice.toFixed(2)} (you have ${user.availableUSDT.toFixed(2)} USDT). `;
    reasoning += `Competing with ${buyAds.length} buyers. `;
    reasoning += myLowestSellPrice < Infinity ? `Current lowest: ${myLowestSellPrice.toFixed(2)}. ` : `No current sell ads. `;
    reasoning += `Potential profit: ${profitPerUnit.toFixed(2)} per USDT. `;
    reasoning += `Strategy: Target high-limit buyers for better order matching.`;

    return {
      action: "sell",
      suggestedPrice: competitivePrice,
      suggestedAmount,
      profitPotential,
      confidence,
      reasoning,
      riskLevel: profitPotential > 0 && suggestedAmount <= user.tradingCapacity.recommendedSellAmount ? "low" : "medium"
    };
  }

  /**
   * Calculate optimal sell price considering ad limits and buyer capacity
   * Prioritizes buyers with high ad limits who can handle larger orders
   */
  private calculateAdLimitAwareSellPrice(buyAds: MarketAd[], availableUSDT: number): number {
    if (buyAds.length === 0) return 0;
    
    // Calculate our order size in KES (assuming we want to sell a reasonable portion)
    const targetSellAmount = Math.min(availableUSDT * 0.5, 500); // Sell up to 500 USDT or 50% of balance
    const estimatedOrderValueKES = targetSellAmount * buyAds[0].unitPrice; // Rough estimate
    
    // Filter buyers who can handle our order size (ad limit >= our order value)
    const suitableBuyers = buyAds.filter(ad => {
      const adLimitKES = ad.maxOrderSize * ad.unitPrice;
      return adLimitKES >= estimatedOrderValueKES * 0.8; // 80% of our order size
    });
    
    if (suitableBuyers.length === 0) {
      // If no suitable buyers, compete with the highest price but reduce amount
      return buyAds[0].unitPrice - 0.05; // 5 cents below highest buyer
    }
    
    // Find the sweet spot: highest price among suitable buyers
    const topSuitableBuyer = suitableBuyers[0]; // Already sorted by price desc
    
    // For high-limit buyers, we can be more aggressive with pricing
    const adLimitKES = topSuitableBuyer.maxOrderSize * topSuitableBuyer.unitPrice;
    
    if (adLimitKES >= estimatedOrderValueKES * 2) {
      // Buyer can handle 2x our order - compete aggressively
      return topSuitableBuyer.unitPrice - 0.01; // 1 cent below
    } else if (adLimitKES >= estimatedOrderValueKES * 1.5) {
      // Buyer can handle 1.5x our order - moderate competition
      return topSuitableBuyer.unitPrice - 0.03; // 3 cents below
    } else {
      // Buyer can barely handle our order - be more conservative
      return topSuitableBuyer.unitPrice - 0.05; // 5 cents below
    }
  }

  /**
   * Calculate optimal sell amount based on buyer capacity and competition
   */
  private calculateOptimalSellAmount(buyAds: MarketAd[], targetPrice: number): number {
    // Find buyers at or above our target price
    const competitiveBuyers = buyAds.filter(ad => ad.unitPrice >= targetPrice);
    
    if (competitiveBuyers.length === 0) return 0;
    
    // Calculate total demand at competitive prices
    const totalCompetitiveDemand = competitiveBuyers.reduce((sum, ad) => sum + ad.availableAmount, 0);
    
    // Also consider the average ad limit to size our order appropriately
    const avgAdLimit = competitiveBuyers.reduce((sum, ad) => sum + ad.maxOrderSize, 0) / competitiveBuyers.length;
    
    // Suggest amount that's reasonable for the market
    return Math.min(
      totalCompetitiveDemand * 0.3, // 30% of total demand
      avgAdLimit * 0.8 // 80% of average ad limit
    );
  }

  /**
   * Calculate market making strategy using user's actual balances
   */
  private calculateMarketMakingStrategy(snapshot: OrderBookSnapshot): OptimalAdStrategy | null {
    const { analysis } = snapshot;
    const user = this.userProfile!;
    
    if (analysis.marketMakingSpread <= 0) return null;

    // Use optimal zones for placing competitive ads
    const buyPrice = analysis.optimalZones.buyZone.maxPrice;   // Place buy ad at top of buy zone
    const sellPrice = analysis.optimalZones.sellZone.minPrice; // Place sell ad at bottom of sell zone
    
    // Calculate max amounts based on actual balances
    const maxBuyAmount = user.availableKES / buyPrice;  // Max USDT we can buy
    const maxSellAmount = user.availableUSDT;           // Max USDT we can sell
    
    // Use smaller amount for market making (conservative approach)
    const suggestedAmount = Math.min(
      maxBuyAmount * 0.2,      // Use 20% of buy capacity
      maxSellAmount * 0.2,     // Use 20% of sell capacity  
      analysis.totalSupply * 0.05 // Max 5% of market supply
    );
    
    const profitPotential = (sellPrice - buyPrice) * suggestedAmount;
    const confidence = analysis.liquidityScore * 0.6 + (analysis.spreadPercentage / 10) * 0.4;

    let reasoning = `Market making with ${user.availableUSDT.toFixed(2)} USDT & ${user.availableKES.toFixed(0)} KES. `;
    reasoning += `Spread: ${analysis.marketMakingSpread.toFixed(2)} (${analysis.spreadPercentage.toFixed(2)}%). `;
    reasoning += `Strategy: Buy at ${buyPrice.toFixed(2)}, sell at ${sellPrice.toFixed(2)}. `;
    reasoning += `Profit per round: ${profitPotential.toFixed(2)} KES.`;

    return {
      action: "buy", // Start with buy order
      suggestedPrice: buyPrice,
      suggestedAmount,
      profitPotential,
      confidence,
      reasoning,
      riskLevel: analysis.spreadPercentage > 2 && suggestedAmount > 0 ? "low" : "medium"
    };
  }

  /**
   * Monitor market trends and detect opportunities
   */
  detectMarketTrends(snapshots: OrderBookSnapshot[]): MarketTrends {
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
   * Get order book history for analysis
   */
  getOrderBookHistory(): OrderBookSnapshot[] {
    return this.orderBookHistory;
  }

  /**
   * Get user trading profile
   */
  getUserProfile(): UserTradingProfile | null {
    return this.userProfile;
  }

  /**
   * Update algorithm configuration
   */
  updateConfig(newConfig: Partial<AlgorithmConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AlgorithmConfig {
    return { ...this.config };
  }

  /**
   * Refresh user profile data (balances and active ads)
   */
  async refreshUserProfile(): Promise<UserTradingProfile | null> {
    if (!this.userProfile) {
      console.warn("⚠️ User profile not initialized. Call initializeUserProfile() first.");
      return null;
    }
    
    // Re-initialize with current crypto/fiat pair
    const snapshot = this.orderBookHistory[this.orderBookHistory.length - 1];
    if (snapshot) {
      return await this.initializeUserProfile(snapshot.cryptoCurrency, snapshot.fiatCurrency);
    }
    
    return await this.initializeUserProfile(); // Default to USDT/KES
  }
}
