'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Calculator, Send, Zap, Droplets, Settings, Home, Plus, X } from 'lucide-react'
import { Renter } from '@/types'
import { SupabaseService, MonthlyBill, AdditionalExpense as ServiceAdditionalExpense, BillPayment } from '@/services/supabaseService'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'

interface RenterProfileProps {
  renter: Renter
  onClose: () => void
}

interface Payment {
  id: string
  amount: number
  date: Date
  type: 'cash' | 'online'
  note?: string
}

interface AdditionalExpense {
  id: string
  description: string
  amount: number
  date: Date
}

export default function RenterProfile({ renter, onClose }: RenterProfileProps) {
  
  // Bill components state - Dynamic based on renter
  const [rentAmount, setRentAmount] = useState(renter.monthly_rent)
  const [electricityEnabled, setElectricityEnabled] = useState(false)
  const [electricityData, setElectricityData] = useState({
    initialReading: 0,
    finalReading: 0,
    multiplier: 9,
    readingDate: new Date()
  })
  
  const [motorEnabled, setMotorEnabled] = useState(false)
  const [motorData, setMotorData] = useState({
    initialReading: 0,
    finalReading: 0,
    multiplier: 9,
    numberOfPeople: 2,
    readingDate: new Date()
  })
  
  const [waterEnabled, setWaterEnabled] = useState(false)
  const [waterAmount, setWaterAmount] = useState(0)
  
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceAmount, setMaintenanceAmount] = useState(0)

  // Additional expenses - Start empty for each renter
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([])

  // Payments received - Start empty for each renter
  const [payments, setPayments] = useState<Payment[]>([])

  // Current month by default
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

  // Load bill data when month changes
  useEffect(() => {
    loadMonthlyBillData()
  }, [selectedMonth, renter.id])

  const loadMonthlyBillData = async () => {
    try {
      const month = selectedMonth.getMonth() + 1
      const year = selectedMonth.getFullYear()

      // Ensure all required values exist before making the API call
      if (!renter.id || month === undefined || year === undefined) {
        console.error('Missing required values:', { renterId: renter.id, month, year })
        return
      }

      // Try to load existing bill for this month
      const existingBill = await SupabaseService.getMonthlyBill(renter.id, month, year)
      
      if (existingBill) {
        // Load existing data
        setRentAmount(existingBill.rent_amount)
        setElectricityEnabled(existingBill.electricity_enabled)
        setElectricityData({
          initialReading: existingBill.electricity_initial_reading || 0,
          finalReading: existingBill.electricity_final_reading || 0,
          multiplier: existingBill.electricity_multiplier || 9,
          readingDate: existingBill.electricity_reading_date ? new Date(existingBill.electricity_reading_date) : new Date()
        })
        setMotorEnabled(existingBill.motor_enabled)
        setMotorData({
          initialReading: existingBill.motor_initial_reading || 0,
          finalReading: existingBill.motor_final_reading || 0,
          multiplier: existingBill.motor_multiplier || 9,
          numberOfPeople: existingBill.motor_number_of_people || 2,
          readingDate: existingBill.motor_reading_date ? new Date(existingBill.motor_reading_date) : new Date()
        })
        setWaterEnabled(existingBill.water_enabled)
        setWaterAmount(existingBill.water_amount)
        setMaintenanceEnabled(existingBill.maintenance_enabled)
        setMaintenanceAmount(existingBill.maintenance_amount)
        
        // Load additional expenses and payments
        const expenses = await SupabaseService.getAdditionalExpenses(existingBill.id!)
        const billPayments = await SupabaseService.getBillPayments(existingBill.id!)
        
        setAdditionalExpenses(expenses.map(exp => ({
          id: exp.id!,
          description: exp.description,
          amount: exp.amount,
          date: new Date(exp.date)
        })))
        
        setPayments(billPayments.map(payment => ({
          id: payment.id!,
          amount: payment.amount,
          date: new Date(payment.payment_date),
          type: payment.payment_type,
          note: payment.note
        })))
      } else {
        // Create fresh bill with carry-forward readings
        const previousBill = await SupabaseService.getPreviousMonthBill(renter.id, month, year)
        
        setRentAmount(renter.monthly_rent)
        setElectricityEnabled(false)
        setElectricityData({
          initialReading: previousBill?.electricity_final_reading || 0, // Carry forward
          finalReading: previousBill?.electricity_final_reading || 0,
          multiplier: 9,
          readingDate: new Date()
        })
        setMotorEnabled(false)
        setMotorData({
          initialReading: previousBill?.motor_final_reading || 0, // Carry forward
          finalReading: previousBill?.motor_final_reading || 0,
          multiplier: 9,
          numberOfPeople: 2,
          readingDate: new Date()
        })
        setWaterEnabled(false)
        setWaterAmount(0)
        setMaintenanceEnabled(false)
        setMaintenanceAmount(0)
        setAdditionalExpenses([])
        setPayments([])
      }
    } catch (error) {
      console.error('Error loading monthly bill data:', error)
    }
  }

  // Calculations
  const electricityAmount = electricityEnabled 
    ? (electricityData.finalReading - electricityData.initialReading) * electricityData.multiplier 
    : 0

  const motorAmount = motorEnabled 
    ? ((motorData.finalReading - motorData.initialReading) / motorData.numberOfPeople) * motorData.multiplier 
    : 0

  const additionalTotal = additionalExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  
  const totalAmount = rentAmount + electricityAmount + motorAmount + 
    (waterEnabled ? waterAmount : 0) + (maintenanceEnabled ? maintenanceAmount : 0) + additionalTotal
  
  const pendingAmount = totalAmount - totalPayments

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))
  }

  const generateBillSummary = () => {
    let summary = `BILL upto ${format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0), 'dd-MMM-yyyy')}\n\n`
    summary += `+ Rs ${Math.floor(rentAmount).toLocaleString('en-IN')} (rent)\n\n`
    
    if (electricityEnabled && electricityAmount > 0) {
      summary += `+ Rs ${Math.floor(electricityAmount).toLocaleString('en-IN')}\n`
      summary += `(Electricity {${electricityData.finalReading.toLocaleString('en-IN')}-${electricityData.initialReading.toLocaleString('en-IN')}}*${electricityData.multiplier}})\n`
      summary += `(Reading on ${format(electricityData.readingDate, 'd MMM yyyy')})\n\n`
    }
    
    if (motorEnabled && motorAmount > 0) {
      summary += `+ Rs ${Math.floor(motorAmount).toLocaleString('en-IN')}\n`
      summary += `(Motor {${motorData.finalReading.toLocaleString('en-IN')}-${motorData.initialReading.toLocaleString('en-IN')}}/${motorData.numberOfPeople}*${motorData.multiplier}})\n`
      summary += `(reading on ${format(motorData.readingDate, 'd MMM yyyy')})\n\n`
    }
    
    if (waterEnabled && waterAmount > 0) {
      summary += `+ Rs ${Math.floor(waterAmount).toLocaleString('en-IN')} (Water)\n\n`
    }
    
    if (maintenanceEnabled && maintenanceAmount > 0) {
      summary += `+ Rs ${Math.floor(maintenanceAmount).toLocaleString('en-IN')} (Maintenance)\n\n`
    }
    
    additionalExpenses.forEach(exp => {
      summary += `+ Rs ${Math.floor(exp.amount).toLocaleString('en-IN')} (${exp.description})\n\n`
    })
    
    summary += `Total Rs ${Math.floor(totalAmount).toLocaleString('en-IN')} pending\n\n`
    
    if (totalPayments > 0) {
      summary += `- RS ${Math.floor(totalPayments).toLocaleString('en-IN')} already given\n\n`
    }
    
    summary += `Pending ;- Rs ${Math.floor(pendingAmount).toLocaleString('en-IN')}"`
    
    return summary
  }

  const handleCalculateAndSave = async () => {
    try {
      const month = selectedMonth.getMonth() + 1
      const year = selectedMonth.getFullYear()

      // Ensure renter.id exists before proceeding
      if (!renter.id) {
        alert('Error: Renter ID is missing. Cannot save bill.')
        return
      }

      // Prepare monthly bill data
      const monthlyBill: MonthlyBill = {
        renter_id: renter.id,
        month,
        year,
        rent_amount: rentAmount || 0,
        
        electricity_enabled: electricityEnabled || false,
        electricity_initial_reading: electricityData.initialReading || 0,
        electricity_final_reading: electricityData.finalReading || 0,
        electricity_multiplier: electricityData.multiplier || 9,
        electricity_reading_date: electricityData.readingDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        electricity_amount: electricityAmount || 0,
        
        motor_enabled: motorEnabled || false,
        motor_initial_reading: motorData.initialReading || 0,
        motor_final_reading: motorData.finalReading || 0,
        motor_multiplier: motorData.multiplier || 9,
        motor_number_of_people: motorData.numberOfPeople || 2,
        motor_reading_date: motorData.readingDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        motor_amount: motorAmount || 0,
        
        water_enabled: waterEnabled || false,
        water_amount: waterAmount || 0,
        
        maintenance_enabled: maintenanceEnabled || false,
        maintenance_amount: maintenanceAmount || 0,
        
        total_amount: totalAmount || 0,
        total_payments: totalPayments || 0,
        pending_amount: pendingAmount || 0
      }
      
      // Save monthly bill
      const billId = await SupabaseService.saveMonthlyBill(monthlyBill)
      
      // Save additional expenses
      for (const expense of additionalExpenses) {
        if (!expense.id) { // Only save new expenses
          await SupabaseService.saveAdditionalExpense({
            monthly_bill_id: billId,
            description: expense.description,
            amount: expense.amount,
            date: expense.date.toISOString().split('T')[0]
          })
        }
      }
      
      // Save payments
      for (const payment of payments) {
        if (!payment.id) { // Only save new payments
          await SupabaseService.saveBillPayment({
            monthly_bill_id: billId,
            amount: payment.amount,
            payment_date: payment.date.toISOString().split('T')[0],
            payment_type: payment.type,
            note: payment.note
          })
        }
      }
      
      alert('Bill calculated and saved successfully!')
      
      // Reload data to get IDs for new items
      await loadMonthlyBillData()
    } catch (error) {
      console.error('Error saving bill:', error)
      alert('Error saving bill. Please try again.')
    }
  }

  const handleShareBill = () => {
    const billText = generateBillSummary()
    navigator.clipboard.writeText(billText)
    alert('Bill summary copied to clipboard!')
  }

  return (
    <>
      {/* Full screen backdrop */}
      <div className="fixed inset-0 bg-black z-[9998]" />
      
      {/* Main content */}
      <div className="fixed inset-0 bg-white z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
        {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-poppins">{renter.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
            <button onClick={previousMonth} className="p-1 hover:bg-white rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 px-3 min-w-[100px] text-center">
              {format(selectedMonth, 'MMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-white rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-70px)]">
        {/* Compact Bill Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl m-4 p-4 text-white shadow-lg flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-blue-100">Bill Summary</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCalculateAndSave}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Calculate & Save"
              >
                <Calculator className="h-4 w-4 text-blue-200 hover:text-white" />
              </button>
              <button
                onClick={handleShareBill}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Share Bill"
              >
                <Send className="h-4 w-4 text-blue-200 hover:text-white" />
              </button>
              <button
                onClick={handleShareBill}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Copy Bill"
              >
                <Copy className="h-4 w-4 text-blue-200 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Compact Bill Text */}
          <div className="bg-white/10 rounded-xl p-3 mb-3 font-mono text-xs leading-relaxed">
            <div className="text-white space-y-0.5">
              <div className="font-semibold">BILL upto {format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0), 'dd-MMM-yyyy')}</div>
              
              <div>+ Rs {Math.floor(rentAmount).toLocaleString('en-IN')} (rent)</div>
              
              {electricityEnabled && electricityAmount > 0 && (
                <div>
                  + Rs {Math.floor(electricityAmount).toLocaleString('en-IN')}
                  <br />
                  (Electricity {`{${electricityData.finalReading.toLocaleString('en-IN')}-${electricityData.initialReading.toLocaleString('en-IN')}}*${electricityData.multiplier}`})
                  <br />
                  (Reading on {format(electricityData.readingDate, 'd MMM yyyy')})
                </div>
              )}
              
              {motorEnabled && motorAmount > 0 && (
                <div>
                  + Rs {Math.floor(motorAmount).toLocaleString('en-IN')}
                  <br />
                  (Motor {`{${motorData.finalReading.toLocaleString('en-IN')}-${motorData.initialReading.toLocaleString('en-IN')}}/${motorData.numberOfPeople}*${motorData.multiplier}`})
                  <br />
                  (reading on {format(motorData.readingDate, 'd MMM yyyy')})
                </div>
              )}
              
              {waterEnabled && waterAmount > 0 && (
                <div>+ Rs {Math.floor(waterAmount).toLocaleString('en-IN')} (Water)</div>
              )}
              
              {maintenanceEnabled && maintenanceAmount > 0 && (
                <div>+ Rs {Math.floor(maintenanceAmount).toLocaleString('en-IN')} (Maintenance)</div>
              )}
              
              {additionalExpenses.map(expense => (
                <div key={expense.id}>+ Rs {Math.floor(expense.amount).toLocaleString('en-IN')} ({expense.description})</div>
              ))}
              
              <div className="font-bold text-yellow-300 mt-1">Total Rs {Math.floor(totalAmount).toLocaleString('en-IN')} pending</div>
              
              {totalPayments > 0 && (
                <div className="text-green-300">- RS {Math.floor(totalPayments).toLocaleString('en-IN')} already given</div>
              )}
              
              <div className="font-bold text-red-400 text-sm">Pending ;- Rs {Math.floor(pendingAmount).toLocaleString('en-IN')}&quot;</div>
            </div>
          </div>


        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 bg-white">
          {/* Rent Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-poppins">Rent</h3>
                <p className="text-sm text-gray-500 font-medium">Monthly base rent</p>
              </div>
            </div>
            <RentInput value={rentAmount} onChange={setRentAmount} />
          </div>

          {/* Utility Cards */}
          <UtilityCard
            title="Electricity"
            subtitle="Power consumption billing"
            icon={<Zap className="h-5 w-5 text-yellow-600" />}
            iconBg="bg-yellow-100"
            enabled={electricityEnabled}
            onToggle={setElectricityEnabled}
            amount={electricityAmount}
          >
            {electricityEnabled && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Initial Reading"
                    value={electricityData.initialReading}
                    onChange={(value) => setElectricityData({...electricityData, initialReading: value})}
                  />
                  <InputField
                    label="Final Reading"
                    value={electricityData.finalReading}
                    onChange={(value) => setElectricityData({...electricityData, finalReading: value})}
                  />
                </div>
                <InputField
                  label="Rate per unit"
                  value={electricityData.multiplier}
                  onChange={(value) => setElectricityData({...electricityData, multiplier: value})}
                  className="w-24"
                />
              </div>
            )}
          </UtilityCard>

          <UtilityCard
            title="Motor"
            subtitle="Water pump charges"
            icon={<Settings className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100"
            enabled={motorEnabled}
            onToggle={setMotorEnabled}
            amount={motorAmount}
          >
            {motorEnabled && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Initial Reading"
                    value={motorData.initialReading}
                    onChange={(value) => setMotorData({...motorData, initialReading: value})}
                  />
                  <InputField
                    label="Final Reading"
                    value={motorData.finalReading}
                    onChange={(value) => setMotorData({...motorData, finalReading: value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Rate per unit"
                    value={motorData.multiplier}
                    onChange={(value) => setMotorData({...motorData, multiplier: value})}
                  />
                  <InputField
                    label="No. of People"
                    value={motorData.numberOfPeople}
                    onChange={(value) => setMotorData({...motorData, numberOfPeople: value})}
                  />
                </div>
              </div>
            )}
          </UtilityCard>

          <UtilityCard
            title="Water"
            subtitle="Water supply charges"
            icon={<Droplets className="h-5 w-5 text-cyan-600" />}
            iconBg="bg-cyan-100"
            enabled={waterEnabled}
            onToggle={setWaterEnabled}
            amount={waterAmount}
          >
            {waterEnabled && (
              <div className="mt-4">
                <InputField
                  label="Amount"
                  value={waterAmount}
                  onChange={setWaterAmount}
                />
              </div>
            )}
          </UtilityCard>

          <UtilityCard
            title="Maintenance"
            subtitle="Property maintenance fees"
            icon={<Settings className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-100"
            enabled={maintenanceEnabled}
            onToggle={setMaintenanceEnabled}
            amount={maintenanceAmount}
          >
            {maintenanceEnabled && (
              <div className="mt-4">
                <InputField
                  label="Amount"
                  value={maintenanceAmount}
                  onChange={setMaintenanceAmount}
                />
              </div>
            )}
          </UtilityCard>

          {/* Additional Expenses */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 font-poppins">Additional Expenses</h3>
              <button
                onClick={() => setShowAddExpense(true)}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4 text-blue-600" />
              </button>
            </div>
            {additionalExpenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-700">{expense.description}</span>
                <span className="text-sm font-semibold text-gray-900">{formatIndianCurrency(expense.amount)}</span>
              </div>
            ))}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 font-poppins">Payment History</h3>
              <button
                onClick={() => setShowAddPayment(true)}
                className="p-2 bg-green-100 hover:bg-green-200 rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4 text-green-600" />
              </button>
            </div>
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatIndianCurrency(payment.amount)}</p>
                  <p className="text-xs text-gray-500">{format(payment.date, 'dd MMM yyyy')} • {payment.type}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                  Received
                </span>
              </div>
            ))}
          </div>

          <div className="h-6"></div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onAdd={(expense) => {
            setAdditionalExpenses([...additionalExpenses, { ...expense, id: Date.now().toString() }])
            setShowAddExpense(false)
          }}
        />
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <AddPaymentModal
          onClose={() => setShowAddPayment(false)}
          onAdd={(payment) => {
            setPayments([...payments, { ...payment, id: Date.now().toString() }])
            setShowAddPayment(false)
          }}
        />
      )}
      </div>
    </>
  )
}

