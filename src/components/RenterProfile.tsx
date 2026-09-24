'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, Send, Trash2, Archive, MoreVertical } from 'lucide-react'
import { Renter, MonthlyBillData, AdditionalExpenseData, BillPaymentData } from '@/types'
import { ApiService } from '@/services/apiService'
import { billCache as sharedBillCache } from '@/utils/billCache'
import { aggregateMonthlyBill } from '@/utils/billingCalculations'

import { BillOverviewCard } from './renter-profile/BillOverviewCard'
import { ElectricityMeterForm } from './renter-profile/ElectricityMeterForm'
import { MotorMeterForm } from './renter-profile/MotorMeterForm'
import { ExpenseManager, AdditionalExpense } from './renter-profile/ExpenseManager'
import { PaymentHistoryList, PaymentItem } from './renter-profile/PaymentHistoryList'
import { BillShareModal } from './renter-profile/BillShareModal'

interface RenterProfileProps {
  renter: Renter
  onClose: () => void
  onArchive?: (renterId: string) => void
  onUnarchive?: (renterId: string) => void
  onDelete?: (renterId: string) => void
}

export default function RenterProfile({
  renter,
  onClose,
  onArchive,
  onUnarchive,
  onDelete,
}: RenterProfileProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [rentAmount, setRentAmount] = useState<number>(renter.monthly_rent || 0)

  // Electricity
  const [electricityEnabled, setElectricityEnabled] = useState(false)
  const [electricityData, setElectricityData] = useState({
    initialReading: 0,
    finalReading: 0,
    multiplier: 9,
    readingDate: new Date(),
  })

  // Motor
  const [motorEnabled, setMotorEnabled] = useState(false)
  const [motorData, setMotorData] = useState({
    initialReading: 0,
    finalReading: 0,
    multiplier: 9,
    numberOfPeople: 2,
    readingDate: new Date(),
  })

  // Utilities
  const [waterEnabled, setWaterEnabled] = useState(false)
  const [waterAmount, setWaterAmount] = useState(0)
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceAmount, setMaintenanceAmount] = useState(0)

  // Expenses & Payments
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])

  // UI State
  const [showShareModal, setShowShareModal] = useState(false)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDataStale, setIsDataStale] = useState(false)

  const activeRequestRef = useRef<string>('')

  const currentMonthNum = selectedMonth.getMonth() + 1
  const currentYearNum = selectedMonth.getFullYear()

  // Calculated totals
  const electricityAmount = useMemo(() => {
    if (!electricityEnabled) return 0
    return Math.max(0, electricityData.finalReading - electricityData.initialReading) * electricityData.multiplier
  }, [electricityEnabled, electricityData])

  const motorAmount = useMemo(() => {
    if (!motorEnabled) return 0
    const units = Math.max(0, motorData.finalReading - motorData.initialReading)
    return Math.round(((units * motorData.multiplier) / Math.max(1, motorData.numberOfPeople)) * 100) / 100
  }, [motorEnabled, motorData])

  const totals = useMemo(() => {
    return aggregateMonthlyBill({
      rentAmount,
      electricityAmount,
      motorAmount,
      waterAmount: waterEnabled ? waterAmount : 0,
      maintenanceAmount: maintenanceEnabled ? maintenanceAmount : 0,
      expenses: additionalExpenses,
      payments,
    })
  }, [rentAmount, electricityAmount, motorAmount, waterEnabled, waterAmount, maintenanceEnabled, maintenanceAmount, additionalExpenses, payments])

  // Load bill data for month
  const loadMonthData = useCallback(async (month: number, year: number) => {
    const requestId = `${renter.id}-${month}-${year}-${Date.now()}`
    activeRequestRef.current = requestId
    setIsLoading(true)

    try {
      const billDetails = await ApiService.getBillWithDetails(renter.id, month, year)

      if (activeRequestRef.current !== requestId) return

      if (billDetails && billDetails.bill) {
        const b = billDetails.bill
        setRentAmount(b.rent_amount ?? renter.monthly_rent)
        setElectricityEnabled(Boolean(b.electricity_enabled))
        setElectricityData({
          initialReading: b.electricity_initial_reading || 0,
          finalReading: b.electricity_final_reading || 0,
          multiplier: b.electricity_multiplier || 9,
          readingDate: b.electricity_reading_date ? new Date(b.electricity_reading_date) : new Date(),
        })

        setMotorEnabled(Boolean(b.motor_enabled))
        setMotorData({
          initialReading: b.motor_initial_reading || 0,
          finalReading: b.motor_final_reading || 0,
          multiplier: b.motor_multiplier || 9,
          numberOfPeople: b.motor_number_of_people || 2,
          readingDate: b.motor_reading_date ? new Date(b.motor_reading_date) : new Date(),
        })

        setWaterEnabled(Boolean(b.water_enabled))
        setWaterAmount(b.water_amount || 0)
        setMaintenanceEnabled(Boolean(b.maintenance_enabled))
        setMaintenanceAmount(b.maintenance_amount || 0)

        setAdditionalExpenses(
          (billDetails.expenses || []).map((exp) => ({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            date: new Date(exp.date),
          }))
        )

        setPayments(
          (billDetails.payments || []).map((p) => ({
            id: p.id,
            amount: p.amount,
            date: new Date(p.payment_date),
            type: p.payment_type as 'cash' | 'online',
            note: p.note,
          }))
        )
      } else {
        // New Month Default: Carry over previous month reading if available
        setRentAmount(renter.monthly_rent)
        const prevReading = billDetails?.previous_readings?.electricity_final || 0
        setElectricityEnabled(false)
        setElectricityData({
          initialReading: prevReading,
          finalReading: prevReading,
          multiplier: 9,
          readingDate: new Date(),
        })
        setMotorEnabled(false)
        setMotorData({
          initialReading: 0,
          finalReading: 0,
          multiplier: 9,
          numberOfPeople: 2,
          readingDate: new Date(),
        })
        setWaterEnabled(false)
        setWaterAmount(0)
        setMaintenanceEnabled(false)
        setMaintenanceAmount(0)
        setAdditionalExpenses([])
        setPayments([])
      }
    } catch (err) {
      console.error('Failed to load bill data', err)
    } finally {
      if (activeRequestRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [renter])

  useEffect(() => {
    loadMonthData(currentMonthNum, currentYearNum)
  }, [loadMonthData, currentMonthNum, currentYearNum])

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Save bill mutation
  const handleSaveBill = async () => {
    setIsSaving(true)
    try {
      const billPayload: MonthlyBillData = {
        renter_id: renter.id,
        month: currentMonthNum,
        year: currentYearNum,
        rent_amount: rentAmount,
        electricity_enabled: electricityEnabled,
        electricity_initial_reading: electricityData.initialReading,
        electricity_final_reading: electricityData.finalReading,
        electricity_multiplier: electricityData.multiplier,
        electricity_reading_date: format(electricityData.readingDate, 'yyyy-MM-dd'),
        electricity_amount: electricityAmount,
        motor_enabled: motorEnabled,
        motor_initial_reading: motorData.initialReading,
        motor_final_reading: motorData.finalReading,
        motor_multiplier: motorData.multiplier,
        motor_number_of_people: motorData.numberOfPeople,
        motor_reading_date: format(motorData.readingDate, 'yyyy-MM-dd'),
        motor_amount: motorAmount,
        water_enabled: waterEnabled,
        water_amount: waterAmount,
        maintenance_enabled: maintenanceEnabled,
        maintenance_amount: maintenanceAmount,
        total_amount: totals.totalAmount,
        total_payments: totals.totalPayments,
        pending_amount: totals.pendingAmount,
      }

      const expensesPayload = additionalExpenses.map((exp) => ({
        id: exp.id,
        monthly_bill_id: '',
        description: exp.description,
        amount: exp.amount,
        date: format(exp.date, 'yyyy-MM-dd'),
      }))

      const paymentsPayload = payments.map((p) => ({
        id: p.id,
        monthly_bill_id: '',
        amount: p.amount,
        payment_date: format(p.date, 'yyyy-MM-dd'),
        payment_type: p.type,
        note: p.note,
      }))

      await ApiService.saveBillComplete(billPayload, expensesPayload, paymentsPayload)
    } catch (err) {
      console.error('Failed to save bill', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Compile bill object for share modal
  const compiledBillForShare: MonthlyBillData = {
    renter_id: renter.id,
    month: currentMonthNum,
    year: currentYearNum,
    rent_amount: rentAmount,
    electricity_enabled: electricityEnabled,
    electricity_initial_reading: electricityData.initialReading,
    electricity_final_reading: electricityData.finalReading,
    electricity_multiplier: electricityData.multiplier,
    electricity_amount: electricityAmount,
    motor_enabled: motorEnabled,
    motor_initial_reading: motorData.initialReading,
    motor_final_reading: motorData.finalReading,
    motor_multiplier: motorData.multiplier,
    motor_number_of_people: motorData.numberOfPeople,
    motor_amount: motorAmount,
    water_enabled: waterEnabled,
    water_amount: waterAmount,
    maintenance_enabled: maintenanceEnabled,
    maintenance_amount: maintenanceAmount,
    total_amount: totals.totalAmount,
    total_payments: totals.totalPayments,
    pending_amount: totals.pendingAmount,
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{renter.name}</h1>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    renter.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {renter.is_active ? 'Active Tenant' : 'Archived'}
                </span>
              </div>
              {renter.property_address && (
                <p className="text-xs text-gray-500">{renter.property_address}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              Share Invoice
            </button>

            <button
              onClick={handleSaveBill}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showActionsDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-40">
                  {renter.is_active ? (
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false)
                        onArchive?.(String(renter.id))
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                    >
                      <Archive className="w-4 h-4" />
                      Archive Tenant
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false)
                        onUnarchive?.(String(renter.id))
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      <Archive className="w-4 h-4" />
                      Unarchive Tenant
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowActionsDropdown(false)
                      if (confirm(`Are you sure you want to delete ${renter.name}?`)) {
                        onDelete?.(String(renter.id))
                      }
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Renter Record
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Month Navigation & Bill Metrics */}
        <BillOverviewCard
          selectedMonth={selectedMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          rentAmount={rentAmount}
          onRentChange={setRentAmount}
          totalAmount={totals.totalAmount}
          totalPaid={totals.totalPayments}
          pendingAmount={totals.pendingAmount}
          isLoading={isLoading}
          isDataStale={isDataStale}
        />

        {/* Electricity Sub-Meter */}
        <ElectricityMeterForm
          enabled={electricityEnabled}
          onToggle={setElectricityEnabled}
          data={electricityData}
          onChange={setElectricityData}
        />

        {/* Shared Water Pump Motor */}
        <MotorMeterForm
          enabled={motorEnabled}
          onToggle={setMotorEnabled}
          data={motorData}
          onChange={setMotorData}
        />

        {/* Utilities & Dynamic Additional Expenses */}
        <ExpenseManager
          waterEnabled={waterEnabled}
          onWaterToggle={setWaterEnabled}
          waterAmount={waterAmount}
          onWaterAmountChange={setWaterAmount}
          maintenanceEnabled={maintenanceEnabled}
          onMaintenanceToggle={setMaintenanceEnabled}
          maintenanceAmount={maintenanceAmount}
          onMaintenanceAmountChange={setMaintenanceAmount}
          expenses={additionalExpenses}
          onAddExpense={(exp) => setAdditionalExpenses((prev) => [...prev, exp])}
          onUpdateExpense={(index, exp) =>
            setAdditionalExpenses((prev) => {
              const updated = [...prev]
              updated[index] = exp
              return updated
            })
          }
          onDeleteExpense={(index) =>
            setAdditionalExpenses((prev) => prev.filter((_, i) => i !== index))
          }
        />

        {/* Payment History & Settlements */}
        <PaymentHistoryList
          payments={payments}
          pendingAmount={totals.pendingAmount}
          onAddPayment={(payment) => setPayments((prev) => [...prev, payment])}
          onUpdatePayment={(index, payment) =>
            setPayments((prev) => {
              const updated = [...prev]
              updated[index] = payment
              return updated
            })
          }
          onDeletePayment={(index) =>
            setPayments((prev) => prev.filter((_, i) => i !== index))
          }
        />
      </main>

      {/* Share / Invoice Preview Modal */}
      {showShareModal && (
        <BillShareModal
          renter={renter}
          selectedMonth={selectedMonth}
          bill={compiledBillForShare}
          expenses={additionalExpenses.map((e) => ({
            id: e.id,
            monthly_bill_id: '',
            description: e.description,
            amount: e.amount,
            date: format(e.date, 'yyyy-MM-dd'),
          }))}
          payments={payments.map((p) => ({
            id: p.id,
            monthly_bill_id: '',
            amount: p.amount,
            payment_date: format(p.date, 'yyyy-MM-dd'),
            payment_type: p.type,
            note: p.note,
          }))}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}