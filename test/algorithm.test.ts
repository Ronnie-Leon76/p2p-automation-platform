/**
 * P2P Order Book Emulator Algorithm Tests
 * Tests the core algorithm logic and calculations
 */

import { P2POrderBookEmulator } from "@/lib/algorithms/p2p-order-book-emulator";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface AlgorithmTestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

class AlgorithmTester {
  private emulator: P2POrderBookEmulator;
  private results: AlgorithmTestResult[] = [];
  private mockOkx: any;

  constructor() {
    // Create a mock OKX instance for algorithm testing
    this.mockOkx = {
      name: "OKX",
      isConnected: true
    };

    const config = {
      minSpread: 0.01,
      maxRiskAmount: 10000,
      minLiquidity: 1000,
      priceBuffer: 0.005,
      competitorAnalysis: true,
      dynamicPricing: true
    };

    this.emulator = new P2POrderBookEmulator(this.mockOkx, config);
  }

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

  async testVolumeWeightedPricing(): Promise<void> {
    await this.runTest("Volume Weighted Price Calculation", () => {
      // Test with mock data similar to what the algorithm would receive
      const sellAds = [
        { unitPrice: 129.50, availableAmount: 100, liquidity: 12950 },
        { unitPrice: 129.60, availableAmount: 500, liquidity: 64800 },
        { unitPrice: 129.70, availableAmount: 200, liquidity: 25940 }
      ];

      // Calculate volume-weighted average price manually for testing
      const totalVolume = sellAds.reduce((sum, ad) => sum + ad.availableAmount, 0);
      const weightedSum = sellAds.reduce((sum, ad) => sum + (ad.unitPrice * ad.availableAmount), 0);
      const volumeWeightedPrice = weightedSum / totalVolume;
      
      console.log(`   💰 Volume-weighted price: ${volumeWeightedPrice.toFixed(2)}`);
      console.log(`   📊 Total volume: ${totalVolume.toFixed(2)} USDT`);
      
      return { volumeWeightedPrice, totalVolume };
    });
  }

  async testAdLimitCalculations(): Promise<void> {
    await this.runTest("Ad Limit Calculations", () => {
      const buyAds = [
        { unitPrice: 129.70, availableAmount: 1000, maxOrderSize: 500000, liquidity: 129700 },
        { unitPrice: 129.60, availableAmount: 2000, maxOrderSize: 100000, liquidity: 259200 },
        { unitPrice: 129.50, availableAmount: 500, maxOrderSize: 200000, liquidity: 64750 }
      ];

      const kesCapacity = 150000;
      const targetPrice = 129.65;
      
      // Calculate sellable amount based on ad limits
      const sellableAmount = buyAds
        .filter(ad => ad.unitPrice >= targetPrice)
        .reduce((sum, ad) => {
          const maxFromKes = kesCapacity / ad.unitPrice;
          const maxFromAdLimit = ad.maxOrderSize / ad.unitPrice;
          return sum + Math.min(ad.availableAmount, maxFromKes, maxFromAdLimit);
        }, 0);
      
      console.log(`   💰 Target price: ${targetPrice.toFixed(2)} KES`);
      console.log(`   📊 Sellable amount: ${sellableAmount.toFixed(2)} USDT`);
      console.log(`   🎯 KES capacity: ${kesCapacity.toLocaleString()}`);
      
      return { targetPrice, sellableAmount, kesCapacity };
    });
  }