// Utility Card Component (same as before)
interface UtilityCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  amount: number
  children?: React.ReactNode
}

function UtilityCard({ title, subtitle, icon, iconBg, enabled, onToggle, amount, children }: UtilityCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${iconBg} rounded-xl`}>
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 font-poppins">{title}</h3>
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {enabled && (
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatIndianCurrency(amount)}</p>
            </div>
          )}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-sm"></div>
          </label>
        </div>
      </div>
      
      {children}
    </div>
  )
}

// Rent Input Component
interface RentInputProps {
  value: number
  onChange: (value: number) => void
}

function RentInput({ value, onChange }: RentInputProps) {
  const [displayValue, setDisplayValue] = useState(formatInputValue(value))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove all non-numeric characters except decimal point
    const cleaned = inputValue.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    const sanitized = parts[0] + (parts.length > 1 ? '.' + parts[1] : '')
    
    // Update the actual numeric value
    const numValue = parseFloat(sanitized) || 0
    onChange(numValue)
    
    // Update display value with commas
    if (sanitized === '' || sanitized === '0') {
      setDisplayValue('')
    } else {
      // Format with Indian commas for display
      const integerPart = parts[0]
      const decimalPart = parts[1] ? '.' + parts[1] : ''
      const formattedInteger = parseInt(integerPart) ? parseInt(integerPart).toLocaleString('en-IN') : integerPart
      setDisplayValue(formattedInteger + decimalPart)
    }
  }

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(formatInputValue(value))
  }, [value])

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">₹</span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-gray-900 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        placeholder="Enter rent amount"
      />
    </div>
  )
}

// Input Field Component (same as before)
interface InputFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}

function InputField({ label, value, onChange, className = "w-full" }: InputFieldProps) {
  const [displayValue, setDisplayValue] = useState(formatInputValue(value))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove all non-numeric characters except decimal point
    const cleaned = inputValue.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    const sanitized = parts[0] + (parts.length > 1 ? '.' + parts[1] : '')
    
    // Update the actual numeric value
    const numValue = parseFloat(sanitized) || 0
    onChange(numValue)
    
    // Update display value with commas
    if (sanitized === '' || sanitized === '0') {
      setDisplayValue('')
    } else {
      // Format with Indian commas for display
      const integerPart = parts[0]
      const decimalPart = parts[1] ? '.' + parts[1] : ''
      const formattedInteger = parseInt(integerPart) ? parseInt(integerPart).toLocaleString('en-IN') : integerPart
      setDisplayValue(formattedInteger + decimalPart)
    }
  }

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(formatInputValue(value))
  }, [value])

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={`${className} px-3 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
        placeholder="Enter value"
      />
    </div>
  )
}

