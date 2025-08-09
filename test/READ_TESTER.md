# P2P Automation Platform - Test Suite

This directory contains comprehensive tests for the P2P automation platform, organized into modular, focused test files.

## Test Structure

### 🔧 Core Test Files

- **`okx-api.test.ts`** - Tests individual OKX API endpoints
- **`algorithm.test.ts`** - Tests core algorithm logic and calculations
- **`market-analyzer.test.ts`** - Tests market analysis and visualization
- **`integration.test.ts`** - Tests complete end-to-end flow
- **`index.ts`** - Master test runner that orchestrates all tests

### 📁 Legacy Files (for reference)

- `okx-test-runner.ts` - Original OKX API test runner
- `okx-algo-test-runner.ts` - Original algorithm test runner
- `test-utilities.ts` - Shared test utilities

## Running Tests

### Run All Tests

```bash
# Full test suite
npx tsx test/index.ts

# Quick mode (essential tests only)
npx tsx test/index.ts --quick
```

### Run Specific Test Suites

```bash
# API tests only
npx tsx test/index.ts --suite api

# Algorithm tests only
npx tsx test/index.ts --suite algorithm

# Market analyzer tests only
npx tsx test/index.ts --suite analyzer

# Integration tests only
npx tsx test/index.ts --suite integration
```

### Run Individual Test Files

```bash
# Test OKX API connectivity
npx tsx test/okx-api.test.ts

# Test algorithm logic
npx tsx test/algorithm.test.ts

# Test market analysis
npx tsx test/market-analyzer.test.ts

# Test full integration
npx tsx test/integration.test.ts
```

## Test Categories

### 🌐 API Tests (`okx-api.test.ts`)

- **User Info** - Tests user profile retrieval
- **Balance Check** - Tests USDT balance fetching
- **Active Ads** - Tests buy/sell ad retrieval
- **Marketplace Data** - Tests market snapshot capture
- **Payment Methods** - Tests payment method listing

### 🧮 Algorithm Tests (`algorithm.test.ts`)

- **Volume Weighted Pricing** - Tests price calculation logic
- **Ad Limit Calculations** - Tests order size limit handling
- **Strategy Generation** - Tests buy/sell strategy creation
- **Market Trend Analysis** - Tests trend detection
- **Price Calculations** - Tests various price metrics

### 📊 Market Analyzer Tests (`market-analyzer.test.ts`)

- **Market Data Formatting** - Tests data presentation
- **Strategy Formatting** - Tests strategy display
- **Trend Analysis Display** - Tests trend visualization
- **Price Analysis** - Tests price distribution analysis
- **Volume Analysis** - Tests volume metrics
- **Print Functions** - Tests report generation

### 🔄 Integration Tests (`integration.test.ts`)

- **User Profile Init** - Tests complete profile setup
- **Market Snapshot** - Tests real market data capture
- **Strategy Generation** - Tests end-to-end strategy creation
- **Trend Analysis** - Tests multi-snapshot trend detection
- **Full Analysis** - Tests complete workflow

## Test Features

### ✅ Robust Error Handling

- API timeout handling with fallbacks
- Graceful degradation when services are unavailable
- Clear error reporting and debugging info

### 📊 Comprehensive Reporting

- Individual test success/failure tracking
- Performance timing for each test
- Detailed summary reports
- Success rate calculations

### 🔧 Flexible Configuration

- Environment variable support
- Configurable API delays
- Mock data for offline testing
- Selective test execution

### 🛡️ Safety Features

- No destructive operations in core tests
- Fallback modes for API failures
- Demo data when live data unavailable

## Environment Setup

Ensure these environment variables are set in `.env.local`:

```env
OKX_API_KEY=your_api_key
OKX_API_SECRET=your_api_secret
OKX_API_PASSPHRASE=your_passphrase
OKX_API_DELAY=3000  # Optional: API call delay in ms
```

## Test Output Examples

### Successful Test Run

```
✅ OKX API Tests (2.3s)
✅ Algorithm Logic Tests (0.1s)
✅ Market Analyzer Tests (0.2s)
✅ Integration Tests (5.4s)

🎯 Success Rate: 100%
🎉 ALL TESTS PASSED - P2P system is fully operational!
```

### API Timeout Scenario

```
⚠️ API timeout, using fallback profile...
✅ Algorithm Logic Tests (0.1s)
✅ Market Analyzer Tests (0.2s)
⚠️ Partial integration success (fallback mode)

🎯 Success Rate: 75%
🔄 System ready for testing with fallback modes
```

## Troubleshooting

### Common Issues

1. **API Timeouts**

   - Increase `OKX_API_DELAY` in environment
   - Tests will automatically fall back to demo data

2. **Missing Credentials**

   - Check `.env.local` file exists
   - Verify all three OKX credentials are set

3. **Network Issues**
   - Tests include retry logic
   - Offline tests will use mock data

### Debug Mode

Add debug logging by setting:

```env
DEBUG=true
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include comprehensive error handling
3. Add both success and failure scenarios
4. Update this README with new test descriptions
5. Ensure tests can run offline with mock data

## Performance Expectations

- **API Tests**: 2-10 seconds (depends on network)
- **Algorithm Tests**: <1 second (pure logic)
- **Market Analyzer Tests**: <1 second (formatting/display)
- **Integration Tests**: 5-15 seconds (full workflow)

Total test suite: 8-27 seconds depending on API responsiveness.
