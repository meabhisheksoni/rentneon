import { SupabaseService } from '@/services/supabaseService'
import { performanceMonitor } from './performanceMonitor'

export interface MonthData {
  rentAmount: number
  electricityEnabled: boolean
  electricityData: {
    initialReading: number
    finalReading: number
    multiplier: number
    readingDate: Date
  }
  motorEnabled: boolean
  motorData: {
    initialReading: number
    finalReading: number
    multiplier: number
    numberOfPeople: number
    readingDate: Date
  }
  waterEnabled: boolean
  waterAmount: number
  maintenanceEnabled: boolean
  maintenanceAmount: number
  additionalExpenses: Array<{
    id?: string
    description: string
    amount: number
    date: Date
  }>
  payments: Array<{
    id?: string
    amount: number
    date: Date
    type: 'cash' | 'online'
    note?: string
  }>
}

interface CacheEntry {
  data: MonthData
  timestamp: number
  isStale: boolean
}

export class BillCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes (increased for better performance)

  /**
   * Generate cache key based on renter ID, month, and year
   */
  getCacheKey(renterId: number, month: number, year: number): string {
    return `${renterId}-${year}-${month}`
  }

  /**
   * Get cached data for a specific month
   * Returns null if not cached
   * Marks entry as stale if TTL expired but still returns it
   */
  get(renterId: number, month: number, year: number): MonthData | null {
    const key = this.getCacheKey(renterId, month, year)
    const entry = this.cache.get(key)

    if (!entry) {
      performanceMonitor.recordCacheMiss()
      return null
    }

    performanceMonitor.recordCacheHit()

    // Mark as stale if expired but still return it
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      entry.isStale = true
    }

    return entry.data
  }

  /**
   * Check if cached data is stale (older than TTL)
   */
  isStale(renterId: number, month: number, year: number): boolean {
    const key = this.getCacheKey(renterId, month, year)
    const entry = this.cache.get(key)

    if (!entry) return false

    return Date.now() - entry.timestamp > this.CACHE_TTL
  }

  /**
   * Set cached data for a specific month
   */
  set(renterId: number, month: number, year: number, data: MonthData): void {
    const key = this.getCacheKey(renterId, month, year)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    })
  }

  /**
   * Invalidate (remove) cached data for a specific month
   */
  invalidate(renterId: number, month: number, year: number): void {
    const key = this.getCacheKey(renterId, month, year)
    this.cache.delete(key)
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Preload adjacent months in background without blocking UI
   */
  async preload(
    renterId: number,
    month: number,
    year: number,
    monthlyRent: number
  ): Promise<void> {
    // Calculate previous month
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Calculate next month
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    // Load in background without blocking
    Promise.all([
      this.loadIfNotCached(renterId, prevMonth, prevYear, monthlyRent),
      this.loadIfNotCached(renterId, nextMonth, nextYear, monthlyRent)
    ]).catch(err => console.error('Preload failed:', err))
  }

  /**
   * Load month data from database if not already cached
   */
  private async loadIfNotCached(
    renterId: number,
    month: number,
    year: number,
    monthlyRent: number
  ): Promise<void> {
    // Skip if already cached
    if (this.get(renterId, month, year)) {
      return
    }

    try {
      // Try to load existing bill for this month
      const existingBill = await SupabaseService.getMonthlyBill(renterId, month, year)

      let billData: MonthData

      if (existingBill) {
        // Load additional expenses and payments in parallel
        const [expenses, billPayments] = await Promise.all([
          SupabaseService.getAdditionalExpenses(existingBill.id!),
          SupabaseService.getBillPayments(existingBill.id!)
        ])

        billData = {
          rentAmount: existingBill.rent_amount,
          electricityEnabled: existingBill.electricity_enabled,
          electricityData: {
            initialReading: existingBill.electricity_initial_reading || 0,
            finalReading: existingBill.electricity_final_reading || 0,
            multiplier: existingBill.electricity_multiplier || 9,
            readingDate: existingBill.electricity_reading_date
              ? new Date(existingBill.electricity_reading_date)
              : new Date()
          },
          motorEnabled: existingBill.motor_enabled,
          motorData: {
            initialReading: existingBill.motor_initial_reading || 0,
            finalReading: existingBill.motor_final_reading || 0,
            multiplier: existingBill.motor_multiplier || 9,
            numberOfPeople: existingBill.motor_number_of_people || 2,
            readingDate: existingBill.motor_reading_date
              ? new Date(existingBill.motor_reading_date)
              : new Date()
          },
          waterEnabled: existingBill.water_enabled,
          waterAmount: existingBill.water_amount,
          maintenanceEnabled: existingBill.maintenance_enabled,
          maintenanceAmount: existingBill.maintenance_amount,
          additionalExpenses: expenses.map(exp => ({
            id: exp.id!,
            description: exp.description,
            amount: exp.amount,
            date: new Date(exp.date)
          })),
          payments: billPayments.map(payment => ({
            id: payment.id!,
            amount: payment.amount,
            date: new Date(payment.payment_date),
            type: payment.payment_type,
            note: payment.note
          }))
        }
      } else {
        // Create fresh bill with carry-forward readings
        const previousBill = await SupabaseService.getPreviousMonthBill(renterId, month, year)

        billData = {
          rentAmount: monthlyRent,
          electricityEnabled: false,
          electricityData: {
            initialReading: previousBill?.electricity_final_reading || 0,
            finalReading: previousBill?.electricity_final_reading || 0,
            multiplier: 9,
            readingDate: new Date()
          },
          motorEnabled: false,
          motorData: {
            initialReading: previousBill?.motor_final_reading || 0,
            finalReading: previousBill?.motor_final_reading || 0,
            multiplier: 9,
            numberOfPeople: 2,
            readingDate: new Date()
          },
          waterEnabled: false,
          waterAmount: 0,
          maintenanceEnabled: false,
          maintenanceAmount: 0,
          additionalExpenses: [],
          payments: []
        }
      }

      // Cache the loaded data
      this.set(renterId, month, year, billData)
    } catch (error) {
      console.error('Error loading month data for cache:', error)
      // Don't cache failed requests
    }
  }
}
