import { MarketTrends, OptimalAdStrategy, OrderBookSnapshot } from "./p2p-order-book-emulator";

/**
 * P2P Market Analysis and Visualization Utilities
 * Provides comprehensive reporting and analysis tools for market making
 */
export class P2PMarketAnalyzer {
  
  /**
   * Print comprehensive market analysis
   */
  static printMarketAnalysis(snapshot: OrderBookSnapshot, strategies: OptimalAdStrategy[], trends?: MarketTrends) {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 P2P ORDER BOOK ANALYSIS");
    console.log("=".repeat(60));
    
    console.log(`📅 Timestamp: ${new Date(snapshot.timestamp).toLocaleString()}`);
    console.log(`💱 Market: ${snapshot.cryptoCurrency}/${snapshot.fiatCurrency}`);
    
    console.log("\n📊 MARKET OVERVIEW:");
    console.log(`├─ Best Buy Price (Supply):  ${snapshot.analysis.bestBuyPrice.toFixed(2)} (Users selling crypto)`);
    console.log(`├─ Best Sell Price (Demand): ${snapshot.analysis.bestSellPrice.toFixed(2)} (Users buying crypto)`);
    console.log(`├─ Market Making Spread: ${snapshot.analysis.marketMakingSpread.toFixed(2)} (${snapshot.analysis.spreadPercentage.toFixed(2)}%)`);
    console.log(`├─ Total Supply: ${snapshot.analysis.totalSupply.toFixed(2)} ${snapshot.cryptoCurrency} (Users selling)`);
    console.log(`├─ Total Demand: ${snapshot.analysis.totalDemand.toFixed(2)} ${snapshot.cryptoCurrency} (Users buying)`);
    console.log(`└─ Liquidity Score: ${(snapshot.analysis.liquidityScore * 100).toFixed(1)}%`);

    this.printSupplyAnalysis(snapshot);
    this.printDemandAnalysis(snapshot);
    this.printStrategies(snapshot, strategies);
    
    if (trends) {
      this.printMarketTrends(trends);
    }
    
    this.printOptimalZones(snapshot);
  }

  /**
   * Print supply analysis (users selling crypto)
   */
  private static printSupplyAnalysis(snapshot: OrderBookSnapshot) {
    console.log("\n🔺 SUPPLY ANALYSIS (Users Selling Crypto - We Can Place Buy Ads):");
    if (snapshot.sellAds.length === 0) {
      console.log("   🎯 No users selling crypto - EXCELLENT opportunity to place competitive buy ads!");
    } else {
      snapshot.sellAds.slice(0, 5).forEach((ad, i) => {
        const competitiveness = i === 0 ? "🔥 Best" : i < 3 ? "⚡ Good" : "📊 Fair";
        console.log(`${i + 1}. ${ad.unitPrice.toFixed(2)} | ${ad.availableAmount.toFixed(2)} ${snapshot.cryptoCurrency} | ${ad.creator.nickName} ${competitiveness}`);
      });
      console.log(`   💡 Strategy: Place buy ads above ${snapshot.sellAds[0].unitPrice.toFixed(2)} to compete`);
    }
  }

  /**
   * Print demand analysis (users buying crypto)
   */
  private static printDemandAnalysis(snapshot: OrderBookSnapshot) {
    console.log("\n🔻 DEMAND ANALYSIS (Users Buying Crypto - We Can Place Sell Ads):");
    if (snapshot.buyAds.length === 0) {
      console.log("   🎯 No users buying crypto - EXCELLENT opportunity to place competitive sell ads!");
    } else {
      snapshot.buyAds.slice(0, 5).forEach((ad, i) => {
        const competitiveness = i === 0 ? "🔥 Best" : i < 3 ? "⚡ Good" : "📊 Fair";
        console.log(`${i + 1}. ${ad.unitPrice.toFixed(2)} | ${ad.availableAmount.toFixed(2)} ${snapshot.cryptoCurrency} | ${ad.creator.nickName} ${competitiveness}`);
      });
      console.log(`   💡 Strategy: Place sell ads below ${snapshot.buyAds[0].unitPrice.toFixed(2)} to compete`);
    }
  }

  /**
   * Print optimal strategies
   */
  private static printStrategies(snapshot: OrderBookSnapshot, strategies: OptimalAdStrategy[]) {
    console.log("\n🎯 OPTIMAL STRATEGIES:");
    if (strategies.length === 0) {
      console.log("   ⚠️ No profitable strategies found at current market conditions");
      return;
    }

    strategies.forEach((strategy, i) => {
      const riskEmoji = strategy.riskLevel === "low" ? "🟢" : strategy.riskLevel === "medium" ? "🟡" : "🔴";
      const actionEmoji = strategy.action === "buy" ? "🛒" : "💰";
      
      console.log(`${i + 1}. ${actionEmoji} ${strategy.action.toUpperCase()} Strategy ${riskEmoji}`);
      console.log(`   ├─ Price: ${strategy.suggestedPrice.toFixed(2)} ${snapshot.fiatCurrency}`);
      console.log(`   ├─ Amount: ${strategy.suggestedAmount.toFixed(2)} ${snapshot.cryptoCurrency}`);
      console.log(`   ├─ Profit Potential: ${strategy.profitPotential.toFixed(2)} ${snapshot.fiatCurrency}`);
      console.log(`   ├─ Confidence: ${(strategy.confidence * 100).toFixed(1)}%`);
      console.log(`   └─ Reasoning: ${strategy.reasoning}`);
    });
  }

