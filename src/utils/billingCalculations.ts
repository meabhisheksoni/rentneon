/**
 * Pure Utility Calculation Engines for RentNeon Billing Lifecycle
 * (DFD Level 3 - Micro-Level Logic Pipelines)
 */

import { MonthlyBillData, AdditionalExpenseData, BillPaymentData } from '@/types'

export interface ElectricityCalculationInput {
  initialReading: number
  finalReading: number
  multiplier: number
  enabled?: boolean
}

export interface ElectricityCalculationResult {
  unitsConsumed: number
  amount: number
}

export interface MotorCalculationInput {
  initialReading: number
  finalReading: number
  multiplier: number
  numberOfPeople: number
  enabled?: boolean
}

export interface MotorCalculationResult {
  totalUnits: number
  amount: number
}

/**
 * Calculates electricity units consumed and total monetary charge.
 */
export function calculateElectricity(input: ElectricityCalculationInput): ElectricityCalculationResult {
  if (input.enabled === false) {
    return { unitsConsumed: 0, amount: 0 }
  }
  const initial = Number(input.initialReading) || 0
  const final = Number(input.finalReading) || 0
  const multiplier = Number(input.multiplier) || 0

  const unitsConsumed = Math.max(0, final - initial)
  const amount = Math.round(unitsConsumed * multiplier * 100) / 100

  return { unitsConsumed, amount }
}

/**
 * Calculates shared motor electricity units and split amount per person/household.
 */
export function calculateMotor(input: MotorCalculationInput): MotorCalculationResult {
  if (input.enabled === false) {
    return { totalUnits: 0, amount: 0 }
  }
  const initial = Number(input.initialReading) || 0
  const final = Number(input.finalReading) || 0
  const multiplier = Number(input.multiplier) || 0
  const people = Math.max(1, Number(input.numberOfPeople) || 1)

  const totalUnits = Math.max(0, final - initial)
  const amount = Math.round(((totalUnits * multiplier) / people) * 100) / 100

  return { totalUnits, amount }
}

/**
 * Aggregates total expenses from an array of expense line items.
 */
export function calculateTotalExpenses(expenses: Array<{ amount: number }>): number {
  if (!expenses || expenses.length === 0) return 0
  return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
}

/**
 * Aggregates total payments recorded against a bill.
 */
export function calculateTotalPayments(payments: Array<{ amount: number }>): number {
  if (!payments || payments.length === 0) return 0
  return payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
}

export interface BillAggregationInput {
  rentAmount: number
  electricityAmount: number
  motorAmount: number
  waterAmount: number
  maintenanceAmount: number
  expenses: Array<{ amount: number }>
  payments: Array<{ amount: number }>
}

export interface BillAggregationResult {
  totalExpenses: number
  totalPayments: number
  totalAmount: number
  pendingAmount: number
}

/**
 * Aggregates all bill components to produce total billed amount and outstanding balance.
 */
export function aggregateMonthlyBill(input: BillAggregationInput): BillAggregationResult {
  const rent = Number(input.rentAmount) || 0
  const electricity = Number(input.electricityAmount) || 0
  const motor = Number(input.motorAmount) || 0
  const water = Number(input.waterAmount) || 0
  const maintenance = Number(input.maintenanceAmount) || 0
  const totalExpenses = calculateTotalExpenses(input.expenses)
  const totalPayments = calculateTotalPayments(input.payments)

  const totalAmount = rent + electricity + motor + water + maintenance + totalExpenses
  const pendingAmount = Math.max(0, totalAmount - totalPayments)

  return {
    totalExpenses,
    totalPayments,
    totalAmount,
    pendingAmount,
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || `Month ${month}`
}

export interface WhatsAppMessageProps {
  renterName: string
  month: number
  year: number
  bill: MonthlyBillData
  expenses: AdditionalExpenseData[]
  payments: BillPaymentData[]
  propertyAddress?: string | null
}

/**
 * Synthesizes a clean, formatted WhatsApp invoice notification text.
 */
export function generateWhatsAppBillMessage(props: WhatsAppMessageProps): string {
  const { renterName, month, year, bill, expenses, payments, propertyAddress } = props
  const monthName = getMonthName(month)

  let text = `🏠 *RENT & UTILITY INVOICE*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `👤 *Tenant:* ${renterName}\n`
  if (propertyAddress) {
    text += `📍 *Property:* ${propertyAddress}\n`
  }
  text += `📅 *Billing Period:* ${monthName} ${year}\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`

  text += `📋 *CHARGES BREAKDOWN:*\n`
  text += `• Base Rent: ₹${bill.rent_amount?.toLocaleString('en-IN') || 0}\n`

  if (bill.electricity_enabled) {
    const units = Math.max(0, (bill.electricity_final_reading || 0) - (bill.electricity_initial_reading || 0))
    text += `• Electricity (${units} units @ ₹${bill.electricity_multiplier}/unit): ₹${bill.electricity_amount?.toLocaleString('en-IN') || 0}\n`
    text += `   _(Reading: ${bill.electricity_initial_reading} ➔ ${bill.electricity_final_reading})_\n`
  }

  if (bill.motor_enabled) {
    text += `• Shared Motor Charge: ₹${bill.motor_amount?.toLocaleString('en-IN') || 0}\n`
  }

  if (bill.water_enabled && bill.water_amount > 0) {
    text += `• Water Charges: ₹${bill.water_amount?.toLocaleString('en-IN')}\n`
  }

  if (bill.maintenance_enabled && bill.maintenance_amount > 0) {
    text += `• Maintenance: ₹${bill.maintenance_amount?.toLocaleString('en-IN')}\n`
  }

  if (expenses && expenses.length > 0) {
    text += `\n📦 *ADDITIONAL EXPENSES:*\n`
    expenses.forEach((exp) => {
      text += `• ${exp.description}: ₹${exp.amount?.toLocaleString('en-IN')}\n`
    })
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`
  text += `💰 *TOTAL AMOUNT:* ₹${bill.total_amount?.toLocaleString('en-IN') || 0}\n`

  if (payments && payments.length > 0) {
    const totalPaid = calculateTotalPayments(payments)
    text += `✅ *Paid So Far:* ₹${totalPaid.toLocaleString('en-IN')}\n`
    text += `⚠️ *BALANCE DUE:* ₹${bill.pending_amount?.toLocaleString('en-IN') || 0}\n`
  } else {
    text += `⚠️ *AMOUNT PAYABLE:* ₹${bill.total_amount?.toLocaleString('en-IN') || 0}\n`
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `_Please settle the balance at your earliest convenience. Thank you!_`

  return text
}
