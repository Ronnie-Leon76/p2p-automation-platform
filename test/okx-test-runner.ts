import { OKXExchange } from "@/lib/exchanges/okx-exchange";
import dotenv from "dotenv";

dotenv.config();
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Test configuration
const ENABLE_AD_CREATION_TESTS = false; // Set to true to enable ad creation (creates real ads!)
const ENABLE_PAYMENT_METHOD_TESTS = false; // Set to true to enable payment method creation
const ENABLE_ORDER_TESTS = false; // Set to true to enable order creation tests

// Helper function to log test results with better formatting
function logTest(testName: string, success: boolean, data?: any, error?: any) {
  const status = success ? "✅" : "❌";
  console.log(`${status} ${testName}`);
  if (success && data) {
    if (typeof data === 'object' && data !== null) {
      // Format large objects more compactly
      if (data.count !== undefined) {
        console.log(`   Count: ${data.count}`);
        if (data.sample) {
          console.log("   Sample:", JSON.stringify(data.sample, null, 2));
        }
      } else if (Array.isArray(data)) {
        console.log(`   Array Length: ${data.length}`);
        if (data.length > 0) {
          console.log("   First Item:", JSON.stringify(data[0], null, 2));
        }
      } else {
        console.log("   Data:", JSON.stringify(data, null, 2));
      }
    } else {
      console.log("   Data:", data);
    }
  }
  if (!success && error) {
    console.log("   Error:", error.message || error);
  }
  console.log("");
}

// Test summary interface
interface TestSummary {
  totalTests: number;
  successCount: number;
  failedTests: string[];
  categories: Record<string, { total: number; passed: number }>;
}