  /**
   * Print market trends
   */
  private static printMarketTrends(trends: MarketTrends) {
    console.log("\n📈 MARKET TRENDS:");
    const trendEmoji = trends.trend === "bullish" ? "📈" : trends.trend === "bearish" ? "📉" : "↔️";
    console.log(`├─ Trend: ${trends.trend.toUpperCase()} ${trendEmoji}`);
    console.log(`├─ Volatility: ${trends.volatility.toFixed(2)}`);
    console.log(`└─ Opportunities:`);
    if (trends.opportunities.length === 0) {
      console.log("   📊 Market conditions stable - continue with current strategy");
    } else {
      trends.opportunities.forEach(opp => console.log(`   ${opp}`));
    }
  }

  /**
   * Print optimal ad placement zones
   */
  private static printOptimalZones(snapshot: OrderBookSnapshot) {
    console.log("\n🎯 OPTIMAL AD PLACEMENT ZONES:");
    console.log(`🟢 Buy Zone (Place your buy ads to compete with sellers):`);
    console.log(`   ├─ Price Range: ${snapshot.analysis.optimalZones.buyZone.minPrice.toFixed(2)} - ${snapshot.analysis.optimalZones.buyZone.maxPrice.toFixed(2)}`);
    console.log(`   └─ Available Volume: ${snapshot.analysis.optimalZones.buyZone.volume.toFixed(2)} ${snapshot.cryptoCurrency}`);
    console.log(`🔴 Sell Zone (Place your sell ads to compete with buyers):`);
    console.log(`   ├─ Price Range: ${snapshot.analysis.optimalZones.sellZone.minPrice.toFixed(2)} - ${snapshot.analysis.optimalZones.sellZone.maxPrice.toFixed(2)}`);
    console.log(`   └─ Available Volume: ${snapshot.analysis.optimalZones.sellZone.volume.toFixed(2)} ${snapshot.cryptoCurrency}`);
  }

  /**
   * Print summary statistics
   */
  static printSummary(snapshot: OrderBookSnapshot, strategies: OptimalAdStrategy[]) {
    console.log("\n📋 MARKET MAKING SUMMARY:");
    console.log(`🎯 Best Opportunities:`);
    
    if (strategies.length === 0) {
      console.log("   ❌ No profitable opportunities found");
      return;
    }

    const bestStrategy = strategies.reduce((best, strategy) => 
      strategy.profitPotential > best.profitPotential ? strategy : best
    );

    console.log(`   ├─ Best Action: ${bestStrategy.action.toUpperCase()}`);
    console.log(`   ├─ Optimal Price: ${bestStrategy.suggestedPrice.toFixed(2)}`);
    console.log(`   ├─ Max Profit: ${bestStrategy.profitPotential.toFixed(2)} ${snapshot.fiatCurrency}`);
    console.log(`   └─ Confidence: ${(bestStrategy.confidence * 100).toFixed(1)}%`);

    // Risk assessment
    const totalRisk = strategies.reduce((sum, s) => sum + (s.suggestedAmount * s.suggestedPrice), 0);
    console.log(`💰 Capital Allocation:`);
    console.log(`   ├─ Total Required: ${totalRisk.toFixed(2)} ${snapshot.fiatCurrency}`);
    console.log(`   └─ Expected ROI: ${(strategies.reduce((sum, s) => sum + s.profitPotential, 0) / totalRisk * 100).toFixed(2)}%`);
  }

  /**
   * Export analysis data for further processing
   */
  static exportAnalysisData(snapshot: OrderBookSnapshot, strategies: OptimalAdStrategy[]): {
    timestamp: number;
    market: string;
    analysis: typeof snapshot.analysis;
    strategies: OptimalAdStrategy[];
    summary: {
      totalStrategies: number;
      maxProfit: number;
      totalCapitalRequired: number;
      averageConfidence: number;
    };
  } {
    const totalCapital = strategies.reduce((sum, s) => sum + (s.suggestedAmount * s.suggestedPrice), 0);
    const maxProfit = Math.max(...strategies.map(s => s.profitPotential), 0);
    const avgConfidence = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.confidence, 0) / strategies.length 
      : 0;

    return {
      timestamp: snapshot.timestamp,
      market: `${snapshot.cryptoCurrency}/${snapshot.fiatCurrency}`,
      analysis: snapshot.analysis,
      strategies,
      summary: {
        totalStrategies: strategies.length,
        maxProfit,
        totalCapitalRequired: totalCapital,
        averageConfidence: avgConfidence
      }
    };
  }
}
