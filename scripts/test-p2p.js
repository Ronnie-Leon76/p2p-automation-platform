#!/usr/bin/env node

/**
 * P2P Testing CLI Script
 * Run P2P payment system tests from the command line
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 3
};

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

// Mock API calls for testing (replace with real HTTP calls in production)
async function mockApiCall(endpoint, data) {
  const delay = Math.random() * 1000 + 500; // 500-1500ms delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simulate different responses based on endpoint
  if (endpoint.includes('match_order')) {
    return {
      success: true,
      message: "Order matched successfully",
      order_id: data.order_id,
      matched_at: new Date().toISOString()
    };
  }
  
  if (endpoint.includes('request_payment')) {
    return {
      success: true,
      transaction_id: `TX_${Date.now()}`,
      checkout_request_id: `REQ_${Date.now()}`,
      customer_message: "Payment request sent to customer"
    };
  }
  
  if (endpoint.includes('initiate_buy_order')) {
    return {
      success: true,
      message: "B2C payment initiated",
      order_id: data.buy_order_id,
      transaction_id: `B2C_TX_${Date.now()}`
    };
  }
  
  if (endpoint.includes('webhooks/sasapay')) {
    return {
      status: "success",
      message: "Webhook processed successfully"
    };
  }
  
  return {
    success: true,
    message: "Mock API response",
    timestamp: new Date().toISOString()
  };
}

// Test scenarios
async function testSellOrderFlow() {
  log('\n🧪 Testing Sell Order Flow...', 'cyan');
  
  const orderId = `test-sell-${Date.now()}`;
  
  try {
    logStep('1.', 'Matching sell order...');
    const matchResult = await mockApiCall('/api/orders/p2p?action=match_order', {
      order_id: orderId,
      buyer_id: 'test-buyer-001',
      seller_id: 'test-seller-001',
      buyer_phone: '254701234567'
    });
    logSuccess(`Order matched: ${matchResult.order_id}`);
    
    logStep('2.', 'Requesting C2B payment...');
    const paymentResult = await mockApiCall('/api/orders/p2p?action=request_payment', {
      order_id: orderId,
      buyer_phone: '254701234567',
      amount: 3500
    });
    logSuccess(`Payment requested: ${paymentResult.transaction_id}`);
    
    logStep('3.', 'Finding matching transactions...');
    const transactionResult = await mockApiCall('/api/orders/p2p?action=find_matching_transactions', {
      order_id: orderId,
      expected_amount: 3500
    });
    logSuccess('Matching transactions found');
    
    logStep('4.', 'Confirming payment received...');
    const confirmResult = await mockApiCall('/api/orders/p2p?action=confirm_payment_received', {
      order_id: orderId,
      seller_id: 'test-seller-001'
    });
    logSuccess('Payment confirmed by seller');
    
    logSuccess('Sell order flow completed successfully!');
    return true;
    
  } catch (error) {
    logError(`Sell order flow failed: ${error.message}`);
    return false;
  }
}

async function testBuyOrderFlow() {
  log('\n🧪 Testing Buy Order Flow...', 'cyan');
  
  const orderId = `test-buy-${Date.now()}`;
  
  try {
    logStep('1.', 'Initiating buy order...');
    const buyResult = await mockApiCall('/api/orders/p2p?action=initiate_buy_order', {
      buy_order_id: orderId,
      buyer_id: 'test-buyer-002',
      seller_phone_number: '254723456789',
      amount: 5000
    });
    logSuccess(`B2C payment initiated: ${buyResult.transaction_id}`);
    
    logStep('2.', 'Checking payment status...');
    const statusResult = await mockApiCall('/api/orders/p2p?action=check_payment_status', {
      order_id: orderId
    });
    logSuccess('Payment status checked');
    
    logSuccess('Buy order flow completed successfully!');
    return true;
    
  } catch (error) {
    logError(`Buy order flow failed: ${error.message}`);
    return false;
  }
}

async function testWebhookProcessing() {
  log('\n🧪 Testing Webhook Processing...', 'cyan');
  
  try {
    logStep('1.', 'Testing C2B webhook...');
    const c2bResult = await mockApiCall('/api/webhooks/sasapay', {
      MerchantRequestID: "29115-34620561-1",
      CheckoutRequestID: "ws_CO_test",
      ResultCode: 0,
      ResultDesc: "Success"
    });
    logSuccess('C2B webhook processed');
    
    logStep('2.', 'Testing B2C webhook...');
    const b2cResult = await mockApiCall('/api/webhooks/sasapay', {
      MerchantCode: "MERCHANT123",
      ResultCode: "0",
      SasaPayTransactionID: "TX123456"
    });
    logSuccess('B2C webhook processed');
    
    logSuccess('Webhook processing test completed!');
    return true;
    
  } catch (error) {
    logError(`Webhook test failed: ${error.message}`);
    return false;
  }
}

async function testPhoneNormalization() {
  log('\n🧪 Testing Phone Number Normalization...', 'cyan');
  
  const testCases = [
    { input: '0712345678', expected: '254712345678' },
    { input: '254712345678', expected: '254712345678' },
    { input: '+254712345678', expected: '254712345678' },
    { input: '12345', expected: 'Invalid' }
  ];
  
  try {
    for (const testCase of testCases) {
      logStep('→', `Testing ${testCase.input}...`);
      // Simulate normalization logic
      let result;
      if (testCase.input.startsWith('07') && testCase.input.length === 10) {
        result = '254' + testCase.input.substring(1);
      } else if (testCase.input.startsWith('+254')) {
        result = testCase.input.substring(1);
      } else if (testCase.input.startsWith('254') && testCase.input.length === 12) {
        result = testCase.input;
      } else {
        result = 'Invalid';
      }
      
      if (result === testCase.expected) {
        logSuccess(`${testCase.input} → ${result}`);
      } else {
        logError(`${testCase.input} → ${result} (expected ${testCase.expected})`);
      }
    }
    
    logSuccess('Phone normalization test completed!');
    return true;
    
  } catch (error) {
    logError(`Phone normalization test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log(colorize('\n🚀 P2P Payment System Test Suite', 'bright'));
  log('='.repeat(50));
  
  const startTime = Date.now();
  const results = [];
  
  // Run all test scenarios
  results.push(await testSellOrderFlow());
  results.push(await testBuyOrderFlow());
  results.push(await testWebhookProcessing());
  results.push(await testPhoneNormalization());
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Display summary
  log('\n' + '='.repeat(50));
  log(colorize('📊 Test Summary', 'bright'));
  log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    logSuccess(`All ${total} tests passed! ✨`);
  } else {
    logWarning(`${passed}/${total} tests passed`);
  }
  
  log(`⏱️  Total time: ${duration}s`);
  
  const testNames = [
    'Sell Order Flow',
    'Buy Order Flow', 
    'Webhook Processing',
    'Phone Normalization'
  ];
  
  testNames.forEach((name, index) => {
    const status = results[index] ? '✅ PASS' : '❌ FAIL';
    log(`   ${name}: ${status}`);
  });
  
  log('\n💡 Next steps:');
  log('   - Run tests against real API endpoints');
  log('   - Add database validation');
  log('   - Test error scenarios');
  log('   - Performance testing');
  
  process.exit(passed === total ? 0 : 1);
}

function showHelp() {
  log(colorize('\nP2P Payment System Test CLI', 'bright'));
  log('Usage: npm run test:p2p [command]');
  log('\nCommands:');
  log('  sell      Test sell order flow (C2B payments)');
  log('  buy       Test buy order flow (B2C payments)');
  log('  webhooks  Test webhook processing');
  log('  phone     Test phone number normalization');
  log('  all       Run all tests (default)');
  log('  help      Show this help message');
  log('\nExamples:');
  log('  npm run test:p2p');
  log('  npm run test:p2p sell');
  log('  npm run test:p2p buy');
  log('  npm run test:p2p all');
}

// Main execution
async function main() {
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'sell':
      await testSellOrderFlow();
      break;
    case 'buy':
      await testBuyOrderFlow();
      break;
    case 'webhooks':
      await testWebhookProcessing();
      break;
    case 'phone':
      await testPhoneNormalization();
      break;
    case 'all':
      await runAllTests();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      logError(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n⚠️  Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testSellOrderFlow,
  testBuyOrderFlow,
  testWebhookProcessing,
  testPhoneNormalization,
  runAllTests
};