// Add Expense Modal
interface AddExpenseModalProps {
  onClose: () => void
  onAdd: (expense: { description: string; amount: number; date: Date }) => void
}

function AddExpenseModal({ onClose, onAdd }: AddExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description.trim() && amount > 0) {
      onAdd({
        description: description.trim(),
        amount: amount,
        date: new Date()
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Add Expense</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., aunti ko diye"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="text"
                value={formatInputValue(amount)}
                onChange={(e) => handleIndianNumberInput(e.target.value, setAmount)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Payment Modal
interface AddPaymentModalProps {
  onClose: () => void
  onAdd: (payment: { amount: number; date: Date; type: 'cash' | 'online'; note?: string }) => void
}

function AddPaymentModal({ onClose, onAdd }: AddPaymentModalProps) {
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'cash' | 'online'>('cash')
  const [note, setNote] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount > 0) {
      onAdd({
        amount: amount,
        date: new Date(),
        type,
        note: note.trim() || undefined
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Add Payment</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="text"
                value={formatInputValue(amount)}
                onChange={(e) => handleIndianNumberInput(e.target.value, setAmount)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter amount received"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cash"
                  checked={type === 'cash'}
                  onChange={(e) => setType(e.target.value as 'cash')}
                  className="mr-2"
                />
                Cash
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="online"
                  checked={type === 'online'}
                  onChange={(e) => setType(e.target.value as 'online')}
                  className="mr-2"
                />
                Online
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Partial payment"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}