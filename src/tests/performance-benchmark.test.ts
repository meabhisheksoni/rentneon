/**
 * Performance Benchmarking Test Suite
 * Measures and validates performance targets for key operations
 */

import { SupabaseService } from '@/services/supabaseService'
import { BillCache } from '@/utils/billCache'
import { performanceMonitor } from '@/utils/performanceMonitor'
import type { MonthlyBill } from '@/services/supabaseService'

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
  target?: number
}

interface BenchmarkResult {
  operation: string
  averageTime: number
  minTime: number
  maxTime: number
  target: number
  passed: boolean
}

class PerformanceBenchmarkTests {
  private results: TestResult[] = []
  private benchmarks: BenchmarkResult[] = []
  private cache: BillCache
  private testRenterId: number | undefined = undefined

  constructor() {
    this.cache = new BillCache()
  }

  /**
   * Run all performance benchmark tests
   */
  async runAll(): Promise<{ results: TestResult[], benchmarks: BenchmarkResult[] }> {
    console.log('🧪 Starting Performance Benchmark Tests...\n')
    this.results = []
    this.benchmarks = []

    try {
      // Setup
      await this.setupTestData()

      // Test 1: Month navigation time (cached)
      await this.benchmarkMonthNavigationCached()

      // Test 2: Month navigation time (uncached)
      await this.benchmarkMonthNavigationUncached()

      // Test 3: Bill save time
      await this.benchmarkBillSave()

      // Test 4: Dashboard load time
      await this.benchmarkDashboardLoad()

      // Test 5: Compare before/after metrics
      await this.compareMetrics()

    } catch (error) {
      console.error('❌ Test suite failed:', error)
      this.results.push({
        name: 'Test Suite',
        passed: false,
        message: `Suite failed: ${error instanceof Error ? error.message : String(error)}`
      })
    }

    this.printResults()
    return { results: this.results, benchmarks: this.benchmarks }
  }

  /**
   * Setup test data
   */
  private async setupTestData(): Promise<void> {
    const renters = await SupabaseService.getActiveRenters()
    if (renters.length === 0) {
      throw new Error('No active renters found. Please add a renter first.')
    }
    this.testRenterId = renters[0].id
    console.log(`✅ Using test renter ID: ${this.testRenterId}\n`)

    // Clear performance monitor for fresh metrics
    performanceMonitor.clear()
  }

  /**
   * Test 1: Month navigation time (cached) - Target: <50ms
   */
  private async benchmarkMonthNavigationCached(): Promise<void> {
    const testName = 'Test 1: Month Navigation (Cached)'
    const target = 50 // ms
    console.log(`Running ${testName}... (Target: <${target}ms)`)

    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      // First, populate the cache
      await SupabaseService.getBillWithDetails(this.testRenterId!, month, year)

      // Now benchmark cached access
      const iterations = 10
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        this.cache.get(this.testRenterId!, month, year)
        const duration = performance.now() - startTime
        times.push(duration)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)

      const passed = avgTime < target

      this.benchmarks.push({
        operation: 'Month Navigation (Cached)',
        averageTime: Math.round(avgTime * 100) / 100,
        minTime: Math.round(minTime * 100) / 100,
        maxTime: Math.round(maxTime * 100) / 100,
        target,
        passed
      })

      this.results.push({
        name: testName,
        passed,
        message: `Average: ${Math.round(avgTime)}ms (Target: <${target}ms)`,
        duration: avgTime,
        target
      })

