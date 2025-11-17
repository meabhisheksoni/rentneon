import { supabase } from '@/lib/supabase'
import { Renter, Payment } from '@/types'
import { trackQueryPerformance } from '@/utils/performanceMonitor'

export interface MonthlyBill {
  id?: string
  user_id?: string
  renter_id: number
  month: number
  year: number
  rent_amount: number
  
  // Electricity
  electricity_enabled: boolean
  electricity_initial_reading: number
  electricity_final_reading: number
  electricity_multiplier: number
  electricity_reading_date?: string
  electricity_amount: number
  
  // Motor
  motor_enabled: boolean
  motor_initial_reading: number
  motor_final_reading: number
  motor_multiplier: number
  motor_number_of_people: number
  motor_reading_date?: string
  motor_amount: number
  
  // Water
  water_enabled: boolean
  water_amount: number
  
  // Maintenance
  maintenance_enabled: boolean
  maintenance_amount: number
  
  // Totals
  total_amount: number
  total_payments: number
  pending_amount: number
  
  created_at?: string
  updated_at?: string
}

export interface AdditionalExpense {
  id?: string
  monthly_bill_id: string
  description: string
  amount: number
  date: string
  created_at?: string
}

export interface BillPayment {
  id?: string
  monthly_bill_id: string
  amount: number
  payment_date: string
  payment_type: 'cash' | 'online'
  note?: string
  created_at?: string
}

export interface BillWithDetails {
  bill: MonthlyBill | null
  expenses: AdditionalExpense[]
  payments: BillPayment[]
  previous_readings: {
    electricity_final: number
    motor_final: number
  }
}

export interface SaveBillResult {
  bill_id: string
  expense_ids: string[]
  payment_ids: string[]
  success: boolean
}

export interface DashboardSummary {
  active_renters: Renter[]
  archived_renters: Renter[]
  metrics: {
    total_renters: number
    total_monthly_rent: number
    pending_amount: number
  }
}

// Retry logic with exponential backoff
class RetryableQuery {
  private maxRetries = 2
  private baseDelay = 1000 // 1 second
  
