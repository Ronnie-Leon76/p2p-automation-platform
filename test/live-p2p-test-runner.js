#!/usr/bin/env node

/**
 * Live P2P Payment System Test Runner - JavaScript Version
 * Makes real API calls to test complete sell and buy order flows with SasaPay sandbox
 */

// Dynamic import for ES modules
let fetch;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function logStep(step, message) {
  log(`${step} ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

class LiveP2PTestRunner {
  constructor(baseUrl) {
    // Use ngrok static domain from environment or fallback to localhost
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    this.testResults = [];
    this.fetchModule = null;
  }

  /**
   * Initialize fetch module
   */
  async initializeFetch() {
    if (!this.fetchModule) {
      this.fetchModule = await import('node-fetch');
      fetch = this.fetchModule.default;
    }
  }

  /**
   * Make real HTTP API call
   */
  async makeApiCall(endpoint, data, method = 'POST') {
    await this.initializeFetch();
    
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    log(`🔗 ${method} ${endpoint}`, 'blue');
    log(`📤 Request: ${JSON.stringify(data, null, 2)}`, 'cyan');

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add ngrok skip header if using ngrok URL
      if (url.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;
      
      log(`📥 Response (${duration}ms): ${JSON.stringify(result, null, 2)}`, 'cyan');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || result.message || 'API call failed'}`);
      }
      
      return { ...result, _meta: { status: response.status, duration } };
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(`API call failed (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  /**
   * Test SasaPay authentication
   */
  async testSasaPayAuthentication() {
    log('\n🔐 Testing SasaPay Authentication...', 'cyan');
    
    try {
      logStep('1.', 'Connecting to SasaPay sandbox...');
      const result = await this.makeApiCall('/api/test/sasapay-auth', {});
      
      if (result.success && result.access_token) {
        logSuccess(`Authentication successful!`);
        log(`   Token: ${result.access_token}`, 'green');
        log(`   Environment: ${result.environment}`, 'green');
        return true;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      logError(`SasaPay authentication failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test phone number normalization
   */
  async testPhoneNormalization() {
    log('\n📱 Testing Phone Number Normalization...', 'cyan');
    
    const testCases = [
      { input: '0712345678', expected: '254712345678' },
      { input: '254712345678', expected: '254712345678' },
      { input: '+254712345678', expected: '254712345678' },
      { input: '12345', expected: null } // Should fail
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
      try {
        logStep('→', `Testing ${testCase.input}...`);
        
        const result = await this.makeApiCall('/api/test/phone-normalize', {
          phone: testCase.input
        });
        
        if (testCase.expected === null) {
          // Expect this to fail
          if (!result.success) {
            logSuccess(`${testCase.input} → Correctly rejected (invalid format)`);
          } else {
            throw new Error(`Expected failure but got: ${result.normalized}`);
          }
        } else {
          if (result.success && result.normalized === testCase.expected) {
            logSuccess(`${testCase.input} → ${result.normalized}`);
          } else {
            throw new Error(`Expected ${testCase.expected}, got ${result.normalized}`);
          }
        }
      } catch (error) {
        logError(`${testCase.input} → ${error.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  /**
   * Test complete sell order flow with real SasaPay C2B API
   */
  async testSellOrderFlow() {
    log('\n🧪 Testing Sell Order Flow (Live SasaPay C2B)...', 'cyan');
    
    const orderId = `live-sell-${Date.now()}`;
    const testData = {
      id: orderId,
      seller_id: "live-seller-001",
      buyer_id: "live-buyer-001",
      buyer_phone: "254708374149", // SasaPay test number
      amount_fiat: 35, // Small amount for testing
      crypto_currency: "ETH",
      amount_crypto: 0.001
    };

    try {
      // Step 1: Match order
      logStep('1.', 'Matching sell order...');
      const matchResult = await this.makeApiCall('/api/orders/p2p?action=match_order', {
        order_id: testData.id,
        buyer_id: testData.buyer_id,
        seller_id: testData.seller_id,
        buyer_phone: testData.buyer_phone
      });
      logSuccess(`Order matched: ${matchResult.order_id || 'success'}`);

      // Step 2: Request C2B payment (REAL SasaPay API call)
      logStep('2.', 'Requesting C2B payment from SasaPay...');
      const paymentResult = await this.makeApiCall('/api/orders/p2p?action=request_payment', {
        order_id: testData.id,
        buyer_phone: testData.buyer_phone,
        amount: testData.amount_fiat,
        description: `Live test: Purchase ${testData.amount_crypto} ${testData.crypto_currency}`
      });
      
      if (paymentResult.success) {
        logSuccess('C2B payment request sent to SasaPay!');
        log(`   Transaction ID: ${paymentResult.transaction_id}`, 'green');
        log(`   Checkout Request: ${paymentResult.checkout_request_id}`, 'green');
        log(`   Customer Message: ${paymentResult.customer_message}`, 'green');
      } else {
        throw new Error(paymentResult.error || 'Payment request failed');
      }

      // Step 3: Find matching transactions
      logStep('3.', 'Searching for matching transactions...');
      const transactionResult = await this.makeApiCall('/api/orders/p2p?action=find_matching_transactions', {
        order_id: testData.id,
        expected_amount: testData.amount_fiat,
        buyer_phone: testData.buyer_phone
      });
      logSuccess('Transaction search completed');

      // Step 4: Seller confirms payment
      logStep('4.', 'Seller confirming payment received...');
      const confirmResult = await this.makeApiCall('/api/orders/p2p?action=confirm_payment_received', {
        order_id: testData.id,
        seller_id: testData.seller_id
      });
      logSuccess('Payment confirmation processed');

      logSuccess('Sell order flow completed successfully!');
      return true;

    } catch (error) {
      logError(`Sell order flow failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test complete buy order flow with real SasaPay B2C API
   */
  async testBuyOrderFlow() {
    log('\n🧪 Testing Buy Order Flow (Live SasaPay B2C)...', 'cyan');
    
    const orderId = `live-buy-${Date.now()}`;
    const testData = {
      id: orderId,
      buyer_id: "live-buyer-002",
      seller_phone: "254708374149", // SasaPay test number
      amount: 50, // Small amount for testing
      crypto_currency: "BTC",
      amount_crypto: 0.0001
    };

    try {
      // Step 1: Initiate B2C payment (REAL SasaPay API call)
      logStep('1.', 'Initiating B2C payment to seller via SasaPay...');
      const b2cResult = await this.makeApiCall('/api/orders/p2p?action=initiate_buy_order', {
        buy_order_id: testData.id,
        buyer_id: testData.buyer_id,
        seller_phone_number: testData.seller_phone,
        amount: testData.amount
      });
      
      if (b2cResult.success) {
        logSuccess('B2C payment initiated to seller!');
        log(`   Transaction ID: ${b2cResult.transaction_id}`, 'green');
        log(`   Checkout Request: ${b2cResult.checkout_request_id}`, 'green');
        log(`   Customer Message: ${b2cResult.customer_message}`, 'green');
      } else {
        throw new Error(b2cResult.error || 'B2C payment failed');
      }

      // Step 2: Check payment status
      logStep('2.', 'Checking payment status...');
      const statusResult = await this.makeApiCall('/api/orders/p2p?action=check_payment_status', {
        order_id: testData.id
      });
      logSuccess('Payment status checked');

      logSuccess('Buy order flow completed successfully!');
      return true;

    } catch (error) {
      logError(`Buy order flow failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test webhook processing
   */
  async testWebhookProcessing() {
    log('\n🔗 Testing Webhook Processing...', 'cyan');

    try {
      // Test C2B callback
      logStep('1.', 'Testing C2B webhook callback...');
      const c2bCallback = {
        MerchantRequestID: "live-test-" + Date.now(),
        CheckoutRequestID: "ws_CO_live_" + Date.now(),
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CustomerMobile: "254708374149",
        BillRefNumber: "live-test-order-001",
        TransAmount: "35.00",
        TransactionDate: new Date().toISOString().replace(/[-:]/g, '').split('T')[0] + new Date().toTimeString().replace(/:/g, '').substr(0, 6)
      };

      const c2bResult = await this.makeApiCall('/api/webhooks/sasapay', c2bCallback);
      logSuccess('C2B webhook processed successfully');

      // Test B2C callback
      logStep('2.', 'Testing B2C webhook callback...');
      const b2cCallback = {
        MerchantCode: "600000",
        DestinationChannel: "MPESA",
        RecipientName: "Test User",
        RecipientAccountNumber: "254708374149",
        ResultCode: "0",
        ResultDesc: "The service request is processed successfully.",
        SasaPayTransactionID: "TX" + Date.now(),
        TransactionAmount: "50",
        MerchantTransactionReference: `P2P_BUY_live_${Date.now()}`,
        TransactionDate: new Date().toISOString().replace(/[-:]/g, '').split('T')[0] + new Date().toTimeString().replace(/:/g, '').substr(0, 6)
      };

      const b2cResult = await this.makeApiCall('/api/webhooks/sasapay', b2cCallback);
      logSuccess('B2C webhook processed successfully');

      logSuccess('Webhook processing test completed!');
      return true;

    } catch (error) {
      logError(`Webhook test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all live tests
   */
  async runAllLiveTests() {
    log(colorize('\n🚀 Live P2P Payment System Test Suite with SasaPay Sandbox', 'bright'));
    log('='.repeat(70));
    log(`🔗 Testing against: ${this.baseUrl}`, 'blue');
    log(`🌐 Webhook URL: ${process.env.SASAPAY_CALLBACK_URL || 'Not configured'}`, 'blue');
    log(`🏗️  Environment: ${process.env.SASAPAY_ENVIRONMENT || 'Not configured'}`, 'blue');
    
    const startTime = Date.now();
    const results = [];
    
    // Run all test scenarios
    results.push(await this.testSasaPayAuthentication());
    results.push(await this.testPhoneNormalization());
    results.push(await this.testSellOrderFlow());
    results.push(await this.testBuyOrderFlow());
    results.push(await this.testWebhookProcessing());
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Display summary
    log('\n' + '='.repeat(70));
    log(colorize('📊 LIVE TEST SUMMARY', 'bright'));
    log('='.repeat(70));
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    if (passed === total) {
      logSuccess(`🎉 ALL ${total} TESTS PASSED! ✨`);
    } else {
      logWarning(`${passed}/${total} tests passed`);
    }
    
    log(`⏱️  Total time: ${duration}s`);
    
    const testNames = [
      'SasaPay Authentication',
      'Phone Number Normalization',
      'Sell Order Flow (C2B)',
      'Buy Order Flow (B2C)',
      'Webhook Processing'
    ];
    
    log('\n📋 Detailed Results:', 'bright');
    testNames.forEach((name, index) => {
      const status = results[index] ? '✅ PASS' : '❌ FAIL';
      log(`   ${name}: ${status}`);
    });
    
    log('\n💡 Next Steps:', 'bright');
    if (passed === total) {
      log('   ✓ SasaPay sandbox integration working!');
      log('   ✓ Ready for real mobile money testing');
      log('   ✓ Webhook callbacks configured correctly');
      log('   → Test with real phone numbers and small amounts');
      log('   → Monitor webhook delivery in ngrok dashboard');
      log('   → Validate database persistence');
    } else {
      log('   → Review failed tests and configuration');
      log('   → Check SasaPay sandbox credentials');
      log('   → Verify ngrok tunnel accessibility');
      log('   → Check environment variables');
    }
    
    log('\n📚 Resources:', 'bright');
    log('   🌐 Ngrok Dashboard: http://localhost:4040');
    log('   🧪 Test Dashboard: http://localhost:3000/test-p2p');
    log('   📖 SasaPay Docs: https://developer.sasapay.app');
    
    process.exit(passed === total ? 0 : 1);
  }
}

// CLI interface
async function main() {
  const testRunner = new LiveP2PTestRunner();
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'auth':
      await testRunner.testSasaPayAuthentication();
      break;
    case 'phone':
      await testRunner.testPhoneNormalization();
      break;
    case 'sell':
      await testRunner.testSellOrderFlow();
      break;
    case 'buy':
      await testRunner.testBuyOrderFlow();
      break;
    case 'webhooks':
      await testRunner.testWebhookProcessing();
      break;
    case 'all':
      await testRunner.runAllLiveTests();
      break;
    default:
      log(colorize('\nLive P2P Payment System Test CLI', 'bright'));
      log('Usage: npm run test:live [command]');
      log('\nCommands:');
      log('  auth      Test SasaPay sandbox authentication');
      log('  phone     Test phone number normalization');
      log('  sell      Test sell order flow with real C2B API');
      log('  buy       Test buy order flow with real B2C API');
      log('  webhooks  Test webhook callback processing');
      log('  all       Run all live tests (default)');
      log('\nExamples:');
      log('  npm run test:live');
      log('  npm run test:live auth');
      log('  npm run test:live sell');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n⚠️  Live test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    logError(`Live test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { LiveP2PTestRunner };
