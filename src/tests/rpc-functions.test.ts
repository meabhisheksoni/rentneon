/**
 * RPC Functions Test Suite
 * Tests for get_bill_with_details, save_bill_complete, and get_dashboard_summary
 * 
 * Run this test by importing and calling testRPCFunctions() from a component
 * or by running it in the browser console
 */

import { SupabaseService } from '@/services/supabaseService'
import type { MonthlyBill, AdditionalExpense, BillPayment } from '@/services/supabaseService'

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

class RPCFunctionTests {
  private results: TestResult[] = []
  private testRenterId: number | undefined = undefined

  /**
   * Run all RPC function tests
   */
  async runAll(): Promise<TestResult[]> {
    console.log('🧪 Starting RPC Function Tests...\n')
    this.results = []

    try {
      // Setup: Get or create a test renter
      await this.setupTestRenter()

      // Test 1: Empty bill (new month)
      await this.testEmptyBill()

      // Test 2: Existing bill with multiple expenses and payments
      await this.testExistingBillWithData()

      // Test 3: Previous readings carry forward
      await this.testPreviousReadingsCarryForward()

      // Test 4: Year boundary edge case
      await this.testYearBoundary()

      // Test 5: Missing data handling
      await this.testMissingData()

      // Test 6: Dashboard summary
      await this.testDashboardSummary()

    } catch (error) {
      console.error('❌ Test suite failed:', error)
      this.results.push({
        name: 'Test Suite',
        passed: false,
        message: `Suite failed: ${error instanceof Error ? error.message : String(error)}`
      })
    }

    this.printResults()
    return this.results
  }

  /**
   * Setup: Get first active renter for testing
   */
  private async setupTestRenter(): Promise<void> {
    const renters = await SupabaseService.getActiveRenters()
    if (renters.length === 0) {
      throw new Error('No active renters found. Please add a renter first.')
    }
    this.testRenterId = renters[0].id
    console.log(`✅ Using test renter ID: ${this.testRenterId}\n`)
  }

