/**
 * OKX Exchange API Tests
 * Tests individual OKX API endpoints for connectivity and basic functionality
 */

import { OKXExchange } from "@/lib/exchanges/okx-exchange";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface TestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

class OKXApiTester {
  private okx: OKXExchange;
  private results: TestResult[] = [];

  constructor() {
    const apiKey = process.env.OKX_API_KEY;
    const apiSecret = process.env.OKX_API_SECRET;
    const passphrase = process.env.OKX_API_PASSPHRASE;

    if (!apiKey || !apiSecret || !passphrase) {
      throw new Error("Missing OKX API credentials");
    }

    this.okx = new OKXExchange(apiKey, apiSecret, passphrase);
  }

  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
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
      if (data && typeof data === 'object') {
        if (data.count !== undefined) {
          console.log(`   📊 Count: ${data.count}`);
        } else if (Array.isArray(data)) {
          console.log(`   📊 Items: ${data.length}`);
        }
      }
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

  async testUserInfo(): Promise<void> {
    await this.runTest("User Info", async () => {
      const userInfo = await this.okx.getUserInfo();
      return {
        nickName: userInfo.nickName,
        completionRate: userInfo.completionRate,
        kycLevel: userInfo.kycLevel
      };
    });
  }

  async testBalance(): Promise<void> {
    await this.runTest("USDT Balance", async () => {
      const balance = await this.okx.getBalance("USDT");
      return {
        available: balance.availableAmount,
        onHold: balance.onHoldAmount
      };
    });
  }

  async testActiveAds(): Promise<void> {
    await this.runTest("Active Buy Ads", async () => {
      const ads = await this.okx.getActiveAds({
        side: "buy",
        cryptoCurrency: "USDT",
        fiatCurrency: "KES"
      });
      return { count: ads.ads.length };
    });

    await this.runTest("Active Sell Ads", async () => {
      const ads = await this.okx.getActiveAds({
        side: "sell",
        cryptoCurrency: "USDT",
        fiatCurrency: "KES"
      });
      return { count: ads.ads.length };
    });
  }

  async testMarketplaceAds(): Promise<void> {
    await this.runTest("Marketplace Data", async () => {
      const marketplace = await this.okx.getMarketplaceAds({
        cryptoCurrency: "USDT",
        fiatCurrency: "KES",
        side: "all",
        paymentMethod: "all"
      });
      return {
        sellAds: marketplace.sellAds.length,
        buyAds: marketplace.buyAds.length,
        total: marketplace.sellAds.length + marketplace.buyAds.length
      };
    });
  }

  async testPaymentMethods(): Promise<void> {
    await this.runTest("Payment Methods", async () => {
      const methods = await this.okx.getPaymentMethods();
      return { count: methods.length };
    });
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;

    console.log("=".repeat(60));
    console.log("🔍 OKX API TEST SUMMARY");
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

export async function testOKXApi(): Promise<void> {
  console.log("🚀 Starting OKX API Tests...\n");
  
  try {
    const tester = new OKXApiTester();
    
    // Run all API tests
    await tester.testUserInfo();
    await tester.testBalance();
    await tester.testActiveAds();
    await tester.testMarketplaceAds();
    await tester.testPaymentMethods();
    
    // Print summary
    tester.printSummary();
    
  } catch (error) {
    console.error("❌ Failed to initialize OKX API tester:", error);
  }
}

// Run if called directly
if (require.main === module) {
  testOKXApi().catch(console.error);
}
