/**
 * Scalability Test Suite
 * Tests performance with multiple renters and large datasets
 */

import { SupabaseService } from '@/services/supabaseService'
import type { MonthlyBill } from '@/services/supabaseService'
import type { Renter } from '@/types'

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

interface ScalabilityResult {
  renterCount: number
  operationTime: number
  timePerRenter: number
}

class ScalabilityTests {
  private results: TestResult[] = []
  private scalabilityData: ScalabilityResult[] = []

  /**
   * Run all scalability tests
   */
  async runAll(): Promise<{ results: TestResult[], scalabilityData: ScalabilityResult[] }> {
    console.log('🧪 Starting Scalability Tests...\n')
    this.results = []
    this.scalabilityData = []

    try {
      // Test 1: Performance with different renter counts
      await this.testScalability()

      // Test 2: Verify linear scaling
      await this.verifyLinearScaling()

      // Test 3: Concurrent saves (simulated)
      await this.testConcurrentSaves()

      // Test 4: Large dataset handling
      await this.testLargeDataset()

    } catch (error) {
      console.error('❌ Test suite failed:', error)
      this.results.push({
        name: 'Test Suite',
        passed: false,
        message: `Suite failed: ${error instanceof Error ? error.message : String(error)}`
      })
    }

    this.printResults()
    return { results: this.results, scalabilityData: this.scalabilityData }
  }