  /**
   * Test 1: Empty bill (new month)
   * Should return null bill with empty expenses/payments and previous readings
   */
  private async testEmptyBill(): Promise<void> {
    const testName = 'Test 1: Empty Bill (New Month)'
    console.log(`Running ${testName}...`)

    try {
      const startTime = performance.now()

      // Use a future month that definitely doesn't exist
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 6)
      const month = futureDate.getMonth() + 1
      const year = futureDate.getFullYear()

      const result = await SupabaseService.getBillWithDetails(
        this.testRenterId!,
        month,
        year
      )

      const duration = performance.now() - startTime

      // Verify structure
      if (!result) {
        throw new Error('Expected result object, got null')
      }

      if (result.bill !== null) {
        throw new Error('Expected null bill for new month')
      }

      if (!Array.isArray(result.expenses) || result.expenses.length !== 0) {
        throw new Error('Expected empty expenses array')
      }

      if (!Array.isArray(result.payments) || result.payments.length !== 0) {
        throw new Error('Expected empty payments array')
      }

      if (!result.previous_readings) {
        throw new Error('Expected previous_readings object')
      }

      this.results.push({
        name: testName,
        passed: true,
        message: 'Successfully handled empty bill for new month',
        duration
      })
      console.log(`✅ ${testName} passed (${Math.round(duration)}ms)\n`)

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
   * Test 2: Existing bill with multiple expenses and payments
   */
  private async testExistingBillWithData(): Promise<void> {
    const testName = 'Test 2: Existing Bill with Multiple Expenses/Payments'
    console.log(`Running ${testName}...`)

    try {
      const startTime = performance.now()

      // Use current month
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      // First, create a bill with expenses and payments
      const billData: MonthlyBill = {
        renter_id: this.testRenterId!,
        month,
        year,
        rent_amount: 6000,
        electricity_enabled: true,
        electricity_initial_reading: 100,
        electricity_final_reading: 150,
        electricity_multiplier: 9,
        electricity_reading_date: now.toISOString().split('T')[0],
        electricity_amount: 450,
        motor_enabled: true,
        motor_initial_reading: 50,
        motor_final_reading: 70,
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

      const expenses: AdditionalExpense[] = [
        {
          monthly_bill_id: '', // Will be set by RPC
          description: 'Test Expense 1',
          amount: 500,
          date: now.toISOString().split('T')[0]
        },
        {
          monthly_bill_id: '',
          description: 'Test Expense 2',
          amount: 300,
          date: now.toISOString().split('T')[0]
        }
      ]

      const payments: BillPayment[] = [
        {
          monthly_bill_id: '',
          amount: 3000,
          payment_date: now.toISOString().split('T')[0],
          payment_type: 'cash',
          note: 'Test Payment 1'
        },
        {
          monthly_bill_id: '',
          amount: 2000,
          payment_date: now.toISOString().split('T')[0],
          payment_type: 'online',
          note: 'Test Payment 2'
        }
      ]

      // Save the bill
      const saveResult = await SupabaseService.saveBillComplete(
        billData,
        expenses,
        payments
      )

      if (!saveResult.success) {
        throw new Error('Failed to save bill')
      }

      // Now fetch it back
      const result = await SupabaseService.getBillWithDetails(
        this.testRenterId!,
        month,
        year
      )

      const duration = performance.now() - startTime

      // Verify the data
      if (!result || !result.bill) {
        throw new Error('Expected bill data, got null')
      }

      if (result.bill.rent_amount !== 6000) {
        throw new Error(`Expected rent_amount 6000, got ${result.bill.rent_amount}`)
      }

      if (result.expenses.length !== 2) {
        throw new Error(`Expected 2 expenses, got ${result.expenses.length}`)
      }

      if (result.payments.length !== 2) {
        throw new Error(`Expected 2 payments, got ${result.payments.length}`)
      }

      this.results.push({
        name: testName,
        passed: true,
        message: 'Successfully saved and retrieved bill with expenses and payments',
        duration
      })
      console.log(`✅ ${testName} passed (${Math.round(duration)}ms)\n`)

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
   * Test 3: Previous readings carry forward correctly
   */
  private async testPreviousReadingsCarryForward(): Promise<void> {
    const testName = 'Test 3: Previous Readings Carry Forward'
    console.log(`Running ${testName}...`)

    try {
      const startTime = performance.now()

      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Calculate previous month
      let prevMonth = currentMonth - 1
      let prevYear = currentYear
      if (prevMonth === 0) {
        prevMonth = 12
        prevYear = currentYear - 1
      }

      // Create a bill for previous month with specific readings
      const prevBillData: MonthlyBill = {
        renter_id: this.testRenterId!,
        month: prevMonth,
        year: prevYear,
        rent_amount: 6000,
        electricity_enabled: true,
        electricity_initial_reading: 100,
        electricity_final_reading: 250, // This should carry forward
        electricity_multiplier: 9,
        electricity_amount: 1350,
        motor_enabled: true,
        motor_initial_reading: 50,
        motor_final_reading: 120, // This should carry forward
        motor_multiplier: 9,
        motor_number_of_people: 2,
        motor_amount: 630,
        water_enabled: false,
        water_amount: 0,
        maintenance_enabled: false,
        maintenance_amount: 0,
        total_amount: 7980,
        total_payments: 0,
        pending_amount: 7980
      }

      await SupabaseService.saveBillComplete(prevBillData, [], [])

      // Now fetch current month and check previous readings
      const result = await SupabaseService.getBillWithDetails(
        this.testRenterId!,
        currentMonth,
        currentYear
      )

      const duration = performance.now() - startTime

      if (!result) {
        throw new Error('Expected result object')
      }

      if (result.previous_readings.electricity_final !== 250) {
        throw new Error(
          `Expected electricity_final 250, got ${result.previous_readings.electricity_final}`
        )
      }

      if (result.previous_readings.motor_final !== 120) {
        throw new Error(
          `Expected motor_final 120, got ${result.previous_readings.motor_final}`
        )
      }

      this.results.push({
        name: testName,
        passed: true,
        message: 'Previous readings carried forward correctly',
        duration
      })
      console.log(`✅ ${testName} passed (${Math.round(duration)}ms)\n`)

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
   * Test 4: Year boundary edge case (December to January)
   */
  private async testYearBoundary(): Promise<void> {
    const testName = 'Test 4: Year Boundary (December to January)'
    console.log(`Running ${testName}...`)

    try {
      const startTime = performance.now()

      const currentYear = new Date().getFullYear()

      // Create December bill
      const decBillData: MonthlyBill = {
        renter_id: this.testRenterId!,
        month: 12,
        year: currentYear - 1,
        rent_amount: 6000,
        electricity_enabled: true,
        electricity_initial_reading: 500,
        electricity_final_reading: 600,
        electricity_multiplier: 9,
        electricity_amount: 900,
        motor_enabled: true,
        motor_initial_reading: 200,
        motor_final_reading: 250,
        motor_multiplier: 9,
        motor_number_of_people: 2,
        motor_amount: 450,
        water_enabled: false,
        water_amount: 0,
        maintenance_enabled: false,
        maintenance_amount: 0,
        total_amount: 7350,
        total_payments: 0,
        pending_amount: 7350
      }

      await SupabaseService.saveBillComplete(decBillData, [], [])

      // Fetch January bill and check if December readings carried forward
      const result = await SupabaseService.getBillWithDetails(
        this.testRenterId!,
        1,
        currentYear
      )

      const duration = performance.now() - startTime

      if (!result) {
        throw new Error('Expected result object')
      }

      if (result.previous_readings.electricity_final !== 600) {
        throw new Error(
          `Expected electricity_final 600 from December, got ${result.previous_readings.electricity_final}`
        )
      }

      if (result.previous_readings.motor_final !== 250) {
        throw new Error(
          `Expected motor_final 250 from December, got ${result.previous_readings.motor_final}`
        )
      }

      this.results.push({
        name: testName,
        passed: true,
        message: 'Year boundary handled correctly',
        duration
      })
      console.log(`✅ ${testName} passed (${Math.round(duration)}ms)\n`)

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
   * Test 5: Missing data handling
   */
  private async testMissingData(): Promise<void> {
    const testName = 'Test 5: Missing Data Handling'
    console.log(`Running ${testName}...`)

    try {
      const startTime = performance.now()

      // Try to fetch bill for a renter that doesn't exist
      const result = await SupabaseService.getBillWithDetails(
        999999, // Non-existent renter
        1,
        2025
      )

      const duration = performance.now() - startTime

      // Should return null or empty structure without throwing
      if (result && result.bill === null) {
        this.results.push({
          name: testName,
          passed: true,
          message: 'Missing data handled gracefully',
          duration
        })
        console.log(`✅ ${testName} passed (${Math.round(duration)}ms)\n`)
      } else {
        throw new Error('Expected null bill for non-existent renter')
      }

    } catch (error) {
      // If it throws an error, that's also acceptable as long as it's handled
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
        this.results.push({
          name: testName,
          passed: true,
          message: 'Missing data handled with appropriate error'
        })
        console.log(`✅ ${testName} passed (handled with error)\n`)
      } else {
        this.results.push({
          name: testName,
          passed: false,
          message: errorMessage
        })
        console.log(`❌ ${testName} failed: ${error}\n`)
      }
    }
  }

  /**
   * Test 6: Dashboard summary
   */
  private async testDashboardSummary(): Promise<void> {
    const testName = 'Test 6: Dashboard Summary'
    console.log(`Running ${testName}...`)

    try {
      const startTime = performance.now()

      const result = await SupabaseService.getDashboardSummary()

      const duration = performance.now() - startTime

      if (!result) {
        throw new Error('Expected dashboard summary result')
      }

      if (!Array.isArray(result.active_renters)) {
        throw new Error('Expected active_renters array')
      }

      if (!Array.isArray(result.archived_renters)) {
        throw new Error('Expected archived_renters array')
      }

      if (!result.metrics) {
        throw new Error('Expected metrics object')
      }

      if (typeof result.metrics.total_renters !== 'number') {
        throw new Error('Expected total_renters to be a number')
      }

      if (typeof result.metrics.total_monthly_rent !== 'number') {
        throw new Error('Expected total_monthly_rent to be a number')
      }

      if (typeof result.metrics.pending_amount !== 'number') {
        throw new Error('Expected pending_amount to be a number')
      }

      this.results.push({
        name: testName,
        passed: true,
        message: `Dashboard summary retrieved successfully (${result.active_renters.length} active renters)`,
        duration
      })
      console.log(`✅ ${testName} passed (${Math.round(duration)}ms)\n`)

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
    console.log('TEST RESULTS SUMMARY')
    console.log('='.repeat(60))

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total = this.results.length

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      const duration = result.duration ? ` (${Math.round(result.duration)}ms)` : ''
      console.log(`${icon} ${result.name}${duration}`)
      if (!result.passed) {
        console.log(`   Error: ${result.message}`)
      }
    })

    console.log('\n' + '-'.repeat(60))
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)
    console.log('='.repeat(60) + '\n')
  }
}

// Export test runner
export async function testRPCFunctions(): Promise<TestResult[]> {
  const tests = new RPCFunctionTests()
  return await tests.runAll()
}
