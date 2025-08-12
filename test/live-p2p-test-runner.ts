/**
 * P2P Payment System Test Runner - Live SasaPay Sandbox Testing
 * Makes real API calls to test complete sell and buy order flows
 */

import fetch from 'node-fetch';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
  timestamp?: string;
  duration?: number;
}

interface MockOrder {
  id: string;
  type: 'sell' | 'buy';
  amount: number;
  crypto: string;
  fiat: string;
  rate: number;
  status: string;
  phone?: string;
}

export class LiveP2PTestRunner {
  private baseUrl: string;
  private testResults: TestResult[] = [];

  constructor(baseUrl?: string) {
    // Use ngrok static domain from environment or fallback to localhost
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Make real HTTP API call to the P2P system
   */
  private async makeApiCall(endpoint: string, data: any, method = 'POST'): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    console.log(`🔗 ${method} ${endpoint}`);
    console.log("📤 Request:", JSON.stringify(data, null, 2));

    try {
      const headers: Record<string, string> = {
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

      const result = await response.json() as any;
      const duration = Date.now() - startTime;
      
      console.log(`📥 Response (${duration}ms):`, JSON.stringify(result, null, 2));
      
      if (!response.ok) {
        const errorMessage = (result && typeof result === 'object') 
          ? (result.error || result.message || 'API call failed')
          : 'API call failed';
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      
      return { ...result, _meta: { status: response.status, duration } };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ API call failed (${duration}ms):`, errorMessage);
      throw error;
    }
  }

  /**
   * Add test result to tracking
   */
  private addTestResult(test: string, status: TestResult['status'], message?: string, data?: any, duration?: number) {
    const result: TestResult = {
      test,
      status,
      message,
      data,
      duration,
      timestamp: new Date().toLocaleString()
    };
    
    this.testResults.push(result);
    
    const statusIcon = {
      pending: '⏳',
      running: '🔄',
      success: '✅',
      error: '❌'
    }[status];
    
    console.log(`${statusIcon} ${test}: ${message || status}`);
  }

  /**
   * Test SasaPay authentication
   */
  async testSasaPayAuthentication(): Promise<boolean> {
    this.addTestResult('SasaPay Authentication', 'running', 'Testing authentication...');
    
    try {
      const result = await this.makeApiCall('/api/test/sasapay-auth', {});
      
      if (result.success && result.access_token) {
        this.addTestResult('SasaPay Authentication', 'success', 'Authentication successful', {
          token_type: result.token_type,
          expires_in: result.expires_in
        });
        return true;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      this.addTestResult('SasaPay Authentication', 'error', errorMessage);
      return false;
    }
  }

  /**
   * Test phone number normalization
   */
  async testPhoneNormalization(): Promise<boolean> {
    console.log('\\n🧪 Testing Phone Number Normalization (Live)...');
    
    const testCases = [
      { input: '0712345678', expected: '254712345678' },
      { input: '254712345678', expected: '254712345678' },
      { input: '+254712345678', expected: '254712345678' },
      { input: '12345', expected: null } // Should fail validation
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
      try {
        this.addTestResult(`Phone: ${testCase.input}`, 'running', 'Testing normalization...');
        
        const result = await this.makeApiCall('/api/test/phone-normalize', {
          phone: testCase.input
        });
        
        if (testCase.expected === null) {
          // Expect this to fail
          if (!result.success) {
            this.addTestResult(`Phone: ${testCase.input}`, 'success', 'Correctly rejected invalid format');
          } else {
            throw new Error(`Expected failure but got: ${result.normalized}`);
          }
        } else {
          if (result.success && result.normalized === testCase.expected) {
            this.addTestResult(`Phone: ${testCase.input}`, 'success', `${testCase.input} → ${result.normalized}`);
          } else {
            throw new Error(`Expected ${testCase.expected}, got ${result.normalized}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Phone normalization failed';
        this.addTestResult(`Phone: ${testCase.input}`, 'error', errorMessage);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  /**
   * Test complete sell order flow with real SasaPay API
   */
  async testSellOrderFlow(): Promise<boolean> {
    console.log('\\n🧪 Testing Sell Order Flow (Live SasaPay)...');
    
    const orderId = `live-sell-${Date.now()}`;
    const sellOrder = {
      id: orderId,
      seller_id: "live-seller-001",
      buyer_id: "live-buyer-001",
      crypto_currency: "ETH",
      fiat_currency: "KES",
      amount_crypto: 0.001, // Small amount for testing
      amount_fiat: 35, // Small KES amount for testing
      rate: 35000,
      status: "matched",
      buyer_phone: "254708374149", // SasaPay test number
      seller_phone: "254712345678"
    };

    try {
      // Step 1: Match order
      this.addTestResult('Match Sell Order', 'running', 'Matching order...');
      const matchResult = await this.makeApiCall('/api/orders/p2p?action=match_order', {
        order_id: sellOrder.id,
        buyer_id: sellOrder.buyer_id,
        seller_id: sellOrder.seller_id,
        buyer_phone: sellOrder.buyer_phone
      });
      this.addTestResult('Match Sell Order', 'success', 'Order matched', matchResult);

      // Step 2: Request C2B payment (this will make real SasaPay API call)
      this.addTestResult('Request C2B Payment', 'running', 'Requesting payment from buyer...');
      const paymentResult = await this.makeApiCall('/api/orders/p2p?action=request_payment', {
        order_id: sellOrder.id,
        buyer_phone: sellOrder.buyer_phone,
        amount: sellOrder.amount_fiat,
        description: `Live test: Purchase ${sellOrder.amount_crypto} ${sellOrder.crypto_currency}`
      });
      this.addTestResult('Request C2B Payment', 'success', 'C2B payment requested', {
        transaction_id: paymentResult.transaction_id,
        checkout_request_id: paymentResult.checkout_request_id,
        customer_message: paymentResult.customer_message
      });

      // Step 3: Simulate payment and find matching transactions
      this.addTestResult('Find Matching Transactions', 'running', 'Looking for matching transactions...');
      const transactionResult = await this.makeApiCall('/api/orders/p2p?action=find_matching_transactions', {
        order_id: sellOrder.id,
        expected_amount: sellOrder.amount_fiat,
        buyer_phone: sellOrder.buyer_phone
      });
      this.addTestResult('Find Matching Transactions', 'success', 'Transactions searched', transactionResult);

      // Step 4: Seller confirms payment
      this.addTestResult('Confirm Payment Received', 'running', 'Seller confirming payment...');
      const confirmResult = await this.makeApiCall('/api/orders/p2p?action=confirm_payment_received', {
        order_id: sellOrder.id,
        seller_id: sellOrder.seller_id
      });
      this.addTestResult('Confirm Payment Received', 'success', 'Payment confirmed', confirmResult);

      console.log('✅ Sell order flow completed successfully!');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sell order flow failed';
      this.addTestResult('Sell Order Flow', 'error', `Flow failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Test complete buy order flow with real SasaPay B2C API
   */
  async testBuyOrderFlow(): Promise<boolean> {
    console.log('\\n🧪 Testing Buy Order Flow (Live SasaPay B2C)...');
    
    const orderId = `live-buy-${Date.now()}`;
    const buyOrder = {
      id: orderId,
      buyer_id: "live-buyer-002",
      seller_phone: "254708374149", // SasaPay test number
      amount: 50, // Small KES amount for testing
      crypto_currency: "BTC",
      amount_crypto: 0.0001 // Small BTC amount
    };

    try {
      // Step 1: Initiate B2C payment to seller (real SasaPay API call)
      this.addTestResult('Initiate B2C Payment', 'running', 'Sending payment to seller...');
      const b2cResult = await this.makeApiCall('/api/orders/p2p?action=initiate_buy_order', {
        buy_order_id: buyOrder.id,
        buyer_id: buyOrder.buyer_id,
        seller_phone_number: buyOrder.seller_phone,
        amount: buyOrder.amount
      });
      this.addTestResult('Initiate B2C Payment', 'success', 'B2C payment initiated', {
        transaction_id: b2cResult.transaction_id,
        checkout_request_id: b2cResult.checkout_request_id,
        customer_message: b2cResult.customer_message
      });

      // Step 2: Check payment status
      this.addTestResult('Check Payment Status', 'running', 'Checking B2C payment status...');
      const statusResult = await this.makeApiCall('/api/orders/p2p?action=check_payment_status', {
        order_id: buyOrder.id
      });
      this.addTestResult('Check Payment Status', 'success', 'Status checked', statusResult);

      console.log('✅ Buy order flow completed successfully!');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Buy order flow failed';
      this.addTestResult('Buy Order Flow', 'error', `Flow failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Test webhook processing with real callback data
   */
  async testWebhookProcessing(): Promise<boolean> {
    console.log('\\n🧪 Testing Webhook Processing (Live Callbacks)...');

    try {
      // Test C2B callback (simulating real SasaPay callback)
      this.addTestResult('C2B Webhook Processing', 'running', 'Testing C2B callback...');
      const c2bCallback = {
        MerchantRequestID: "test-" + Date.now(),
        CheckoutRequestID: "ws_CO_test_" + Date.now(),
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CustomerMobile: "254708374149",
        BillRefNumber: "live-test-order-001",
        TransAmount: "35.00",
        TransactionDate: new Date().toISOString().replace(/[-:]/g, '').split('T')[0] + new Date().toTimeString().replace(/:/g, '').substr(0, 6)
      };

      const c2bResult = await this.makeApiCall('/api/webhooks/sasapay', c2bCallback);
      this.addTestResult('C2B Webhook Processing', 'success', 'C2B webhook processed', c2bResult);

      // Test B2C callback
      this.addTestResult('B2C Webhook Processing', 'running', 'Testing B2C callback...');
      const b2cCallback = {
        MerchantCode: "600000",
        DestinationChannel: "MPESA",
        RecipientName: "Test User",
        RecipientAccountNumber: "254708374149",
        ResultCode: "0",
        ResultDesc: "The service request is processed successfully.",
        SourceChannel: "API",
        SasaPayTransactionCode: "SP" + Date.now(),
        CheckoutRequestID: "req_" + Date.now(),
        SasaPayTransactionID: "TX" + Date.now(),
        ThirdPartyTransactionCode: "EXT" + Date.now(),
        TransactionAmount: "50",
        TransactionCharges: "0",
        MerchantRequestID: "REQ" + Date.now(),
        MerchantTransactionReference: `P2P_BUY_live_${Date.now()}`,
        TransactionDate: new Date().toISOString().replace(/[-:]/g, '').split('T')[0] + new Date().toTimeString().replace(/:/g, '').substr(0, 6),
        MerchantAccountBalance: "100000"
      };

      const b2cResult = await this.makeApiCall('/api/webhooks/sasapay', b2cCallback);
      this.addTestResult('B2C Webhook Processing', 'success', 'B2C webhook processed', b2cResult);

      console.log('✅ Webhook processing test completed!');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
      this.addTestResult('Webhook Processing', 'error', `Webhook test failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Run comprehensive live test suite
   */
  async runLiveTestSuite(): Promise<void> {
    console.log('🚀 Starting Live P2P Payment System Tests with SasaPay Sandbox...');
    console.log('=' .repeat(70));

    const startTime = Date.now();
    const testResults: boolean[] = [];

    try {
      // Test 1: SasaPay Authentication
      testResults.push(await this.testSasaPayAuthentication());
      console.log('\\n' + '-'.repeat(50));

      // Test 2: Phone Number Normalization
      testResults.push(await this.testPhoneNormalization());
      console.log('\\n' + '-'.repeat(50));

      // Test 3: Sell Order Flow (C2B)
      testResults.push(await this.testSellOrderFlow());
      console.log('\\n' + '-'.repeat(50));

      // Test 4: Buy Order Flow (B2C)
      testResults.push(await this.testBuyOrderFlow());
      console.log('\\n' + '-'.repeat(50));

      // Test 5: Webhook Processing
      testResults.push(await this.testWebhookProcessing());

    } catch (error) {
      console.error('\\n❌ Test suite execution failed:', error);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Display comprehensive summary
    console.log('\\n' + '='.repeat(70));
    console.log('📊 LIVE TEST SUITE SUMMARY');
    console.log('='.repeat(70));

    const passed = testResults.filter(r => r).length;
    const total = testResults.length;

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! ✨');
    } else {
      console.log(`⚠️  ${passed}/${total} tests passed`);
    }

    console.log(`⏱️  Total execution time: ${duration}s`);
    console.log(`🔗 Ngrok webhook URL: ${process.env.SASAPAY_CALLBACK_URL || 'Not configured'}`);
    console.log(`🏗️  SasaPay environment: ${process.env.SASAPAY_ENVIRONMENT || 'Not configured'}`);

    // Detailed results
    console.log('\\n📋 Detailed Results:');
    const testNames = [
      'SasaPay Authentication',
      'Phone Number Normalization',
      'Sell Order Flow (C2B)',
      'Buy Order Flow (B2C)',
      'Webhook Processing'
    ];

    testNames.forEach((name, index) => {
      const status = testResults[index] ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${name}: ${status}`);
    });

    // Show test result details
    console.log('\\n🔍 Test Details:');
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`   ${index + 1}. ${icon} ${result.test}${duration}`);
      if (result.message) console.log(`      ${result.message}`);
    });

    console.log('\\n💡 Next Steps:');
    if (passed === total) {
      console.log('   - Test with real mobile money transactions');
      console.log('   - Monitor webhook callbacks in real-time');
      console.log('   - Validate database persistence');
      console.log('   - Test error scenarios and edge cases');
    } else {
      console.log('   - Review failed tests and fix issues');
      console.log('   - Check SasaPay sandbox configuration');
      console.log('   - Verify ngrok tunnel is accessible');
      console.log('   - Check environment variables');
    }

    console.log('\\n📚 Documentation:');
    console.log('   - SasaPay API: https://developer.sasapay.app');
    console.log('   - Webhook testing: Check ngrok dashboard at http://localhost:4040');
    console.log('   - Test dashboard: http://localhost:3000/test-p2p');

    process.exit(passed === total ? 0 : 1);
  }

  /**
   * Generate test report for file output
   */
  generateLiveTestReport(): string {
    const timestamp = new Date().toLocaleString();
    let report = `# Live P2P Payment System Test Report\\n\\n`;
    report += `**Generated:** ${timestamp}\\n`;
    report += `**Environment:** SasaPay Sandbox\\n`;
    report += `**Webhook URL:** ${process.env.SASAPAY_CALLBACK_URL}\\n\\n`;

    report += `## Test Results Summary\\n\\n`;
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'success' ? '✅ PASS' : result.status === 'error' ? '❌ FAIL' : '⏳ PENDING';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      
      report += `### ${index + 1}. ${result.test}\\n`;
      report += `**Status:** ${status}${duration}\\n`;
      if (result.message) report += `**Message:** ${result.message}\\n`;
      if (result.data) {
        report += `**Data:**\\n\`\`\`json\\n${JSON.stringify(result.data, null, 2)}\\n\`\`\`\\n`;
      }
      report += `**Timestamp:** ${result.timestamp}\\n\\n`;
    });

    return report;
  }
}

// Export for use in other modules
export const liveP2PTestRunner = new LiveP2PTestRunner();

// CLI interface for running live tests
if (typeof window === 'undefined' && require.main === module) {
  const testRunner = new LiveP2PTestRunner();
  
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'auth':
      testRunner.testSasaPayAuthentication().catch(console.error);
      break;
    case 'phone':
      testRunner.testPhoneNormalization().catch(console.error);
      break;
    case 'sell':
      testRunner.testSellOrderFlow().catch(console.error);
      break;
    case 'buy':
      testRunner.testBuyOrderFlow().catch(console.error);
      break;
    case 'webhooks':
      testRunner.testWebhookProcessing().catch(console.error);
      break;
    case 'all':
      testRunner.runLiveTestSuite().catch(console.error);
      break;
    case 'report':
      console.log(testRunner.generateLiveTestReport());
      break;
    default:
      console.log("Usage: node live-p2p-test-runner.js [auth|phone|sell|buy|webhooks|all|report]");
      console.log("\\nLive Testing Commands:");
      console.log("  auth      Test SasaPay authentication");
      console.log("  phone     Test phone number normalization");
      console.log("  sell      Test sell order flow with real C2B");
      console.log("  buy       Test buy order flow with real B2C");
      console.log("  webhooks  Test webhook processing");
      console.log("  all       Run all live tests (default)");
      console.log("  report    Generate test report");
  }
}
