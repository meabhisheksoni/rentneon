// ============================================================================
// Core Domain Types for RentNeon
// ============================================================================

export interface RenterData {
  id: number
  user_id: string
  name: string
  email: string | null
  phone: string | null
  property_address: string | null
  monthly_rent: number
  move_in_date: string | null
  is_active: boolean
  created_at?: string | null
  total_pending?: number
}

// Backward compatibility alias for Renter
export type Renter = RenterData

export interface MonthlyBillData {
  id?: string
  user_id?: string
  renter_id: number
  month: number
  year: number
  rent_amount: number

  electricity_enabled: boolean
  electricity_initial_reading: number
  electricity_final_reading: number
  electricity_multiplier: number
  electricity_reading_date?: string
  electricity_amount: number

  motor_enabled: boolean
  motor_initial_reading: number
  motor_final_reading: number
  motor_multiplier: number
  motor_number_of_people: number
  motor_reading_date?: string
  motor_amount: number

  water_enabled: boolean
  water_amount: number

  maintenance_enabled: boolean
  maintenance_amount: number

  total_amount: number
  total_payments: number
  pending_amount: number

  created_at?: string
  updated_at?: string
}

export interface AdditionalExpenseData {
  id?: string
  monthly_bill_id: string
  description: string
  amount: number
  date: string
  created_at?: string
}

export interface BillPaymentData {
  id?: string
  monthly_bill_id: string
  amount: number
  payment_date: string
  payment_type: 'cash' | 'online'
  note?: string
  created_at?: string
}

export interface BillWithDetails {
  bill: MonthlyBillData | null
  expenses: AdditionalExpenseData[]
  payments: BillPaymentData[]
  previous_readings: {
    electricity_final: number
    motor_final: number
    pending_amount: number
  }
}

export interface SaveBillResult {
  bill_id: string
  expense_ids: string[]
  payment_ids: string[]
  success: boolean
}

export interface DashboardSummary {
  active_renters: RenterData[]
  archived_renters: RenterData[]
  metrics: {
    total_renters: number
    total_monthly_rent: number
    pending_amount: number
  }
}

export interface Payment {
  id?: number
  renter_id: number
  amount: number
  payment_date: number
  due_date: number
  status: 'paid' | 'pending' | 'overdue'
  notes?: string
  created_at?: string
}

export interface BillItem {
  name: string
  amount: number
  enabled: boolean
}

export interface ElectricityBill extends BillItem {
  initialReading: number
  finalReading: number
  multiplier: number
}

export interface MotorBill extends BillItem {
  initialReading: number
  finalReading: number
  multiplier: number
  numberOfPeople: number
}