      const icon = passed ? '✅' : '❌'
      console.log(`${icon} ${testName}: ${Math.round(avgTime)}ms (Target: <${target}ms)\n`)

    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        message: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName} failed: ${error}\n`)
    }
  }

  /**
   * Test 2: Month navigation time (uncached) - Target: <200ms
   */
  private async benchmarkMonthNavigationUncached(): Promise<void> {
    const testName = 'Test 2: Month Navigation (Uncached)'
    const target = 200 // ms
    console.log(`Running ${testName}... (Target: <${target}ms)`)

    try {
      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        // Clear cache before each iteration
        this.cache.clear()

        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        const startTime = performance.now()
        await SupabaseService.getBillWithDetails(this.testRenterId!, month, year)
        const duration = performance.now() - startTime
        times.push(duration)

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)

      const passed = avgTime < target

      this.benchmarks.push({
        operation: 'Month Navigation (Uncached)',
        averageTime: Math.round(avgTime),
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        target,
        passed
      })

      this.results.push({
        name: testName,
        passed,
        message: `Average: ${Math.round(avgTime)}ms (Target: <${target}ms)`,
        duration: avgTime,
        target
      })

      const icon = passed ? '✅' : '❌'
      console.log(`${icon} ${testName}: ${Math.round(avgTime)}ms (Target: <${target}ms)\n`)

    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        message: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName} failed: ${error}\n`)
    }
  }

  /**
   * Test 3: Bill save time - Target: <300ms
   */
  private async benchmarkBillSave(): Promise<void> {
    const testName = 'Test 3: Bill Save Time'
    const target = 300 // ms
    console.log(`Running ${testName}... (Target: <${target}ms)`)

    try {
      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        const billData: MonthlyBill = {
          renter_id: this.testRenterId!,
          month,
          year,
          rent_amount: 6000,
          electricity_enabled: true,
          electricity_initial_reading: 100 + i,
          electricity_final_reading: 150 + i,
          electricity_multiplier: 9,
          electricity_reading_date: now.toISOString().split('T')[0],
          electricity_amount: 450,
          motor_enabled: true,
          motor_initial_reading: 50 + i,
          motor_final_reading: 70 + i,
          motor_multiplier: 9,
          motor_number_of_people: 2,
          motor_reading_date: now.toISOString().split('T')[0],
          motor_amount: 180,
          water_enabled: true,
          water_amount: 200,
          maintenance_enabled: true,
          maintenance_amount: 300,
          total_amount: 7130,
          total_payments: 5000,
          pending_amount: 2130
        }

        const expenses = [
          {
            monthly_bill_id: '',
            description: `Benchmark Expense ${i}`,
            amount: 500,
            date: now.toISOString().split('T')[0]
          }
        ]

        const payments = [
          {
            monthly_bill_id: '',
            amount: 5000,
            payment_date: now.toISOString().split('T')[0],
            payment_type: 'cash' as const,
            note: `Benchmark Payment ${i}`
          }
        ]

        const startTime = performance.now()
        await SupabaseService.saveBillComplete(billData, expenses, payments)
        const duration = performance.now() - startTime
        times.push(duration)

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)

      const passed = avgTime < target

      this.benchmarks.push({
        operation: 'Bill Save',
        averageTime: Math.round(avgTime),
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        target,
        passed
      })

      this.results.push({
        name: testName,
        passed,
        message: `Average: ${Math.round(avgTime)}ms (Target: <${target}ms)`,
        duration: avgTime,
        target
      })

      const icon = passed ? '✅' : '❌'
      console.log(`${icon} ${testName}: ${Math.round(avgTime)}ms (Target: <${target}ms)\n`)

    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        message: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName} failed: ${error}\n`)
    }
  }

  /**
   * Test 4: Dashboard load time - Target: <400ms
   */
  private async benchmarkDashboardLoad(): Promise<void> {
    const testName = 'Test 4: Dashboard Load Time'
    const target = 400 // ms
    console.log(`Running ${testName}... (Target: <${target}ms)`)

    try {
      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        await SupabaseService.getDashboardSummary()
        const duration = performance.now() - startTime
        times.push(duration)

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)

      const passed = avgTime < target

      this.benchmarks.push({
        operation: 'Dashboard Load',
        averageTime: Math.round(avgTime),
        minTime: Math.round(minTime),
        maxTime: Math.round(maxTime),
        target,
        passed
      })

      this.results.push({
        name: testName,
        passed,
        message: `Average: ${Math.round(avgTime)}ms (Target: <${target}ms)`,
        duration: avgTime,
        target
      })

      const icon = passed ? '✅' : '❌'
      console.log(`${icon} ${testName}: ${Math.round(avgTime)}ms (Target: <${target}ms)\n`)

    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        message: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName} failed: ${error}\n`)
    }
  }

  /**
   * Test 5: Compare before/after metrics
   */
  private async compareMetrics(): Promise<void> {
    const testName = 'Test 5: Performance Metrics Comparison'
    console.log(`Running ${testName}...`)

    try {
      const summary = performanceMonitor.getSummary()

      console.log('\n📊 Performance Summary:')
      console.log(`   Total Queries: ${summary.totalQueries}`)
      console.log(`   Slow Queries: ${summary.slowQueries}`)
      console.log(`   Average Time: ${summary.averageTime}ms`)
      console.log(`   Cache Hit Rate: ${summary.cacheMetrics.hitRate}%`)
      console.log(`   Cache Hits: ${summary.cacheMetrics.hits}`)
      console.log(`   Cache Misses: ${summary.cacheMetrics.misses}`)

      // Check if performance is acceptable
      const passed = summary.averageTime < 500 && summary.slowQueries < summary.totalQueries * 0.2

      this.results.push({
        name: testName,
        passed,
        message: `Avg: ${summary.averageTime}ms, Slow: ${summary.slowQueries}/${summary.totalQueries}, Cache: ${summary.cacheMetrics.hitRate}%`
      })

      const icon = passed ? '✅' : '❌'
      console.log(`${icon} ${testName} ${passed ? 'passed' : 'failed'}\n`)

    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        message: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName} failed: ${error}\n`)
    }
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(60))
    console.log('PERFORMANCE BENCHMARK RESULTS')
    console.log('='.repeat(60))

    // Print benchmark table
    console.log('\n📊 Benchmark Summary:')
    console.log('-'.repeat(60))
    console.log('Operation'.padEnd(30) + 'Avg'.padEnd(10) + 'Target'.padEnd(10) + 'Status')
    console.log('-'.repeat(60))

    this.benchmarks.forEach(benchmark => {
      const icon = benchmark.passed ? '✅' : '❌'
      const operation = benchmark.operation.padEnd(30)
      const avg = `${benchmark.averageTime}ms`.padEnd(10)
      const target = `<${benchmark.target}ms`.padEnd(10)
      console.log(`${operation}${avg}${target}${icon}`)
    })

    console.log('-'.repeat(60))

    // Print test results
    console.log('\n📋 Test Results:')
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.name}`)
      console.log(`   ${result.message}`)
    })

    console.log('\n' + '-'.repeat(60))
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)
    console.log('='.repeat(60) + '\n')
  }
}

// Export test runner
export async function benchmarkPerformance(): Promise<{ results: TestResult[], benchmarks: BenchmarkResult[] }> {
  const tests = new PerformanceBenchmarkTests()
  return await tests.runAll()
}