export async function runOkxTest() {
  console.log("🚀 Starting comprehensive OKX API test suite...\n");
  
  // Get API credentials
  const apiKey = process.env.OKX_API_KEY;
  const apiSecret = process.env.OKX_API_SECRET;
  const passphrase = process.env.OKX_API_PASSPHRASE;

  if (!apiKey || !apiSecret || !passphrase) {
    console.error("❌ Missing OKX API credentials in environment variables.");
    console.log("Please ensure the following environment variables are set:");
    console.log("- OKX_API_KEY");
    console.log("- OKX_API_SECRET");
    console.log("- OKX_API_PASSPHRASE");
    return;
  }

  const okx = new OKXExchange(apiKey, apiSecret, passphrase);

  if (!okx.isConnected) {
    console.error("❌ Failed to connect to OKX – missing credentials.");
    return;
  }

  console.log("✅ OKX Connected\n");

  const summary: TestSummary = {
    totalTests: 0,
    successCount: 0,
    failedTests: [],
    categories: {}
  };

  // Helper function to track test results
  function trackTest(category: string, testName: string, success: boolean) {
    summary.totalTests++;
    if (success) {
      summary.successCount++;
    } else {
      summary.failedTests.push(`${category}: ${testName}`);
    }
    
    if (!summary.categories[category]) {
      summary.categories[category] = { total: 0, passed: 0 };
    }
    summary.categories[category].total++;
    if (success) {
      summary.categories[category].passed++;
    }
  }

  // 1. User Information Tests
  console.log("📊 TESTING USER INFORMATION ENDPOINTS\n");
  
  try {
    console.log("🔍 Testing getUserInfo()...");
    const user = await okx.getUserInfo();
    logTest("Get User Info", true, user);
    trackTest("User Info", "getUserInfo", true);
  } catch (error) {
    logTest("Get User Info", false, null, error);
    trackTest("User Info", "getUserInfo", false);
  }

  // 2. Balance Tests
  console.log("💰 TESTING BALANCE ENDPOINTS\n");
  
  const currencies = ["USDT", "BTC", "ETH", "KES"];
  for (const currency of currencies) {
    try {
      console.log(`💰 Testing getBalance(${currency})...`);
      const balance = await okx.getBalance(currency);
      logTest(`Get Balance - ${currency}`, true, balance);
      trackTest("Balance", `getBalance(${currency})`, true);
    } catch (error) {
      logTest(`Get Balance - ${currency}`, false, null, error);
      trackTest("Balance", `getBalance(${currency})`, false);
    }
  }

  // 3. Payment Methods Tests
  console.log("💳 TESTING PAYMENT METHODS ENDPOINTS\n");
  
  try {
    console.log("💳 Testing getPaymentMethods()...");
    const paymentMethods = await okx.getPaymentMethods();
    logTest("Get Payment Methods", true, {
      count: paymentMethods.paymentMethods.length,
      sample: paymentMethods.paymentMethods.slice(0, 2)
    });
    trackTest("Payment Methods", "getPaymentMethods", true);
  } catch (error) {
    logTest("Get Payment Methods", false, null, error);
    trackTest("Payment Methods", "getPaymentMethods", false);
  }

  // 4. Price Information Tests
  console.log("💹 TESTING PRICE INFORMATION ENDPOINTS\n");
  
  const pricePairs = [
    { crypto: "USDT", fiat: "KES" },
    { crypto: "USDT", fiat: "USD" },
    { crypto: "BTC", fiat: "USD" },
    { crypto: "ETH", fiat: "USD" }
  ];

  for (const pair of pricePairs) {
    try {
      console.log(`💹 Testing getOptimalPrice(${pair.crypto}/${pair.fiat})...`);
      const price = await okx.getOptimalPrice(pair.crypto, pair.fiat);
      logTest(`Get Optimal Price - ${pair.crypto}/${pair.fiat}`, true, price);
      trackTest("Price Info", `getOptimalPrice(${pair.crypto}/${pair.fiat})`, true);
    } catch (error) {
      logTest(`Get Optimal Price - ${pair.crypto}/${pair.fiat}`, false, null, error);
      trackTest("Price Info", `getOptimalPrice(${pair.crypto}/${pair.fiat})`, false);
    }

    try {
      console.log(`💹 Testing getEstimatedPrice(${pair.crypto}/${pair.fiat})...`);
      const estimatedPrice = await okx.getEstimatedPrice({
        cryptoCurrency: pair.crypto,
        fiatCurrency: pair.fiat,
        side: "buy",
        paymentMethod: "bank"
      });
      logTest(`Get Estimated Price - ${pair.crypto}/${pair.fiat}`, true, estimatedPrice);
      trackTest("Price Info", `getEstimatedPrice(${pair.crypto}/${pair.fiat})`, true);
    } catch (error) {
      logTest(`Get Estimated Price - ${pair.crypto}/${pair.fiat}`, false, null, error);
      trackTest("Price Info", `getEstimatedPrice(${pair.crypto}/${pair.fiat})`, false);
    }
  }

  // 5. Ad Management Tests (Read-only)
  console.log("📈 TESTING AD MANAGEMENT ENDPOINTS (READ-ONLY)\n");
  
  const adTestPairs: Array<{ side: "buy" | "sell", crypto: string, fiat: string }> = [
    { side: "buy", crypto: "USDT", fiat: "KES" },
    { side: "sell", crypto: "USDT", fiat: "KES" },
    { side: "buy", crypto: "USDT", fiat: "USD" },
    { side: "sell", crypto: "USDT", fiat: "USD" },
  ];

  for (const adPair of adTestPairs) {
    try {
      console.log(`📈 Testing getActiveAds(${adPair.side} ${adPair.crypto}/${adPair.fiat})...`);
      const activeAds = await okx.getActiveAds({
        side: adPair.side,
        cryptoCurrency: adPair.crypto,
        fiatCurrency: adPair.fiat
      });
      logTest(`Get Active Ads - ${adPair.side} ${adPair.crypto}/${adPair.fiat}`, true, {
        count: activeAds.ads.length,
        sample: activeAds.ads.slice(0, 1) // Show first ad only
      });
      trackTest("Ad Management", `getActiveAds(${adPair.side} ${adPair.crypto}/${adPair.fiat})`, true);
    } catch (error) {
      logTest(`Get Active Ads - ${adPair.side} ${adPair.crypto}/${adPair.fiat}`, false, null, error);
      trackTest("Ad Management", `getActiveAds(${adPair.side} ${adPair.crypto}/${adPair.fiat})`, false);
    }

    try {
      console.log(`📈 Testing getMarketplaceAds(${adPair.crypto}/${adPair.fiat})...`);
      const marketplaceAds = await okx.getMarketplaceAds({
        cryptoCurrency: adPair.crypto,
        fiatCurrency: adPair.fiat,
        side: adPair.side,
        paymentMethod: "bank"
      });
      logTest(`Get Marketplace Ads - ${adPair.crypto}/${adPair.fiat}`, true, {
        buyAdsCount: marketplaceAds.buyAds.length,
        sellAdsCount: marketplaceAds.sellAds.length,
        sampleBuyAd: marketplaceAds.buyAds[0] || null,
        sampleSellAd: marketplaceAds.sellAds[0] || null
      });
      trackTest("Ad Management", `getMarketplaceAds(${adPair.crypto}/${adPair.fiat})`, true);
    } catch (error) {
      logTest(`Get Marketplace Ads - ${adPair.crypto}/${adPair.fiat}`, false, null, error);
      trackTest("Ad Management", `getMarketplaceAds(${adPair.crypto}/${adPair.fiat})`, false);
    }
  }

  // 6. Order Management Tests (Read-only)
  console.log("📋 TESTING ORDER MANAGEMENT ENDPOINTS (READ-ONLY)\n");
  
  try {
    console.log("📋 Testing getOrders()...");
    const orders = await okx.getOrders({
      side: "buy",
      pageIndex: "1",
      pageSize: "10"
    });
    logTest("Get Orders", true, {
      count: orders.orders.length,
      sample: orders.orders.slice(0, 2) // Show first 2 orders only
    });
    trackTest("Order Management", "getOrders", true);
  } catch (error) {
    logTest("Get Orders", false, null, error);
    trackTest("Order Management", "getOrders", false);
  }

  // 7. Test Ad Creation (CAREFUL - creates real ads!)
  console.log("⚠️  TESTING AD CREATION (CREATES REAL ADS - USE WITH CAUTION)\n");
  
  if (ENABLE_AD_CREATION_TESTS) {
    try {
      console.log("⚠️  Testing createAd() - Creating test ad...");
      const createAdResult = await okx.createAd({
        side: "sell",
        cryptoCurrency: "USDT",
        fiatCurrency: "KES",
        cryptoAmount: "100",
        minOrderLimit: "10",
        maxOrderLimit: "50",
        unitPrice: "150.00",
        type: "limit",
        paymentMethods: ["bank"],
        targetGroup: "all",
        remark: "Test ad - please ignore"
      });
      logTest("Create Ad (TEST)", true, createAdResult);
      trackTest("Ad Creation", "createAd", true);

      // If ad creation succeeded, test updating and canceling it
      if (createAdResult.success && createAdResult.adId) {
        try {
          console.log("⚠️  Testing updateAd()...");
          const updateResult = await okx.updateAd(createAdResult.adId, {
            unitPrice: "151.00"
          });
          logTest("Update Ad", true, updateResult);
          trackTest("Ad Creation", "updateAd", true);
        } catch (error) {
          logTest("Update Ad", false, null, error);
          trackTest("Ad Creation", "updateAd", false);
        }

        try {
          console.log("⚠️  Testing updateAdStatus()...");
          const statusResult = await okx.updateAdStatus(createAdResult.adId, "hidden");
          logTest("Update Ad Status", true, statusResult);
          trackTest("Ad Creation", "updateAdStatus", true);
        } catch (error) {
          logTest("Update Ad Status", false, null, error);
          trackTest("Ad Creation", "updateAdStatus", false);
        }

        try {
          console.log("⚠️  Testing cancelAd()...");
          const cancelResult = await okx.cancelAd(createAdResult.adId);
          logTest("Cancel Ad", true, cancelResult);
          trackTest("Ad Creation", "cancelAd", true);
        } catch (error) {
          logTest("Cancel Ad", false, null, error);
          trackTest("Ad Creation", "cancelAd", false);
        }
      }
    } catch (error) {
      logTest("Create Ad (TEST)", false, null, error);
      trackTest("Ad Creation", "createAd", false);
    }
  } else {
    console.log("🔒 Ad creation tests skipped (set ENABLE_AD_CREATION_TESTS = true to enable)");
  }

  // 8. Test Payment Method Management (CAREFUL - creates real payment methods!)
  console.log("💳 TESTING PAYMENT METHOD MANAGEMENT (CREATES REAL PAYMENT METHODS)\n");
  
  if (ENABLE_PAYMENT_METHOD_TESTS) {
    try {
      console.log("⚠️  Testing addPaymentMethod()...");
      const addPmResult = await okx.addPaymentMethod({
        currency: "KES",
        type: "bank",
        isEnabled: true,
        applicationType: "individual",
        details: {
          bankName: "Test Bank",
          accountNumber: "1234567890",
          accountName: "Test Account"
        }
      });
      logTest("Add Payment Method (TEST)", true, addPmResult);
      trackTest("Payment Methods", "addPaymentMethod", true);

      // If payment method was created, test updating and deleting it
      if (addPmResult.success && addPmResult.paymentMethodId) {
        try {
          console.log("⚠️  Testing updatePaymentMethod()...");
          const updatePmResult = await okx.updatePaymentMethod(addPmResult.paymentMethodId, {
            paymentMethodId: addPmResult.paymentMethodId,
            currency: "KES",
            type: "bank",
            isEnabled: false,
            applicationType: "individual",
            details: {
              bankName: "Updated Test Bank",
              accountNumber: "1234567890",
              accountName: "Updated Test Account"
            }
          });
          logTest("Update Payment Method", true, updatePmResult);
          trackTest("Payment Methods", "updatePaymentMethod", true);
        } catch (error) {
          logTest("Update Payment Method", false, null, error);
          trackTest("Payment Methods", "updatePaymentMethod", false);
        }

        try {
          console.log("⚠️  Testing deletePaymentMethod()...");
          const deletePmResult = await okx.deletePaymentMethod(addPmResult.paymentMethodId);
          logTest("Delete Payment Method", true, deletePmResult);
          trackTest("Payment Methods", "deletePaymentMethod", true);
        } catch (error) {
          logTest("Delete Payment Method", false, null, error);
          trackTest("Payment Methods", "deletePaymentMethod", false);
        }
      }
    } catch (error) {
      logTest("Add Payment Method (TEST)", false, null, error);
      trackTest("Payment Methods", "addPaymentMethod", false);
    }
  } else {
    console.log("🔒 Payment method creation tests skipped (set ENABLE_PAYMENT_METHOD_TESTS = true to enable)");
  }

  // 9. Test Order Creation (CAREFUL - creates real orders!)
  console.log("📋 TESTING ORDER CREATION (CREATES REAL ORDERS)\n");
  
  if (ENABLE_ORDER_TESTS) {
    console.log("⚠️  Order creation tests are disabled by default to prevent accidental real orders.");
    console.log("🔒 Order creation tests skipped (set ENABLE_ORDER_TESTS = true to enable)");
  } else {
    console.log("🔒 Order creation tests skipped (set ENABLE_ORDER_TESTS = true to enable)");
  }

  // Test Summary
  console.log("=".repeat(50));
  console.log("📊 COMPREHENSIVE TEST SUMMARY");
  console.log("=".repeat(50));
  
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Successful: ${summary.successCount}`);
  console.log(`Failed: ${summary.totalTests - summary.successCount}`);
  console.log(`Success Rate: ${((summary.successCount / summary.totalTests) * 100).toFixed(1)}%`);
  
  console.log("\n📋 Category Breakdown:");
  Object.entries(summary.categories).forEach(([category, stats]) => {
    const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
  });
  
  if (summary.failedTests.length > 0) {
    console.log("\n❌ Failed Tests:");
    summary.failedTests.forEach(test => {
      console.log(`  - ${test}`);
    });
  }
  
  console.log("\n" + "=".repeat(50));
  
  if (summary.successCount === summary.totalTests) {
    console.log("🎉 All tests passed! OKX integration is working perfectly.");
  } else if (summary.successCount > summary.totalTests * 0.8) {
    console.log("✅ Most tests passed! OKX integration is mostly working.");
  } else if (summary.successCount > summary.totalTests * 0.5) {
    console.log("⚠️  Some tests failed. Please check your API credentials and permissions.");
  } else {
    console.log("❌ Many tests failed. Please verify your API credentials and network connection.");
  }
  
  console.log("\n💡 Notes:");
  console.log("- Some endpoints may fail due to insufficient permissions or account limitations");
  console.log("- Balance queries may return zero if you don't hold the specified currencies");
  console.log("- Ad/Order creation tests are disabled by default to prevent accidental real transactions");
  console.log("- Enable specific test categories only if you want to test those features");
  
  return summary;
}

// Run the test if this file is executed directly
if (require.main === module) {
  runOkxTest().catch(console.error);
}