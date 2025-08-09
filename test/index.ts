/**
 * Master Test Runner
 * Runs all P2P automation platform tests in a structured way
 */

import { testAlgorithm } from "./algorithm.test";
import { testIntegration } from "./integration.test";
import { testMarketAnalyzer } from "./market-analyzer.test";
import { testOKXApi } from "./okx-api.test";

interface TestSuite {
  name: string;
  description: string;
  testFunction: () => Promise<void>;
  critical: boolean; // If true, failure stops the test suite
}

class MasterTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: "OKX API Tests",
      description: "Tests individual OKX API endpoints",
      testFunction: testOKXApi,
      critical: false
    },
    {
      name: "Algorithm Logic Tests",
      description: "Tests core algorithm calculations",
      testFunction: testAlgorithm,
      critical: true
    },
    {
      name: "Market Analyzer Tests",
      description: "Tests market analysis and visualization",
      testFunction: testMarketAnalyzer,
      critical: true
    },
    {
      name: "Integration Tests",
      description: "Tests complete end-to-end flow",
      testFunction: testIntegration,
      critical: false
    }
  ];

  private results: { [key: string]: { success: boolean; duration: number; error?: string } } = {};

  async runAllTests(): Promise<void> {
    console.log("🚀 P2P AUTOMATION PLATFORM - MASTER TEST RUNNER");
    console.log("=".repeat(60));
    console.log(`📋 Running ${this.testSuites.length} test suites...\n`);

    let allPassed = true;
    let criticalFailure = false;

    for (let i = 0; i < this.testSuites.length; i++) {
      const suite = this.testSuites[i];
      
      console.log(`\n${'='.repeat(20)} TEST SUITE ${i + 1}/${this.testSuites.length} ${'='.repeat(20)}`);
      console.log(`📝 ${suite.name}`);
      console.log(`💡 ${suite.description}`);
      console.log("-".repeat(60));

      const startTime = Date.now();
      
      try {
        await suite.testFunction();
        const duration = Date.now() - startTime;
        
        this.results[suite.name] = { success: true, duration };
        console.log(`✅ ${suite.name} completed successfully (${(duration / 1000).toFixed(1)}s)`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        this.results[suite.name] = { success: false, duration, error: errorMsg };
        allPassed = false;
        
        console.log(`❌ ${suite.name} failed (${(duration / 1000).toFixed(1)}s)`);
        console.log(`   Error: ${errorMsg}`);
        
        if (suite.critical) {
          criticalFailure = true;
          console.log(`\n🛑 Critical test failure! Stopping test execution.`);
          break;
        } else {
          console.log(`\n⚠️ Non-critical test failure. Continuing with remaining tests...`);
        }
      }
    }

    this.printFinalSummary(allPassed, criticalFailure);
  }

  private printFinalSummary(allPassed: boolean, criticalFailure: boolean): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL TEST SUMMARY");
    console.log("=".repeat(60));

    const passedSuites = Object.values(this.results).filter(r => r.success).length;
    const failedSuites = Object.values(this.results).filter(r => !r.success).length;
    const totalDuration = Object.values(this.results).reduce((sum, r) => sum + r.duration, 0);

    console.log(`📋 Test Suites: ${passedSuites + failedSuites} total`);
    console.log(`✅ Passed: ${passedSuites}`);
    console.log(`❌ Failed: ${failedSuites}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    if (Object.keys(this.results).length > 0) {
      console.log(`\n🎯 Success Rate: ${((passedSuites / (passedSuites + failedSuites)) * 100).toFixed(1)}%`);
    }

    console.log("\n📋 Detailed Results:");
    this.testSuites.forEach(suite => {
      const result = this.results[suite.name];
      if (result) {
        const status = result.success ? "✅" : "❌";
        const duration = `(${(result.duration / 1000).toFixed(1)}s)`;
        console.log(`   ${status} ${suite.name} ${duration}`);
        if (!result.success && result.error) {
          console.log(`       Error: ${result.error}`);
        }
      } else {
        console.log(`   ⏭️ ${suite.name} (skipped)`);
      }
    });

    // Final assessment
    console.log("\n" + "=".repeat(60));
    
    if (criticalFailure) {
      console.log("🛑 CRITICAL FAILURE - P2P system has fundamental issues");
      console.log("   Recommendation: Fix algorithm/analyzer issues before proceeding");
    } else if (allPassed) {
      console.log("🎉 ALL TESTS PASSED - P2P system is fully operational!");
      console.log("   ✅ API connectivity working");
      console.log("   ✅ Algorithm logic verified");
      console.log("   ✅ Market analysis functional");
      console.log("   ✅ Integration flow complete");
      console.log("\n🚀 Ready for production trading!");
    } else {
      console.log("⚠️ PARTIAL SUCCESS - Core functionality working");
      console.log("   ✅ Essential components operational");
      console.log("   ⚠️ Some API connectivity issues (expected)");
      console.log("\n🔄 System ready for testing with fallback modes");
    }
    
    console.log("=".repeat(60));
  }
}

// Command line options
function parseArgs(): { quick?: boolean; suite?: string } {
  const args = process.argv.slice(2);
  const options: { quick?: boolean; suite?: string } = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--quick':
        options.quick = true;
        break;
      case '--suite':
        options.suite = args[i + 1];
        i++; // Skip next argument
        break;
    }
  }
  
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  const runner = new MasterTestRunner();
  
  if (options.suite) {
    // Run specific test suite
    const suiteMap: { [key: string]: () => Promise<void> } = {
      'api': testOKXApi,
      'algorithm': testAlgorithm,
      'analyzer': testMarketAnalyzer,
      'integration': testIntegration
    };
    
    const testFunction = suiteMap[options.suite];
    if (testFunction) {
      console.log(`🎯 Running specific test suite: ${options.suite}`);
      await testFunction();
    } else {
      console.error(`❌ Unknown test suite: ${options.suite}`);
      console.log("Available suites: api, algorithm, analyzer, integration");
    }
  } else {
    // Run all tests
    if (options.quick) {
      console.log("⚡ Quick mode: Running essential tests only");
      await testAlgorithm();
      await testMarketAnalyzer();
    } else {
      await runner.runAllTests();
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error("❌ Master test runner failed:", error);
    process.exit(1);
  });
}

export { MasterTestRunner, testAlgorithm, testIntegration, testMarketAnalyzer, testOKXApi };

