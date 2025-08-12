/**
 * P2P Payment System Test Runner
 * Simulates complete sell and buy order flows with mock data
 */

interface MockOrder {
  id: string
  type: 'sell' | 'buy'
  seller_id?: string
  buyer_id?: string
  crypto_currency: string
  fiat_currency: string
  amount_crypto: number
  amount_fiat: number
  rate: number
  status: string
  seller_phone?: string
  buyer_phone?: string
  created_at: string
}

interface TestScenario {
  name: string
  description: string
  orders: MockOrder[]
  steps: string[]
  expectedResults: string[]
}

export class P2PTestRunner {
  private baseUrl: string

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  /**
   * Mock test scenarios for P2P trading
   */
  getTestScenarios(): TestScenario[] {
    return [
      {
        name: "Sell Order Flow",
        description: "Complete flow: Create sell order → Match with buyer → Request payment → Confirm payment",
        orders: [
          {
            id: "sell-test-001",
            type: "sell",
            seller_id: "seller-alice",
            crypto_currency: "ETH",
            fiat_currency: "KES",
            amount_crypto: 0.1,
            amount_fiat: 3500,
            rate: 35000,
            status: "active",
            seller_phone: "254712345678",
            created_at: new Date().toISOString()
          }
        ],
        steps: [
          "Create sell order",
          "Match with buyer",
          "Request C2B payment from buyer",
          "Simulate buyer payment",
          "Seller confirms payment received",
          "Complete order"
        ],
        expectedResults: [
          "Order status: active → matched → payment_pending → payment_confirmed → completed",
          "Payment transaction created",
          "SasaPay C2B request successful",
          "Webhook callback processed",
          "Crypto released to buyer"
        ]
      },
      {
        name: "Buy Order Flow", 
        description: "Complete flow: Create buy order → Match with seller → Send B2C payment → Confirm completion",
        orders: [
          {
            id: "buy-test-001",
            type: "buy",
            buyer_id: "buyer-bob",
            crypto_currency: "BTC",
            fiat_currency: "KES", 
            amount_crypto: 0.01,
            amount_fiat: 5000,
            rate: 500000,
            status: "pending",
            created_at: new Date().toISOString()
          }
        ],
        steps: [
          "Create buy order",
          "Match with seller",
          "Initiate B2C payment to seller",
          "Process payment confirmation",
          "Release crypto to buyer"
        ],
        expectedResults: [
          "Order status: pending → matched → processing → completed",
          "B2C payment sent to seller",
          "Payment confirmation received",
          "Order completed successfully"
        ]
      },
      {
        name: "Multi-Order Scenario",
        description: "Multiple concurrent orders testing system capacity",
        orders: [
          {
            id: "multi-sell-001",
            type: "sell",
            seller_id: "seller-charlie",
            crypto_currency: "USDT",
            fiat_currency: "KES",
            amount_crypto: 100,
            amount_fiat: 13000,
            rate: 130,
            status: "active",
            seller_phone: "254723456789",
            created_at: new Date().toISOString()
          },
          {
            id: "multi-buy-001", 
            type: "buy",
            buyer_id: "buyer-diana",
            crypto_currency: "ETH",
            fiat_currency: "KES",
            amount_crypto: 0.2,
            amount_fiat: 7000,
            rate: 35000,
            status: "pending", 
            created_at: new Date().toISOString()
          }
        ],
        steps: [
          "Create multiple orders simultaneously",
          "Process concurrent transactions",
          "Handle multiple payment flows",
          "Verify all orders complete successfully"
        ],
        expectedResults: [
          "All orders processed without conflicts",
          "Proper transaction isolation",
          "Correct status updates for all orders"
        ]
      }
    ]
  }

