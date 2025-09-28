export interface Renter {
  id?: number
  name: string
  email: string
  phone: string
  property_address: string
  monthly_rent: number
  move_in_date: number
  is_active: boolean
  created_at?: string
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