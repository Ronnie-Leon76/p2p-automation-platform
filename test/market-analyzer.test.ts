/**
 * P2P Market Analyzer Tests
 * Tests the market analysis and visualization components
 */

import { P2PMarketAnalyzer } from "@/lib/algorithms/p2p-market-analyzer";
import type { MarketTrends, OptimalAdStrategy, OrderBookSnapshot } from "@/lib/algorithms/p2p-order-book-emulator";

interface MarketAnalyzerTestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

class MarketAnalyzerTester {
  private results: MarketAnalyzerTestResult[] = [];

  private async runTest(testName: string, testFunction: () => Promise<any> | any): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`🧪 Testing: ${testName}`);
      const data = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: testName,
        success: true,
        data,
        duration
      });
      
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        name: testName,
        success: false,
        error: errorMsg,
        duration
      });
      
      console.log(`❌ ${testName} (${duration}ms)`);
      console.log(`   Error: ${errorMsg}`);
    }
    console.log("");
  }

  private createMockSnapshot(): OrderBookSnapshot {
    return {
      timestamp: Date.now(),
      cryptoCurrency: "USDT",
      fiatCurrency: "KES",
      sellAds: [
        {
          adId: "sell1",
          side: "sell",
          unitPrice: 129.36,
          availableAmount: 177.02,
          minOrderSize: 100,
          maxOrderSize: 50000,
          creator: { userId: "u1", nickName: "St.jobu", completionRate: "99%", completedOrders: "1000+" },
          paymentMethods: ["Mpesa"],
          liquidity: 22893.31,
          priceScore: 100
        },
        {
          adId: "sell2",
          side: "sell",
          unitPrice: 129.38,
          availableAmount: 307.37,
          minOrderSize: 100,
          maxOrderSize: 100000,
          creator: { userId: "u2", nickName: "ann.nex_crypto", completionRate: "98%", completedOrders: "500+" },
          paymentMethods: ["Mpesa"],
          liquidity: 39761.95,
          priceScore: 95
        }
      ],
      buyAds: [
        {
          adId: "buy1",
          side: "buy",
          unitPrice: 128.78,
          availableAmount: 9900.00,
          minOrderSize: 1000,
          maxOrderSize: 500000,
          creator: { userId: "u3", nickName: "Misswa2018", completionRate: "99%", completedOrders: "2000+" },
          paymentMethods: ["Mpesa"],
          liquidity: 1275522.00,
          priceScore: 100
        },
        {
          adId: "buy2",
          side: "buy",
          unitPrice: 128.77,
          availableAmount: 4431.67,
          minOrderSize: 1000,
          maxOrderSize: 300000,
          creator: { userId: "u4", nickName: "Silencertech", completionRate: "97%", completedOrders: "800+" },
          paymentMethods: ["Mpesa"],
          liquidity: 570803.82,
          priceScore: 95
        }
      ],
      analysis: {
        bestBuyPrice: 129.36,
        bestSellPrice: 128.78,
        totalSupply: 484.39,
        totalDemand: 14331.67,
        marketMakingSpread: -0.58,
        spreadPercentage: -0.45,
        liquidityScore: 2.6,
        competitiveAnalysis: {
          topSellers: [],
          topBuyers: []
        },
        optimalZones: {
          buyZone: { minPrice: 129.26, maxPrice: 129.46, volume: 484.39 },
          sellZone: { minPrice: 128.68, maxPrice: 128.88, volume: 14331.67 }
        }
      }
    };
  }

  private createMockStrategies(): OptimalAdStrategy[] {
    return [
      {
        action: "buy",
        suggestedPrice: 129.30,
        suggestedAmount: 800,
        profitPotential: 384.00,
        confidence: 0.75,
        reasoning: "Volume-weighted buy price targeting high-volume sellers",
        riskLevel: "medium"
      },
      {
        action: "sell",
        suggestedPrice: 128.75,
        suggestedAmount: 1000,
        profitPotential: 500.00,
        confidence: 0.80,
        reasoning: "Ad limit-aware sell price for high-limit buyers",
        riskLevel: "low"
      }
    ];
  }

  private createMockTrends(): MarketTrends {
    return {
      trend: "sideways",
      volatility: 0.02,
      opportunities: ["stable spread", "good liquidity"]
    };
  }

  async testMarketDataFormatting(): Promise<void> {
    await this.runTest("Market Data Formatting", () => {
      const snapshot = this.createMockSnapshot();
      
      // Test data formatting
      const sellAdsCount = snapshot.sellAds.length;
      const buyAdsCount = snapshot.buyAds.length;
      const totalVolume = snapshot.analysis.totalSupply + snapshot.analysis.totalDemand;
      const spread = snapshot.analysis.marketMakingSpread;
      
      console.log(`   📊 Sell Ads: ${sellAdsCount}`);
      console.log(`   📊 Buy Ads: ${buyAdsCount}`);
      console.log(`   💰 Total Volume: ${totalVolume.toFixed(2)} USDT`);
      console.log(`   📈 Spread: ${spread.toFixed(2)} KES`);
      
      return { sellAdsCount, buyAdsCount, totalVolume, spread };
    });
  }

  async testStrategyFormatting(): Promise<void> {
    await this.runTest("Strategy Formatting", () => {
      const strategies = this.createMockStrategies();
      
      const formattedStrategies = strategies.map(strategy => ({
        action: strategy.action.toUpperCase(),
        price: `${strategy.suggestedPrice.toFixed(2)} KES`,
        amount: `${strategy.suggestedAmount.toFixed(2)} USDT`,
        confidence: `${(strategy.confidence * 100).toFixed(1)}%`,
        profit: `${strategy.profitPotential.toFixed(2)} KES`
      }));
      
      console.log(`   🎯 Strategies: ${formattedStrategies.length}`);
      formattedStrategies.forEach((strategy, i) => {
        console.log(`   ${i + 1}. ${strategy.action}: ${strategy.price}, ${strategy.amount}, ${strategy.confidence}`);
      });
      
      return formattedStrategies;
    });
  }

  async testTrendAnalysisDisplay(): Promise<void> {
    await this.runTest("Trend Analysis Display", () => {
      const trends = this.createMockTrends();
      
      const trendEmoji = trends.trend === "bullish" ? "📈" : 
                        trends.trend === "bearish" ? "📉" : "↔️";
      
      const formattedTrends = {
        trend: `${trends.trend.toUpperCase()} ${trendEmoji}`,
        volatility: `${(trends.volatility * 100).toFixed(1)}%`,
        opportunities: trends.opportunities.length,
        opportunityList: trends.opportunities.join(", ")
      };
      
      console.log(`   📈 Trend: ${formattedTrends.trend}`);
      console.log(`   📊 Volatility: ${formattedTrends.volatility}`);
      console.log(`   🎯 Opportunities: ${formattedTrends.opportunities}`);
      
      return formattedTrends;
    });
  }

  async testPriceAnalysis(): Promise<void> {
    await this.runTest("Price Analysis", () => {
      const snapshot = this.createMockSnapshot();
      
      // Analyze price distribution
      const sellPrices = snapshot.sellAds.map(ad => ad.unitPrice);
      const buyPrices = snapshot.buyAds.map(ad => ad.unitPrice);
      
      const minSellPrice = Math.min(...sellPrices);
      const maxSellPrice = Math.max(...sellPrices);
      const minBuyPrice = Math.min(...buyPrices);
      const maxBuyPrice = Math.max(...buyPrices);
      
      const priceRange = {
        sellRange: maxSellPrice - minSellPrice,
        buyRange: maxBuyPrice - minBuyPrice,
        marketSpread: minSellPrice - maxBuyPrice
      };
      
      console.log(`   💰 Sell Price Range: ${priceRange.sellRange.toFixed(2)} KES`);
      console.log(`   💰 Buy Price Range: ${priceRange.buyRange.toFixed(2)} KES`);
      console.log(`   📊 Market Spread: ${priceRange.marketSpread.toFixed(2)} KES`);
      
      return priceRange;
    });
  }

  async testVolumeAnalysis(): Promise<void> {
    await this.runTest("Volume Analysis", () => {
      const snapshot = this.createMockSnapshot();
      
      // Analyze volume distribution
      const sellVolumes = snapshot.sellAds.map(ad => ad.availableAmount);
      const buyVolumes = snapshot.buyAds.map(ad => ad.availableAmount);
      
      const totalSellVolume = sellVolumes.reduce((sum, vol) => sum + vol, 0);
      const totalBuyVolume = buyVolumes.reduce((sum, vol) => sum + vol, 0);
      const avgSellVolume = totalSellVolume / sellVolumes.length;
      const avgBuyVolume = totalBuyVolume / buyVolumes.length;
      
      const volumeAnalysis = {
        totalSellVolume,
        totalBuyVolume,
        avgSellVolume,
        avgBuyVolume,
        volumeRatio: totalBuyVolume / totalSellVolume
      };
      
      console.log(`   📊 Total Sell Volume: ${totalSellVolume.toFixed(2)} USDT`);
      console.log(`   📊 Total Buy Volume: ${totalBuyVolume.toFixed(2)} USDT`);
      console.log(`   📈 Volume Ratio: ${volumeAnalysis.volumeRatio.toFixed(2)}`);
      
      return volumeAnalysis;
    });
  }

  async testMarketAnalysisPrint(): Promise<void> {
    await this.runTest("Market Analysis Print Function", () => {
      const snapshot = this.createMockSnapshot();
      const strategies = this.createMockStrategies();
      const trends = this.createMockTrends();
      
      // Test that the print function runs without errors
      console.log("   📋 Testing P2PMarketAnalyzer.printMarketAnalysis()...");
      
      // Capture console output (simplified test)
      let printSuccess = true;
      try {
        P2PMarketAnalyzer.printMarketAnalysis(snapshot, strategies, trends);
      } catch (error) {
        printSuccess = false;
        throw error;
      }
      
      return { printSuccess, hasSnapshot: !!snapshot, hasStrategies: strategies.length > 0 };
    });
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;

    console.log("=".repeat(60));
    console.log("📊 MARKET ANALYZER TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`📊 Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
    
    if (failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.name}: ${result.error}`);
      });
    }
    
    console.log(`\n🎯 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
  }
}

export async function testMarketAnalyzer(): Promise<void> {
  console.log("🚀 Starting Market Analyzer Tests...\n");
  
  const tester = new MarketAnalyzerTester();
  
  // Run all market analyzer tests
  await tester.testMarketDataFormatting();
  await tester.testStrategyFormatting();
  await tester.testTrendAnalysisDisplay();
  await tester.testPriceAnalysis();
  await tester.testVolumeAnalysis();
  await tester.testMarketAnalysisPrint();
  
  // Print summary
  tester.printSummary();
}

// Run if called directly
if (require.main === module) {
  testMarketAnalyzer().catch(console.error);
}