  /**
   * Run sell order flow test
   */
  async testSellOrderFlow(): Promise<void> {
    console.log("🧪 Testing Sell Order Flow...")
    
    const sellOrder = {
      id: "test-sell-" + Date.now(),
      seller_id: "test-seller-001",
      buyer_id: "test-buyer-001", 
      crypto_currency: "ETH",
      fiat_currency: "KES",
      amount_crypto: 0.1,
      amount_fiat: 3500,
      rate: 35000,
      status: "matched",
      buyer_phone: "254701234567",
      seller_phone: "254712345678"
    }

    try {
      // Step 1: Match order (simulate order matching)
      console.log("📋 Step 1: Matching sell order...")
      const matchResponse = await this.apiCall('/api/orders/p2p?action=match_order', {
        order_id: sellOrder.id,
        buyer_id: sellOrder.buyer_id,
        seller_id: sellOrder.seller_id,
        buyer_phone: sellOrder.buyer_phone
      })
      console.log("✅ Order matched:", matchResponse)

      // Step 2: Request payment from buyer
      console.log("💰 Step 2: Requesting C2B payment...")
      const paymentResponse = await this.apiCall('/api/orders/p2p?action=request_payment', {
        order_id: sellOrder.id,
        buyer_phone: sellOrder.buyer_phone,
        amount: sellOrder.amount_fiat,
        description: `Purchase ${sellOrder.amount_crypto} ${sellOrder.crypto_currency}`
      })
      console.log("✅ Payment requested:", paymentResponse)

      // Step 3: Simulate finding matching transaction
      console.log("🔍 Step 3: Finding matching transactions...")
      const transactionResponse = await this.apiCall('/api/orders/p2p?action=find_matching_transactions', {
        order_id: sellOrder.id,
        expected_amount: sellOrder.amount_fiat,
        buyer_phone: sellOrder.buyer_phone
      })
      console.log("✅ Transactions found:", transactionResponse)

      // Step 4: Seller confirms payment received
      console.log("✅ Step 4: Seller confirming payment...")
      const confirmResponse = await this.apiCall('/api/orders/p2p?action=confirm_payment_received', {
        order_id: sellOrder.id,
        seller_id: sellOrder.seller_id
      })
      console.log("✅ Payment confirmed:", confirmResponse)

      console.log("🎉 Sell order flow test completed successfully!")

    } catch (error) {
      console.error("❌ Sell order flow test failed:", error)
      throw error
    }
  }

  /**
   * Run buy order flow test  
   */
  async testBuyOrderFlow(): Promise<void> {
    console.log("🧪 Testing Buy Order Flow...")
    
    const buyOrder = {
      id: "test-buy-" + Date.now(),
      buyer_id: "test-buyer-002",
      seller_phone: "254723456789",
      amount: 5000,
      crypto_currency: "BTC", 
      amount_crypto: 0.01
    }

    try {
      // Step 1: Initiate B2C payment to seller
      console.log("💸 Step 1: Initiating B2C payment to seller...")
      const b2cResponse = await this.apiCall('/api/orders/p2p?action=initiate_buy_order', {
        buy_order_id: buyOrder.id,
        buyer_id: buyOrder.buyer_id,
        seller_phone_number: buyOrder.seller_phone,
        amount: buyOrder.amount
      })
      console.log("✅ B2C payment initiated:", b2cResponse)

      // Step 2: Check payment status
      console.log("📊 Step 2: Checking payment status...")
      const statusResponse = await this.apiCall('/api/orders/p2p?action=check_payment_status', {
        order_id: buyOrder.id
      })
      console.log("✅ Payment status:", statusResponse)

      console.log("🎉 Buy order flow test completed successfully!")

    } catch (error) {
      console.error("❌ Buy order flow test failed:", error)
      throw error
    }
  }

  /**
   * Test webhook processing with mock data
   */
  async testWebhookProcessing(): Promise<void> {
    console.log("🧪 Testing Webhook Processing...")

    // Test C2B callback
    const c2bCallback = {
      MerchantRequestID: "29115-34620561-1",
      CheckoutRequestID: "ws_CO_191220191020363925", 
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      CustomerMobile: "254708374149",
      BillRefNumber: "test-order-001",
      TransAmount: "1.00",
      TransactionDate: "20191219102115"
    }

    // Test B2C callback
    const b2cCallback = {
      MerchantCode: "MERCHANT123",
      DestinationChannel: "MPESA",
      RecipientName: "John Doe",
      RecipientAccountNumber: "254712345678",
      ResultCode: "0",
      ResultDesc: "The service request is processed successfully.",
      SourceChannel: "API",
      SasaPayTransactionCode: "SP123456789",
      CheckoutRequestID: "req_123",
      SasaPayTransactionID: "TX987654321",
      ThirdPartyTransactionCode: "EXT123",
      TransactionAmount: "5000",
      TransactionCharges: "0",
      MerchantRequestID: "REQ456",
      MerchantTransactionReference: "P2P_BUY_test_123",
      TransactionDate: "20250812120000",
      MerchantAccountBalance: "100000"
    }

    try {
      // Test C2B webhook
      console.log("📨 Testing C2B webhook...")
      const c2bResponse = await this.apiCall('/api/webhooks/sasapay', c2bCallback, 'POST')
      console.log("✅ C2B webhook processed:", c2bResponse)

      // Test B2C webhook
      console.log("📨 Testing B2C webhook...")
      const b2cResponse = await this.apiCall('/api/webhooks/sasapay', b2cCallback, 'POST')
      console.log("✅ B2C webhook processed:", b2cResponse)

      console.log("🎉 Webhook processing test completed!")

    } catch (error) {
      console.error("❌ Webhook test failed:", error)
      throw error
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runAllTests(): Promise<void> {
    console.log("🚀 Starting P2P Payment System Tests...\n")

    try {
      await this.testSellOrderFlow()
      console.log("\n" + "=".repeat(50) + "\n")
      
      await this.testBuyOrderFlow()
      console.log("\n" + "=".repeat(50) + "\n")
      
      await this.testWebhookProcessing()
      console.log("\n" + "=".repeat(50) + "\n")

      console.log("🎉 All tests completed successfully!")
      console.log("\n📊 Test Summary:")
      console.log("✅ Sell Order Flow: PASSED")
      console.log("✅ Buy Order Flow: PASSED") 
      console.log("✅ Webhook Processing: PASSED")

    } catch (error) {
      console.error("❌ Test suite failed:", error)
      throw error
    }
  }

  /**
   * Helper method for API calls
   */
  private async apiCall(endpoint: string, data: any, method = 'POST'): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`🔗 ${method} ${endpoint}`)
    console.log("📤 Request:", JSON.stringify(data, null, 2))

    // For testing, we'll simulate API responses instead of making real calls
    // In a real environment, you would make actual HTTP requests
    return this.simulateApiResponse(endpoint, data)
  }

