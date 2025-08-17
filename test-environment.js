// Environment Management Test Script
import { environmentManager, getEnvironmentMode, isMockMode } from './lib/config/environment.js';
import { serviceFactory } from './lib/services/service-factory.js';

async function testEnvironmentManagement() {
  console.log('🧪 Testing Environment Management System\n');

  // Test 1: Environment Detection
  console.log('1. Environment Detection:');
  const mode = getEnvironmentMode();
  const isUsingMock = isMockMode();
  console.log(`   Current Mode: ${mode}`);
  console.log(`   Using Mock Data: ${isUsingMock}`);
  console.log(`   Environment Variables:`, {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
  });

  // Test 2: Configuration Retrieval
  console.log('\n2. Configuration:');
  const config = environmentManager.getConfig();
  console.log(`   Database URL: ${config.database.url}`);
  console.log(`   Auth Required: ${config.auth.required}`);
  console.log(`   Debug Mode: ${config.ui.showDebugInfo}`);

  // Test 3: Service Factory
  console.log('\n3. Service Factory:');
  console.log(`   Factory Mode: ${serviceFactory.getEnvironmentMode()}`);
  console.log(`   Using Mock: ${serviceFactory.isUsingMockData()}`);

  // Test 4: Service Health Check
  console.log('\n4. Service Health Check:');
  try {
    const health = await serviceFactory.healthCheck();
    console.log(`   Mode: ${health.mode}`);
    console.log(`   Services:`, health.services);
    console.log(`   Timestamp: ${health.timestamp}`);
  } catch (error) {
    console.log(`   Health Check Failed: ${error.message}`);
  }

  // Test 5: Debug Information
  console.log('\n5. Debug Information:');
  const debugInfo = environmentManager.getDebugInfo();
  console.log('   Debug Info:', JSON.stringify(debugInfo, null, 2));

  console.log('\n✅ Environment Management Test Complete');
}

// Run the test
testEnvironmentManagement().catch(console.error);
