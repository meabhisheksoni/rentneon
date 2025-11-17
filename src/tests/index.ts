/**
 * Master Test Runner
 * Executes all test suites for database performance optimization
 */

import { testRPCFunctions } from './rpc-functions.test'
import { testCacheBehavior } from './cache-behavior.test'
import { testErrorHandling } from './error-handling.test'
import { benchmarkPerformance } from './performance-benchmark.test'
import { testScalability } from './scalability.test'

interface TestSuiteResult {
  suiteName: string
  passed: number
  failed: number
  total: number
  duration: number
}

/**
 * Run all test suites
 */
export async function runAllTests(): Promise<void> {
  console.log('\n' + '='.repeat(70))
  console.log('DATABASE PERFORMANCE OPTIMIZATION - COMPLETE TEST SUITE')
  console.log('='.repeat(70) + '\n')

  const suiteResults: TestSuiteResult[] = []
  const overallStartTime = performance.now()

  try {
    // Test Suite 1: RPC Functions
    console.log('📦 Test Suite 1: RPC Functions')
    console.log('-'.repeat(70))
    const startTime1 = performance.now()
    const rpcResults = await testRPCFunctions()
    const duration1 = performance.now() - startTime1
    suiteResults.push({
      suiteName: 'RPC Functions',
      passed: rpcResults.filter(r => r.passed).length,
      failed: rpcResults.filter(r => !r.passed).length,
      total: rpcResults.length,
      duration: duration1
    })

    // Test Suite 2: Cache Behavior
    console.log('\n📦 Test Suite 2: Cache Behavior')
    console.log('-'.repeat(70))
    const startTime2 = performance.now()
    const cacheResults = await testCacheBehavior()
    const duration2 = performance.now() - startTime2
    suiteResults.push({
      suiteName: 'Cache Behavior',
      passed: cacheResults.filter(r => r.passed).length,
      failed: cacheResults.filter(r => !r.passed).length,
      total: cacheResults.length,
      duration: duration2
    })

    // Test Suite 3: Error Handling
    console.log('\n📦 Test Suite 3: Error Handling')
    console.log('-'.repeat(70))
    const startTime3 = performance.now()
    const errorResults = await testErrorHandling()
    const duration3 = performance.now() - startTime3
    suiteResults.push({
      suiteName: 'Error Handling',
      passed: errorResults.filter(r => r.passed).length,
      failed: errorResults.filter(r => !r.passed).length,
      total: errorResults.length,
      duration: duration3
    })

    // Test Suite 4: Performance Benchmarks
    console.log('\n📦 Test Suite 4: Performance Benchmarks')
    console.log('-'.repeat(70))
    const startTime4 = performance.now()
    const { results: perfResults, benchmarks } = await benchmarkPerformance()
    const duration4 = performance.now() - startTime4
    suiteResults.push({
      suiteName: 'Performance Benchmarks',
      passed: perfResults.filter(r => r.passed).length,
      failed: perfResults.filter(r => !r.passed).length,
      total: perfResults.length,
      duration: duration4
    })

    // Test Suite 5: Scalability
    console.log('\n📦 Test Suite 5: Scalability')
    console.log('-'.repeat(70))
    const startTime5 = performance.now()
    const { results: scaleResults, scalabilityData } = await testScalability()
    const duration5 = performance.now() - startTime5
    suiteResults.push({
      suiteName: 'Scalability',
      passed: scaleResults.filter(r => r.passed).length,
      failed: scaleResults.filter(r => !r.passed).length,
      total: scaleResults.length,
      duration: duration5
    })

  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
  }

  const overallDuration = performance.now() - overallStartTime

  // Print final summary
  printFinalSummary(suiteResults, overallDuration)
}

/**
 * Print final summary of all test suites
 */
function printFinalSummary(suiteResults: TestSuiteResult[], totalDuration: number): void {
  console.log('\n' + '='.repeat(70))
  console.log('FINAL TEST SUMMARY')
  console.log('='.repeat(70))

  console.log('\n📊 Test Suite Results:')
  console.log('-'.repeat(70))
  console.log('Suite'.padEnd(30) + 'Passed'.padEnd(10) + 'Failed'.padEnd(10) + 'Total'.padEnd(10) + 'Time')
  console.log('-'.repeat(70))

  let totalPassed = 0
  let totalFailed = 0
  let totalTests = 0

  suiteResults.forEach(suite => {
    const icon = suite.failed === 0 ? '✅' : '❌'
    const name = `${icon} ${suite.suiteName}`.padEnd(30)
    const passed = `${suite.passed}`.padEnd(10)
    const failed = `${suite.failed}`.padEnd(10)
    const total = `${suite.total}`.padEnd(10)
    const time = `${Math.round(suite.duration)}ms`

    console.log(`${name}${passed}${failed}${total}${time}`)

    totalPassed += suite.passed
    totalFailed += suite.failed
    totalTests += suite.total
  })

  console.log('-'.repeat(70))
  console.log('TOTAL'.padEnd(30) + `${totalPassed}`.padEnd(10) + `${totalFailed}`.padEnd(10) + `${totalTests}`.padEnd(10) + `${Math.round(totalDuration)}ms`)
  console.log('-'.repeat(70))

  // Overall status
  const overallPassed = totalFailed === 0
  const statusIcon = overallPassed ? '✅' : '❌'
  const statusText = overallPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'

  console.log(`\n${statusIcon} ${statusText}`)
  console.log(`   Total Duration: ${Math.round(totalDuration / 1000)}s`)
  console.log(`   Pass Rate: ${Math.round((totalPassed / totalTests) * 100)}%`)

  console.log('\n' + '='.repeat(70) + '\n')
}

/**
 * Run individual test suite by name
 */
export async function runTestSuite(suiteName: string): Promise<void> {
  console.log(`\n🧪 Running Test Suite: ${suiteName}\n`)

  switch (suiteName.toLowerCase()) {
    case 'rpc':
    case 'rpc-functions':
      await testRPCFunctions()
      break

    case 'cache':
    case 'cache-behavior':
      await testCacheBehavior()
      break

    case 'error':
    case 'error-handling':
      await testErrorHandling()
      break

    case 'performance':
    case 'benchmark':
      await benchmarkPerformance()
      break

    case 'scalability':
    case 'scale':
      await testScalability()
      break

    default:
      console.error(`❌ Unknown test suite: ${suiteName}`)
      console.log('Available suites: rpc, cache, error, performance, scalability')
  }
}

// Export individual test runners
export {
  testRPCFunctions,
  testCacheBehavior,
  testErrorHandling,
  benchmarkPerformance,
  testScalability
}