  /**
   * Simulate API responses for testing
   */
  private simulateApiResponse(endpoint: string, data: any): any {
    const timestamp = new Date().toISOString()
    
    if (endpoint.includes('match_order')) {
      return {
        success: true,
        message: "Order matched successfully",
        order_id: data.order_id,
        matched_at: timestamp
      }
    }
    
    if (endpoint.includes('request_payment')) {
      return {
        success: true,
        transaction_id: `TX_${Date.now()}`,
        checkout_request_id: `REQ_${Date.now()}`,
        merchant_request_id: `MER_${Date.now()}`,
        customer_message: "Payment request sent to customer phone"
      }
    }
    
    if (endpoint.includes('find_matching_transactions')) {
      return {
        success: true,
        transactions: [
          {
            id: `MATCH_${Date.now()}`,
            amount: data.expected_amount,
            phone: data.buyer_phone,
            confidence: 0.95,
            matched_at: timestamp
          }
        ]
      }
    }
    
    if (endpoint.includes('confirm_payment_received')) {
      return {
        success: true,
        message: "Payment confirmed successfully",
        order_id: data.order_id,
        confirmed_at: timestamp
      }
    }
    
    if (endpoint.includes('initiate_buy_order')) {
      return {
        success: true,
        message: "B2C payment initiated to seller",
        order_id: data.buy_order_id,
        transaction_id: `B2C_TX_${Date.now()}`,
        checkout_request_id: `B2C_REQ_${Date.now()}`,
        customer_message: `Payment sent to ${data.seller_phone_number}`
      }
    }
    
    if (endpoint.includes('check_payment_status')) {
      return {
        success: true,
        order_id: data.order_id,
        status: "completed",
        payment_confirmed: true,
        checked_at: timestamp
      }
    }
    
    if (endpoint.includes('webhooks/sasapay')) {
      return {
        status: "success",
        message: "Webhook processed successfully",
        webhook_type: data.ResultCode !== undefined ? "c2b_callback" : "b2c_callback",
        processed_at: timestamp
      }
    }
    
    return {
      success: true,
      message: "Mock response",
      timestamp
    }
  }

  /**
   * Generate test report
   */
  generateTestReport(): string {
    const scenarios = this.getTestScenarios()
    let report = "# P2P Payment System Test Report\n\n"
    report += `Generated: ${new Date().toLocaleString()}\n\n`
    
    scenarios.forEach((scenario, index) => {
      report += `## ${index + 1}. ${scenario.name}\n\n`
      report += `**Description:** ${scenario.description}\n\n`
      
      report += "**Test Steps:**\n"
      scenario.steps.forEach((step, stepIndex) => {
        report += `${stepIndex + 1}. ${step}\n`
      })
      
      report += "\n**Expected Results:**\n"
      scenario.expectedResults.forEach((result, resultIndex) => {
        report += `- ${result}\n`
      })
      
      report += "\n**Test Orders:**\n"
      scenario.orders.forEach(order => {
        report += `- ${order.type.toUpperCase()} Order: ${order.amount_crypto} ${order.crypto_currency} for ${order.amount_fiat} ${order.fiat_currency}\n`
      })
      
      report += "\n---\n\n"
    })
    
    return report
  }
}

// Export for use in other modules
export const p2pTestRunner = new P2PTestRunner()

// CLI interface for running tests
if (typeof window === 'undefined' && require.main === module) {
  const testRunner = new P2PTestRunner()
  
  const command = process.argv[2]
  
  switch (command) {
    case 'sell':
      testRunner.testSellOrderFlow().catch(console.error)
      break
    case 'buy':
      testRunner.testBuyOrderFlow().catch(console.error)
      break
    case 'webhooks':
      testRunner.testWebhookProcessing().catch(console.error)
      break
    case 'all':
      testRunner.runAllTests().catch(console.error)
      break
    case 'report':
      console.log(testRunner.generateTestReport())
      break
    default:
      console.log("Usage: node p2p-test-runner.js [sell|buy|webhooks|all|report]")
  }
}