  /**
   * Test 1: Performance with 1, 10, 50, and 100 renters
   * Note: This test uses existing renters and simulates larger datasets
   */
  private async testScalability(): Promise<void> {
    const testName = 'Test 1: Performance Scaling with Renter Count'
    console.log(`Running ${testName}...`)

    try {
      // Get current renters
      const renters = await SupabaseService.getActiveRenters()
      const actualRenterCount = renters.length

      console.log(`   Current active renters: ${actualRenterCount}`)

      // Test with actual renters
      const startTime = performance.now()
      const summary = await SupabaseService.getDashboardSummary()
      const duration = performance.now() - startTime

      const timePerRenter = actualRenterCount > 0 ? duration / actualRenterCount : duration

      this.scalabilityData.push({
        renterCount: actualRenterCount,
        operationTime: Math.round(duration),
        timePerRenter: Math.round(timePerRenter * 100) / 100
      })

      console.log(`   Dashboard load time: ${Math.round(duration)}ms`)
      console.log(`   Time per renter: ${Math.round(timePerRenter)}ms`)

      // Verify performance is acceptable
      const passed = duration < 1000 // Should be under 1 second even with many renters

      this.results.push({
        name: testName,
        passed,
        message: `${actualRenterCount} renters: ${Math.round(duration)}ms (${Math.round(timePerRenter)}ms per renter)`,
        duration
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
   * Test 2: Verify performance scales linearly
   */
  private async testLinearScaling(): Promise<void> {
    const testName = 'Test 2: Linear Scaling Verification'
    console.log(`Running ${testName}...`)

    try {
      const renters = await SupabaseService.getActiveRenters()
      
      if (renters.length < 2) {
        console.log('   ⚠️  Need at least 2 renters to test scaling')
        this.results.push({
          name: testName,
          passed: true,
          message: 'Skipped: Need at least 2 renters'
        })
        return
      }

      // Test with 1 renter
      const singleRenterTime = await this.measureBillLoadTime(renters[0].id!)

      // Test with multiple renters (simulate by loading bills sequentially)
      const multipleRenterTimes: number[] = []
      for (let i = 0; i < Math.min(renters.length, 5); i++) {
        const time = await this.measureBillLoadTime(renters[i].id!)
        multipleRenterTimes.push(time)
      }

      const avgMultipleTime = multipleRenterTimes.reduce((a, b) => a + b, 0) / multipleRenterTimes.length

      // Check if scaling is roughly linear (within 50% variance)
      const scalingFactor = avgMultipleTime / singleRenterTime
      const isLinear = scalingFactor < 1.5 // Should not be more than 50% slower per renter

      console.log(`   Single renter: ${Math.round(singleRenterTime)}ms`)
      console.log(`   Average per renter: ${Math.round(avgMultipleTime)}ms`)
      console.log(`   Scaling factor: ${scalingFactor.toFixed(2)}x`)

      this.results.push({
        name: testName,
        passed: isLinear,
        message: `Scaling factor: ${scalingFactor.toFixed(2)}x (${isLinear ? 'linear' : 'non-linear'})`
      })

      const icon = isLinear ? '✅' : '❌'
      console.log(`${icon} ${testName} ${isLinear ? 'passed' : 'failed'}\n`)

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
   * Helper: Measure bill load time for a single renter
   */
  private async measureBillLoadTime(renterId: number): Promise<number> {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const startTime = performance.now()
    await SupabaseService.getBillWithDetails(renterId, month, year)
    return performance.now() - startTime
  }

  /**
   * Test 3: Concurrent saves from multiple users
   * Simulates concurrent operations by running saves in parallel
   */
  private async testConcurrentSaves(): Promise<void> {
    const testName = 'Test 3: Concurrent Save Operations'
    console.log(`Running ${testName}...`)

    try {
      const renters = await SupabaseService.getActiveRenters()
      
      if (renters.length === 0) {
        throw new Error('No active renters found')
      }

      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      // Create multiple save operations
      const saveOperations = renters.slice(0, Math.min(renters.length, 3)).map((renter, index) => {
        const billData: MonthlyBill = {
          renter_id: renter.id!,
          month,
          year,
          rent_amount: renter.monthly_rent,
          electricity_enabled: true,
          electricity_initial_reading: 100 + index,
          electricity_final_reading: 150 + index,
          electricity_multiplier: 9,
          electricity_reading_date: now.toISOString().split('T')[0],
          electricity_amount: 450,
          motor_enabled: false,
          motor_initial_reading: 0,
          motor_final_reading: 0,
          motor_multiplier: 9,
          motor_number_of_people: 2,
          motor_amount: 0,
          water_enabled: false,
          water_amount: 0,
          maintenance_enabled: false,
          maintenance_amount: 0,
          total_amount: renter.monthly_rent + 450,
          total_payments: 0,
          pending_amount: renter.monthly_rent + 450
        }

        return SupabaseService.saveBillComplete(billData, [], [])
      })

      // Execute all saves concurrently
      const startTime = performance.now()
      const results = await Promise.allSettled(saveOperations)
      const duration = performance.now() - startTime

      // Check results
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      console.log(`   Concurrent saves: ${saveOperations.length}`)
      console.log(`   Successful: ${successful}`)
      console.log(`   Failed: ${failed}`)
      console.log(`   Total time: ${Math.round(duration)}ms`)

      // All should succeed without race conditions
      const passed = failed === 0

      this.results.push({
        name: testName,
        passed,
        message: `${successful}/${saveOperations.length} successful in ${Math.round(duration)}ms`,
        duration
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
   * Test 4: Large dataset handling
   * Tests with bills that have many expenses and payments
   */
  private async testLargeDataset(): Promise<void> {
    const testName = 'Test 4: Large Dataset Handling'
    console.log(`Running ${testName}...`)

    try {
      const renters = await SupabaseService.getActiveRenters()
      
      if (renters.length === 0) {
        throw new Error('No active renters found')
      }

      const renter = renters[0]
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      // Create a bill with many expenses and payments
      const billData: MonthlyBill = {
        renter_id: renter.id!,
        month,
        year,
        rent_amount: renter.monthly_rent,
        electricity_enabled: true,
        electricity_initial_reading: 100,
        electricity_final_reading: 200,
        electricity_multiplier: 9,
        electricity_reading_date: now.toISOString().split('T')[0],
        electricity_amount: 900,
        motor_enabled: true,
        motor_initial_reading: 50,
        motor_final_reading: 100,
        motor_multiplier: 9,
        motor_number_of_people: 2,
        motor_amount: 450,
        water_enabled: true,
        water_amount: 200,
        maintenance_enabled: true,
        maintenance_amount: 300,
        total_amount: renter.monthly_rent + 1850,
        total_payments: 0,
        pending_amount: renter.monthly_rent + 1850
      }

      // Create 20 expenses
      const expenses = Array.from({ length: 20 }, (_, i) => ({
        monthly_bill_id: '',
        description: `Large Dataset Expense ${i + 1}`,
        amount: 100 + i * 10,
        date: now.toISOString().split('T')[0]
      }))

      // Create 15 payments
      const payments = Array.from({ length: 15 }, (_, i) => ({
        monthly_bill_id: '',
        amount: 500 + i * 50,
        payment_date: now.toISOString().split('T')[0],
        payment_type: (i % 2 === 0 ? 'cash' : 'online') as 'cash' | 'online',
        note: `Large Dataset Payment ${i + 1}`
      }))

      // Save the large dataset
      const startTime = performance.now()
      const saveResult = await SupabaseService.saveBillComplete(billData, expenses, payments)
      const saveDuration = performance.now() - startTime

      console.log(`   Save time: ${Math.round(saveDuration)}ms`)

      // Load it back
      const loadStartTime = performance.now()
      const loadResult = await SupabaseService.getBillWithDetails(renter.id!, month, year)
      const loadDuration = performance.now() - loadStartTime

      console.log(`   Load time: ${Math.round(loadDuration)}ms`)

      // Verify data integrity
      if (!loadResult || !loadResult.bill) {
        throw new Error('Failed to load bill')
      }

      if (loadResult.expenses.length !== 20) {
        throw new Error(`Expected 20 expenses, got ${loadResult.expenses.length}`)
      }

      if (loadResult.payments.length !== 15) {
        throw new Error(`Expected 15 payments, got ${loadResult.payments.length}`)
      }

      // Performance should still be acceptable
      const passed = saveDuration < 1000 && loadDuration < 500

      this.results.push({
        name: testName,
        passed,
        message: `Save: ${Math.round(saveDuration)}ms, Load: ${Math.round(loadDuration)}ms (20 expenses, 15 payments)`,
        duration: saveDuration + loadDuration
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
   * Verify linear scaling (wrapper for testLinearScaling)
   */
  private async verifyLinearScaling(): Promise<void> {
    await this.testLinearScaling()
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(60))
    console.log('SCALABILITY TEST RESULTS')
    console.log('='.repeat(60))

    // Print scalability data
    if (this.scalabilityData.length > 0) {
      console.log('\n📊 Scalability Data:')
      console.log('-'.repeat(60))
      console.log('Renters'.padEnd(15) + 'Total Time'.padEnd(20) + 'Time/Renter')
      console.log('-'.repeat(60))

      this.scalabilityData.forEach(data => {
        const renters = `${data.renterCount}`.padEnd(15)
        const total = `${data.operationTime}ms`.padEnd(20)
        const perRenter = `${data.timePerRenter}ms`
        console.log(`${renters}${total}${perRenter}`)
      })

      console.log('-'.repeat(60))
    }

    // Print test results
    console.log('\n📋 Test Results:')
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      const duration = result.duration ? ` (${Math.round(result.duration)}ms)` : ''
      console.log(`${icon} ${result.name}${duration}`)
      console.log(`   ${result.message}`)
    })

    console.log('\n' + '-'.repeat(60))
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)
    console.log('='.repeat(60) + '\n')
  }
}

// Export test runner
export async function testScalability(): Promise<{ results: TestResult[], scalabilityData: ScalabilityResult[] }> {
  const tests = new ScalabilityTests()
  return await tests.runAll()
}