  async testStrategyCalculation(): Promise<void> {
    await this.runTest("Strategy Calculation", () => {
      // Mock snapshot data
      const mockSnapshot = {
        timestamp: Date.now(),
        cryptoCurrency: "USDT",
        fiatCurrency: "KES",
        sellAds: [
          { adId: "1", side: "sell", unitPrice: 129.50, availableAmount: 100, liquidity: 12950, priceScore: 0, minOrderSize: 100, maxOrderSize: 50000, creator: { userId: "u1", nickName: "Seller1", completionRate: "99%", completedOrders: "1000+" }, paymentMethods: ["Mpesa"] },
          { adId: "2", side: "sell", unitPrice: 129.60, availableAmount: 500, liquidity: 64800, priceScore: 0, minOrderSize: 100, maxOrderSize: 100000, creator: { userId: "u2", nickName: "Seller2", completionRate: "98%", completedOrders: "500+" }, paymentMethods: ["Mpesa"] }
        ],
        buyAds: [
          { adId: "3", side: "buy", unitPrice: 129.40, availableAmount: 1000, liquidity: 129400, priceScore: 0, minOrderSize: 1000, maxOrderSize: 500000, creator: { userId: "u3", nickName: "Buyer1", completionRate: "99%", completedOrders: "2000+" }, paymentMethods: ["Mpesa"] },
          { adId: "4", side: "buy", unitPrice: 129.30, availableAmount: 2000, liquidity: 258600, priceScore: 0, minOrderSize: 1000, maxOrderSize: 300000, creator: { userId: "u4", nickName: "Buyer2", completionRate: "97%", completedOrders: "800+" }, paymentMethods: ["Mpesa"] }
        ],
        analysis: {
          bestBuyPrice: 129.50,
          bestSellPrice: 129.40,
          totalSupply: 600,
          totalDemand: 3000,
          marketMakingSpread: 0.10,
          spreadPercentage: 0.08,
          liquidityScore: 3.5,
          competitiveAnalysis: {
            topSellers: [],
            topBuyers: []
          },
          optimalZones: {
            buyZone: { minPrice: 129.40, maxPrice: 129.60, volume: 600 },
            sellZone: { minPrice: 129.30, maxPrice: 129.50, volume: 3000 }
          }
        }
      };

      // Set a mock user profile
      (this.emulator as any).userProfile = {
        availableUSDT: 1000,
        tradingCapacity: {
          recommendedBuyAmount: 800,
          recommendedSellAmount: 900
        },
        activeAds: {
          buyAds: [],
          sellAds: []
        }
      };

      const strategies = this.emulator.calculateOptimalStrategy(mockSnapshot as any);
      
      console.log(`   📊 Generated ${strategies.length} strategies`);
      strategies.forEach((strategy, i) => {
        console.log(`   ${i + 1}. ${strategy.action.toUpperCase()}: ${strategy.suggestedPrice.toFixed(2)} KES, ${strategy.suggestedAmount.toFixed(2)} USDT`);
      });
      
      return { strategiesCount: strategies.length, strategies };
    });
  }

  async testMarketTrendAnalysis(): Promise<void> {
    await this.runTest("Market Trend Analysis", () => {
      const mockSnapshots = [{
        timestamp: Date.now(),
        sellAds: [
          { unitPrice: 129.50, availableAmount: 100 },
          { unitPrice: 129.60, availableAmount: 200 }
        ],
        buyAds: [
          { unitPrice: 129.40, availableAmount: 300 },
          { unitPrice: 129.30, availableAmount: 400 }
        ]
      }];

      const trends = this.emulator.detectMarketTrends(mockSnapshots as any);
      
      console.log(`   📈 Trend: ${trends.trend}`);
      console.log(`   📊 Volatility: ${trends.volatility.toFixed(2)}`);
      console.log(`   🎯 Opportunities: ${trends.opportunities.length}`);
      
      return trends;
    });
  }

  async testPriceCalculations(): Promise<void> {
    await this.runTest("Price Calculations", () => {
      const ads = [
        { unitPrice: 129.50, availableAmount: 100 },
        { unitPrice: 129.60, availableAmount: 200 },
        { unitPrice: 129.70, availableAmount: 150 }
      ];

      const bestPrice = Math.min(...ads.map(ad => ad.unitPrice));
      const avgPrice = ads.reduce((sum, ad) => sum + ad.unitPrice, 0) / ads.length;
      const totalVolume = ads.reduce((sum, ad) => sum + ad.availableAmount, 0);
      
      console.log(`   💰 Best Price: ${bestPrice.toFixed(2)} KES`);
      console.log(`   📊 Average Price: ${avgPrice.toFixed(2)} KES`);
      console.log(`   📈 Total Volume: ${totalVolume.toFixed(2)} USDT`);
      
      return { bestPrice, avgPrice, totalVolume };
    });
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;

    console.log("=".repeat(60));
    console.log("🧮 ALGORITHM TEST SUMMARY");
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

export async function testAlgorithm(): Promise<void> {
  console.log("🚀 Starting Algorithm Tests...\n");
  
  const tester = new AlgorithmTester();
  
  // Run all algorithm tests
  await tester.testVolumeWeightedPricing();
  await tester.testAdLimitCalculations();
  //await tester.testStrategyCalculation();
  await tester.testMarketTrendAnalysis();
  await tester.testPriceCalculations();
  
  // Print summary
  tester.printSummary();
}

// Run if called directly
if (require.main === module) {
  testAlgorithm().catch(console.error);
}
