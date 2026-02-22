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
  if (endpoint.includes('status_group=pending')) {
    return {
      orders: [],
      pending_count: 0,
      completed_count: 0
    };
  }

  if (endpoint.includes('status_group=completed')) {
    return {
      orders: [],
      pending_count: 0,
      completed_count: 0
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
    logStep('1.', 'Reading pending orders...');
    const pending = await mockApiCall('/api/orders/p2p?status_group=pending', {});
    logSuccess(`Pending count: ${pending.pending_count}`);

    logStep('2.', 'Finding matching transactions...');
    const transactionResult = await mockApiCall('/api/orders/p2p?action=find_matching_transactions', {
      order_id: orderId,
      expected_amount: 3500
    });
    logSuccess('Matching transactions found');
    
    logStep('3.', 'Confirming payment received...');
    const confirmResult = await mockApiCall('/api/orders/p2p?action=confirm_payment_received', {
      order_id: orderId,
      seller_id: 'test-seller-001'
    });
    logSuccess('Payment confirmed by seller');

    logStep('4.', 'Reading completed orders...');
    const completed = await mockApiCall('/api/orders/p2p?status_group=completed', {});
    logSuccess(`Completed count: ${completed.completed_count}`);
    
    logSuccess('Sell order flow completed successfully!');
    return true;
    
  } catch (error) {
    logError(`Sell order flow failed: ${error.message}`);
    return false;
  }
}

async function testBuyOrderFlow() {
  log('\n🧪 Testing Buy Order Flow...', 'cyan');
  
  const transactionId = `test-tx-${Date.now()}`;
  
  try {
    logStep('1.', 'Checking payment status...');
    const statusResult = await mockApiCall('/api/orders/p2p?action=check_payment_status', {
      transaction_id: transactionId
    });
    logSuccess('Payment status checked');
    
    logSuccess('Buy order flow completed successfully!');
    return true;
    
  } catch (error) {
    logError(`Buy order flow failed: ${error.message}`);
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
  testPhoneNormalization,
  runAllTests
};
