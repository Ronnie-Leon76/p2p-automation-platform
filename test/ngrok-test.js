#!/usr/bin/env node

/**
 * Ngrok Testing Script
 * Tests both localhost and ngrok URLs to verify connectivity
 */

// Dynamic import for ES modules
let fetch;

async function initializeFetch() {
  if (!fetch) {
    const fetchModule = await import('node-fetch');
    fetch = fetchModule.default;
  }
}

async function testEndpoint(url, name, timeout = 10000) {
  await initializeFetch();
  
  console.log(`\n🧪 Testing ${name}: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add ngrok skip header if using ngrok URL
    if (url.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    const response = await fetch(url + '/api/test/sasapay-auth', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Token: ${result.access_token.substring(0, 20)}...`);
      console.log(`   Environment: ${result.environment}`);
      return true;
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || result.message || 'Unknown error'}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${name} - ERROR`);
    if (error.name === 'AbortError') {
      console.log(`   Timeout after ${timeout}ms`);
    } else {
      console.log(`   ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 P2P Platform Connectivity Test');
  console.log('=' .repeat(50));
  
  const localhostUrl = 'http://localhost:3000';
  const ngrokUrl = 'https://working-ghoul-holy.ngrok-free.app';
  
  // Test localhost first
  const localhostResult = await testEndpoint(localhostUrl, 'Localhost', 5000);
  
  // Test ngrok
  const ngrokResult = await testEndpoint(ngrokUrl, 'Ngrok Tunnel', 15000);
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Summary');
  console.log('=' .repeat(50));
  console.log(`Localhost (${localhostUrl}): ${localhostResult ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Ngrok (${ngrokUrl}): ${ngrokResult ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (localhostResult && !ngrokResult) {
    console.log('\n💡 Suggestions:');
    console.log('   - Check if ngrok is running: ngrok http 3000');
    console.log('   - Verify ngrok tunnel URL is correct');
    console.log('   - Check ngrok dashboard: http://localhost:4040');
    console.log('   - Try restarting ngrok tunnel');
  }
  
  if (localhostResult) {
    console.log('\n🎉 Localhost is working! You can run tests with:');
    console.log('   node test/live-p2p-test-runner.js auth');
    console.log('   node test/live-p2p-test-runner.js phone');
    console.log('   node test/live-p2p-test-runner.js all');
  }
  
  if (ngrokResult) {
    console.log('\n🌐 Ngrok is working! You can run tests with:');
    console.log(`   node -e "const r = require('./test/live-p2p-test-runner.js'); new r.LiveP2PTestRunner('${ngrokUrl}').testSasaPayAuthentication().catch(console.error);"`);
  }
  
  process.exit(localhostResult || ngrokResult ? 0 : 1);
}

// Run the test
main().catch(console.error);