  async execute<T>(
    queryFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await queryFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, attempt)
          console.warn(`${context} failed, retrying in ${delay}ms...`, error)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.maxRetries} retries: ${lastError!.message}`)
  }
}

// Timeout handling for database queries
async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    queryFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout - operation took longer than expected')), timeoutMs)
    )
  ])
}

export class SupabaseService {
  // Renter operations
  static async insertRenter(renter: Omit<Renter, 'id' | 'created_at'>): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const renterWithUser = {
        ...renter,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('renters')
        .insert(renterWithUser)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error inserting renter:', error)
      throw new Error(`Failed to add renter: ${error}`)
    }
  }

  static async getAllRenters(): Promise<Renter[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('renters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching renters:', error)
      return []
    }
  }

  static async getActiveRenters(): Promise<Renter[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('renters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('getActiveRenters - User ID:', user.id)
      console.log('getActiveRenters - Retrieved renters:', data?.length || 0)
      console.log('getActiveRenters - Renter details:', data?.map(r => ({ id: r.id, name: r.name, monthly_rent: r.monthly_rent })))

      return data || []
    } catch (error) {
      console.error('Error fetching active renters:', error)
      return []
    }
  }

  static async getArchivedRenters(): Promise<Renter[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('renters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching archived renters:', error)
      return []
    }
  }

  static async getRenterById(id: number): Promise<Renter | null> {
    try {
      const { data, error } = await supabase
        .from('renters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching renter:', error)
      return null
    }
  }

  static async setRenterActive(renterId: string, isActive: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Convert string ID to number for database query
      const numericId = parseInt(renterId, 10)
      if (isNaN(numericId)) {
        throw new Error('Invalid renter ID format')
      }

      const { error } = await supabase
        .from('renters')
        .update({ is_active: isActive })
        .eq('id', numericId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error(`Error setting renter active status to ${isActive}:`, error)
      throw new Error('Failed to update renter status.')
    }
  }

  // Payment operations
  static async insertPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error inserting payment:', error)
      throw new Error(`Failed to add payment: ${error}`)
    }
  }

  static async getPaymentsByRenter(renterId: number): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('renter_id', renterId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching payments:', error)
      return []
    }
  }

  static async getPaymentsForMonth(month: Date): Promise<Payment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      // First get renter IDs for this user
      const { data: renterIds } = await supabase
        .from('renters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!renterIds || renterIds.length === 0) return []

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('renter_id', renterIds.map(r => r.id))
        .gte('due_date', startOfMonth.getTime())
        .lte('due_date', endOfMonth.getTime())

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching payments for month:', error)
      return []
    }
  }

  // Dashboard calculations
  static async getTotalMonthlyRent(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('renters')
        .select('monthly_rent')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      console.log('getTotalMonthlyRent - User ID:', user.id)
      console.log('getTotalMonthlyRent - Active renters data:', data)
      console.log('getTotalMonthlyRent - Monthly rents:', (data || []).map(r => r.monthly_rent))

      const total = (data || []).reduce((sum, renter) => sum + renter.monthly_rent, 0)
      console.log('getTotalMonthlyRent - Calculated total:', total)
      return total
    } catch (error) {
      console.error('Error calculating total monthly rent:', error)
      return 0
    }
  }

  static async getOutstandingAmount(forDate: Date): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First get renter IDs for this user
      const { data: renterIds } = await supabase
        .from('renters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!renterIds || renterIds.length === 0) return 0

      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .in('renter_id', renterIds.map(r => r.id))
        .in('status', ['pending', 'overdue'])
        .lte('due_date', forDate.getTime())

      if (error) throw error

      const total = (data || []).reduce((sum, payment) => sum + payment.amount, 0)
      return total
    } catch (error) {
      console.error('Error calculating outstanding amount:', error)
      return 0
    }
  }

  // Monthly Bill operations
  static async getMonthlyBill(renterId: number, month: number, year: number): Promise<MonthlyBill | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First verify the renter belongs to this user
      const { data: renter } = await supabase
        .from('renters')
        .select('id')
        .eq('id', renterId)
        .eq('user_id', user.id)
        .single()

      if (!renter) throw new Error('Renter not found or access denied')

      const { data, error } = await supabase
        .from('monthly_bills')
        .select('*')
        .eq('renter_id', renterId)
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle()

      if (error) {
        console.error('Error fetching monthly bill:', error)
        return null
      }
      return data || null
    } catch (error) {
      console.error('Error fetching monthly bill:', error)
      return null
    }
  }

  static async getPreviousMonthBill(renterId: number, month: number, year: number): Promise<MonthlyBill | null> {
    try {
      let prevMonth = month - 1
      let prevYear = year
      
      if (prevMonth === 0) {
        prevMonth = 12
        prevYear = year - 1
      }

      return await this.getMonthlyBill(renterId, prevMonth, prevYear)
    } catch (error) {
      console.error('Error fetching previous month bill:', error)
      return null
    }
  }

  static async saveMonthlyBill(bill: MonthlyBill): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const billWithUser = {
        ...bill,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('monthly_bills')
        .upsert(billWithUser, {
          onConflict: 'renter_id,month,year',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error

      console.log('Saved monthly bill with ID:', data.id)
      return data.id
    } catch (error) {
      console.error('Error saving monthly bill:', error)
      throw new Error(`Failed to save monthly bill: ${error}`)
    }
  }

  static async getAdditionalExpenses(monthlyBillId: string): Promise<AdditionalExpense[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('additional_expenses')
        .select('*')
        .eq('monthly_bill_id', monthlyBillId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching additional expenses:', error)
      return []
    }
  }

  static async saveAdditionalExpense(expense: Omit<AdditionalExpense, 'id' | 'created_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('additional_expenses')
        .insert(expense)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error saving additional expense:', error)
      throw new Error(`Failed to save additional expense: ${error}`)
    }
  }

  static async updateAdditionalExpense(expenseId: string, expense: Omit<AdditionalExpense, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('additional_expenses')
        .update(expense)
        .eq('id', expenseId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating additional expense:', error)
      throw new Error(`Failed to update additional expense: ${error}`)
    }
  }

  static async getBillPayments(monthlyBillId: string): Promise<BillPayment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('monthly_bill_id', monthlyBillId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching bill payments:', error)
      return []
    }
  }

  static async saveBillPayment(payment: Omit<BillPayment, 'id' | 'created_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('bill_payments')
        .insert(payment)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error saving bill payment:', error)
      throw new Error(`Failed to save bill payment: ${error}`)
    }
  }

  static async updateBillPayment(paymentId: string, payment: Omit<BillPayment, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('bill_payments')
        .update(payment)
        .eq('id', paymentId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating bill payment:', error)
      throw new Error(`Failed to update bill payment: ${error}`)
    }
  }

  // Optimized methods using RPC functions
  
  /**
   * Fetches complete bill data including expenses and payments in a single RPC call
   * Falls back to parallel queries if RPC function is not available
   */
  static async getBillWithDetails(
    renterId: number,
    month: number,
    year: number
  ): Promise<BillWithDetails | null> {
    return trackQueryPerformance(
      'getBillWithDetails',
      async () => {
        const retryableQuery = new RetryableQuery()
        
        try {
          return await retryableQuery.execute(async () => {
            return await queryWithTimeout(async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('User not authenticated')

              // Try the optimized RPC function first
              try {
                const { data, error } = await supabase.rpc('get_bill_with_details', {
                  p_renter_id: renterId,
                  p_month: month,
                  p_year: year,
                  p_user_id: user.id
                })

                if (error) {
                  console.warn('RPC function not available, falling back to parallel queries:', error.message)
                  throw error
                }
                
                // Handle null response for new months gracefully
                if (!data) {
                  return {
                    bill: null,
                    expenses: [],
                    payments: [],
                    previous_readings: {
                      electricity_final: 0,
                      motor_final: 0
                    }
                  }
                }
                
                return data as BillWithDetails
              } catch (rpcError) {
                // Fallback to parallel queries for better performance than sequential
                console.log('Using parallel query fallback for better performance')
                
                const [bill, previousBill] = await Promise.all([
                  this.getMonthlyBill(renterId, month, year),
                  this.getPreviousMonthBill(renterId, month, year)
                ])

                if (!bill) {
                  return {
                    bill: null,
                    expenses: [],
                    payments: [],
                    previous_readings: {
                      electricity_final: previousBill?.electricity_final_reading || 0,
                      motor_final: previousBill?.motor_final_reading || 0
                    }
                  }
                }

                // Fetch expenses and payments in parallel
                const [expenses, payments] = await Promise.all([
                  this.getAdditionalExpenses(bill.id!),
                  this.getBillPayments(bill.id!)
                ])

                return {
                  bill,
                  expenses,
                  payments,
                  previous_readings: {
                    electricity_final: previousBill?.electricity_final_reading || 0,
                    motor_final: previousBill?.motor_final_reading || 0
                  }
                }
              }
            }, 5000)
          }, 'getBillWithDetails')
        } catch (error) {
          console.error('Error fetching bill with details:', error)
          throw new Error(`Failed to fetch bill details: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
      { renterId, month, year }
    )
  }

  /**
   * Saves bill data, expenses, and payments in a single batch operation
   * Returns generated IDs for cache updates
   */
  static async saveBillComplete(
    billData: MonthlyBill,
    expenses: AdditionalExpense[],
    payments: BillPayment[]
  ): Promise<SaveBillResult> {
    return trackQueryPerformance(
      'saveBillComplete',
      async () => {
        const retryableQuery = new RetryableQuery()
        
        try {
          return await retryableQuery.execute(async () => {
            return await queryWithTimeout(async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('User not authenticated')

              const { data, error } = await supabase.rpc('save_bill_complete', {
                p_bill_data: billData,
                p_expenses: expenses,
                p_payments: payments,
                p_user_id: user.id
              })

              if (error) throw error
              
              if (!data) {
                throw new Error('No data returned from save operation')
              }
              
              return data as SaveBillResult
            }, 5000)
          }, 'saveBillComplete')
        } catch (error) {
          console.error('Error saving bill complete:', error)
          throw new Error(`Failed to save bill: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
      { 
        renterId: billData.renter_id,
        month: billData.month,
        year: billData.year,
        expenseCount: expenses.length,
        paymentCount: payments.length
      }
    )
  }

  /**
   * Fetches all dashboard metrics in a single query with server-side aggregation
   * Replaces separate queries for renters, rent total, and pending amount
   */
  static async getDashboardSummary(
    referenceDate?: Date
  ): Promise<DashboardSummary> {
    return trackQueryPerformance(
      'getDashboardSummary',
      async () => {
        const retryableQuery = new RetryableQuery()
        
        try {
          return await retryableQuery.execute(async () => {
            return await queryWithTimeout(async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('User not authenticated')

              const dateStr = referenceDate 
                ? referenceDate.toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]

              const { data, error } = await supabase.rpc('get_dashboard_summary', {
                p_user_id: user.id,
                p_reference_date: dateStr
              })

              if (error) throw error
              
              if (!data) {
                // Return empty dashboard if no data
                return {
                  active_renters: [],
                  archived_renters: [],
                  metrics: {
                    total_renters: 0,
                    total_monthly_rent: 0,
                    pending_amount: 0
                  }
                }
              }
              
              return data as DashboardSummary
            }, 5000)
          }, 'getDashboardSummary')
        } catch (error) {
          console.error('Error fetching dashboard summary:', error)
          throw new Error(`Failed to fetch dashboard summary: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
      { referenceDate: referenceDate?.toISOString() }
    )
  }

  // Test connection and RPC functions
  static async testConnection(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('renters')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      if (error) throw error
      console.log('✅ Connection successful!')

      // Test if RPC functions are available
      try {
        await supabase.rpc('get_bill_with_details', {
          p_renter_id: 1,
          p_month: 1,
          p_year: 2025,
          p_user_id: user.id
        })
        console.log('✅ RPC functions are available - using optimized queries')
      } catch (rpcError) {
        console.warn('⚠️ RPC functions not available - using fallback queries. Deploy database-performance-optimization.sql to fix this.')
        console.warn('RPC Error:', rpcError)
      }
    } catch (error) {
      console.error('❌ Connection failed:', error)
    }
  }

  // Add sample data
  static async addSampleData(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check if data already exists for this user
      const { data: existingRenters } = await supabase
        .from('renters')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (existingRenters && existingRenters.length > 0) return

      // Add sample renters for this user
      const sampleRenters = [
        {
          name: 'Ram bhaiya',
          email: 'ram@example.com',
          phone: '555-0123',
          property_address: '123 Main Street, Apartment 1A',
          monthly_rent: 6000,
          move_in_date: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
          is_active: true,
          user_id: user.id,
        },
        {
          name: 'hjk',
          email: 'hjk@example.com',
          phone: '555-0456',
          property_address: '456 Oak Avenue, Unit 2B',
          monthly_rent: 8000,
          move_in_date: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
          is_active: true,
          user_id: user.id,
        },
        {
          name: 'fqfqf',
          email: 'fqfqf@example.com',
          phone: '555-0789',
          property_address: '789 Pine Road, Suite 3C',
          monthly_rent: 3000,
          move_in_date: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
          is_active: true,
          user_id: user.id,
        },
      ]

      const { error } = await supabase
        .from('renters')
        .insert(sampleRenters)

      if (error) throw error
    } catch (error) {
      console.error('Error adding sample data:', error)
      throw new Error(`Failed to add sample data: ${error}`)
    }
  }

  // Delete renter - updated to handle ID type conversion properly
  static async deleteRenter(renterId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Convert string ID to number for database query
      const numericId = parseInt(renterId, 10)
      if (isNaN(numericId)) {
        console.error('SupabaseService: Invalid renter ID format:', renterId)
        throw new Error('Invalid renter ID format')
      }

      console.log('SupabaseService: Deleting renter with ID:', numericId, 'for user:', user.id)

      const { error } = await supabase
        .from('renters')
        .delete()
        .eq('id', numericId)
        .eq('user_id', user.id)

      if (error) {
        console.error('SupabaseService: Database error deleting renter:', error)
        throw error
      }

      console.log('SupabaseService: Successfully deleted renter from database')
    } catch (error) {
      console.error('SupabaseService: Error deleting renter:', error)
      throw new Error(`Failed to delete renter: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}