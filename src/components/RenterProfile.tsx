'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Calculator, Send, Zap, Droplets, Settings, Home, Plus, X, Archive, Trash2, Eye, EyeOff } from 'lucide-react'
import { Renter } from '@/types'
import { ApiService, MonthlyBill } from '@/services/apiService'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import html2canvas from 'html2canvas'
import { billCache as sharedBillCache, MonthData } from '@/utils/billCache'

interface RenterProfileProps {
  renter: Renter
  onClose: () => void
  onArchive?: (renterId: string) => void
  onUnarchive?: (renterId: string) => void
  onDelete?: (renterId: string) => void
}

interface Payment {
  id?: string
  amount: number
  date: Date
  type: 'cash' | 'online'
  note?: string
}

interface AdditionalExpense {
  id?: string
  description: string
  amount: number
  date: Date
}

export default function RenterProfile({ renter, onClose, onArchive, onUnarchive, onDelete }: RenterProfileProps) {

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
  const [showActions, setShowActions] = useState(false)
  const [editingExpense, setEditingExpense] = useState<AdditionalExpense | null>(null)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  // Ref for bill summary to capture as image
  const billSummaryRef = useRef<HTMLDivElement>(null)

  // Toggle for bill summary visibility
  const [showBillSummary, setShowBillSummary] = useState(true)

  // BillCache instance for caching month data


  // Track if data is stale for UI indication
  const [isDataStale, setIsDataStale] = useState(false)

  // Track saving state for optimistic UI
  const [isSaving, setIsSaving] = useState(false)

  // Track loading state for better UX
  const [isLoading, setIsLoading] = useState(false)

  // Track active request to prevent race conditions
  const activeRequestRef = useRef<string>('')

  // Load bill data when component mounts


  // When month changes, use cache-first strategy with loading state
  useEffect(() => {
    if (renter.id && selectedMonth) {
      const month = selectedMonth.getMonth() + 1
      const year = selectedMonth.getFullYear()
      const billCache = sharedBillCache

      // Check cache first - instant display
      const cached = billCache.get(renter.id, month, year)
      if (cached) {
        // Apply immediately - synchronous, no delay
        applyMonthData(cached)

        // Check if data is stale
        const stale = billCache.isStale(renter.id, month, year)
        setIsDataStale(stale)

        // If stale, reload in background
        if (stale) {
          loadMonthlyBillData(true).then(() => {
            setIsDataStale(false)
          })
        } else {
          // Trigger preload of adjacent months
          billCache.preload(renter.id, month, year, renter.monthly_rent)
        }
      } else {
        // Cache miss - show optimistic empty data
        setIsDataStale(false)

        // Use optimistic data but DON'T show full loading skeleton if we can avoid it
        // actually for cache miss we usually want skeleton unless we are very confident
        const optimisticData: MonthData = {
          rentAmount: renter.monthly_rent,
          electricityEnabled: false,
          electricityData: {
            initialReading: 0,
            finalReading: 0,
            multiplier: 9,
            readingDate: new Date()
          },
          motorEnabled: false,
          motorData: {
            initialReading: 0,
            finalReading: 0,
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

        // Apply optimistic data immediately for instant UI
        applyMonthData(optimisticData)

        // Then load real data
        loadMonthlyBillData(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, renter.id])

  const loadMonthlyBillData = async (suppressLoading = false) => {
    const month = selectedMonth.getMonth() + 1
    const year = selectedMonth.getFullYear()
    const billCache = sharedBillCache

    // Generate request ID
    const requestId = `${renter.id}-${year}-${month}`
    activeRequestRef.current = requestId

    try {
      if (!suppressLoading) setIsLoading(true)

      // Ensure all required values exist before making the API call
      if (!renter.id || month === undefined || year === undefined) {
        console.error('Missing required values:', { renterId: renter.id, month, year })
        return
      }

      // Use optimized RPC function - single query instead of 3!
      const billWithDetails = await ApiService.getBillWithDetails(renter.id, month, year)

      let billData: MonthData

      if (billWithDetails?.bill) {
        // Bill exists - use the data from RPC
        const existingBill = billWithDetails.bill

        billData = {
          rentAmount: existingBill.rent_amount,
          electricityEnabled: existingBill.electricity_enabled,
          electricityData: {
            initialReading: existingBill.electricity_initial_reading || 0,
            finalReading: existingBill.electricity_final_reading || 0,
            multiplier: existingBill.electricity_multiplier || 9,
            readingDate: existingBill.electricity_reading_date ? new Date(existingBill.electricity_reading_date) : new Date()
          },
          motorEnabled: existingBill.motor_enabled,
          motorData: {
            initialReading: existingBill.motor_initial_reading || 0,
            finalReading: existingBill.motor_final_reading || 0,
            multiplier: existingBill.motor_multiplier || 9,
            numberOfPeople: existingBill.motor_number_of_people || 2,
            readingDate: existingBill.motor_reading_date ? new Date(existingBill.motor_reading_date) : new Date()
          },
          waterEnabled: existingBill.water_enabled,
          waterAmount: existingBill.water_amount,
          maintenanceEnabled: existingBill.maintenance_enabled,
          maintenanceAmount: existingBill.maintenance_amount,
          additionalExpenses: billWithDetails.expenses.map(exp => ({
            id: exp.id!,
            description: exp.description,
            amount: exp.amount,
            date: new Date(exp.date)
          })),
          payments: billWithDetails.payments.map(payment => ({
            id: payment.id!,
            amount: payment.amount,
            date: new Date(payment.payment_date),
            type: payment.payment_type,
            note: payment.note
          }))
        }
      } else {
        // Create fresh bill with carry-forward readings from RPC
        billData = {
          rentAmount: renter.monthly_rent,
          electricityEnabled: false,
          electricityData: {
            initialReading: billWithDetails?.previous_readings?.electricity_final || 0,
            finalReading: billWithDetails?.previous_readings?.electricity_final || 0,
            multiplier: 9,
            readingDate: new Date()
          },
          motorEnabled: false,
          motorData: {
            initialReading: billWithDetails?.previous_readings?.motor_final || 0,
            finalReading: billWithDetails?.previous_readings?.motor_final || 0,
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

        // Auto Carry Forward: Add previous month's pending debt as expense
        const prevPending = billWithDetails?.previous_readings?.pending_amount || 0
        if (prevPending > 0) {
          const prevDate = new Date(year, month - 2, 1)
          const prevMonthName = prevDate.toLocaleString('default', { month: 'long' })

          billData.additionalExpenses.push({
            id: `temp-${Date.now()}`,
            description: `${prevMonthName} Left`,
            amount: prevPending,
            date: new Date()
          })
        }
      }

      // Verify request is still active
      if (activeRequestRef.current !== requestId) {
        console.log('Ignoring stale response for', requestId)
        return
      }

      // Apply the loaded data to state
      applyMonthData(billData)

      // Cache the loaded data
      billCache.set(renter.id, month, year, billData)

      // Trigger preload of adjacent months in background
      billCache.preload(renter.id, month, year, renter.monthly_rent)
    } catch (error) {
      console.error('Error loading monthly bill data:', error)
      // Don't cache failed requests to prevent repeated errors
      return
    } finally {
      setIsLoading(false)
    }
  }

  // Apply cached data to state
  const applyMonthData = (data: MonthData) => {
    setRentAmount(data.rentAmount)
    setElectricityEnabled(data.electricityEnabled)
    setElectricityData(data.electricityData)
    setMotorEnabled(data.motorEnabled)
    setMotorData(data.motorData)
    setWaterEnabled(data.waterEnabled)
    setWaterAmount(data.waterAmount)
    setMaintenanceEnabled(data.maintenanceEnabled)
    setMaintenanceAmount(data.maintenanceAmount)
    setAdditionalExpenses(data.additionalExpenses)
    setPayments(data.payments)
  }



  // Calculations - Memoized for performance
  const electricityAmount = useMemo(() => electricityEnabled
    ? (electricityData.finalReading - electricityData.initialReading) * electricityData.multiplier
    : 0, [electricityEnabled, electricityData.finalReading, electricityData.initialReading, electricityData.multiplier])

  const motorAmount = useMemo(() => motorEnabled
    ? ((motorData.finalReading - motorData.initialReading) / motorData.numberOfPeople) * motorData.multiplier
    : 0, [motorEnabled, motorData.finalReading, motorData.initialReading, motorData.numberOfPeople, motorData.multiplier])

  const additionalTotal = useMemo(() =>
    additionalExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [additionalExpenses])

  const totalPayments = useMemo(() =>
    payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments])

  const totalAmount = useMemo(() =>
    rentAmount + electricityAmount + motorAmount +
    (waterEnabled ? waterAmount : 0) + (maintenanceEnabled ? maintenanceAmount : 0) + additionalTotal,
    [rentAmount, electricityAmount, motorAmount, waterEnabled, waterAmount, maintenanceEnabled, maintenanceAmount, additionalTotal])

  const pendingAmount = useMemo(() =>
    totalAmount - totalPayments,
    [totalAmount, totalPayments])

  const previousMonth = () => {
    const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1)
    setSelectedMonth(newMonth)
  }

  const nextMonth = () => {
    const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)
    setSelectedMonth(newMonth)
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
    const month = selectedMonth.getMonth() + 1
    const year = selectedMonth.getFullYear()

    // Ensure renter.id exists before proceeding
    if (!renter.id) {
      alert('Error: Renter ID is missing. Cannot save bill.')
      return
    }

    // 1. Show immediate visual feedback (saving indicator)
    setIsSaving(true)

    // 2. Create optimistic data snapshot
    const optimisticData: MonthData = {
      rentAmount,
      electricityEnabled,
      electricityData,
      motorEnabled,
      motorData,
      waterEnabled,
      waterAmount,
      maintenanceEnabled,
      maintenanceAmount,
      additionalExpenses,
      payments
    }

    // 3. Update cache with optimistic data immediately
    const billCache = sharedBillCache
    billCache.set(renter.id, month, year, optimisticData)

    try {
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

      // Prepare expenses and payments for batch save
      const expensesToSave = additionalExpenses.map(expense => ({
        id: expense.id,
        monthly_bill_id: '', // Will be set by RPC function
        description: expense.description,
        amount: expense.amount,
        date: expense.date.toISOString().split('T')[0]
      }))

      const paymentsToSave = payments.map(payment => ({
        id: payment.id,
        monthly_bill_id: '', // Will be set by RPC function
        amount: payment.amount,
        payment_date: payment.date.toISOString().split('T')[0],
        payment_type: payment.type,
        note: payment.note
      }))

      // 4. Save to database in background using batch operation
      const result = await ApiService.saveBillComplete(
        monthlyBill,
        expensesToSave,
        paymentsToSave
      )

      // 5. Update local IDs from server response
      if (result.success) {
        // Update expense IDs
        const updatedExpenses = additionalExpenses.map((expense, index) => ({
          ...expense,
          id: result.expense_ids[index] || expense.id
        }))
        setAdditionalExpenses(updatedExpenses)

        // Update payment IDs
        const updatedPayments = payments.map((payment, index) => ({
          ...payment,
          id: result.payment_ids[index] || payment.id
        }))
        setPayments(updatedPayments)

        // Update cache with correct IDs
        const updatedData: MonthData = {
          ...optimisticData,
          additionalExpenses: updatedExpenses,
          payments: updatedPayments
        }
        billCache.set(renter.id, month, year, updatedData)

        // Show success
        setIsSaving(false)
        alert('Saved!')
      }

    } catch (error) {
      console.error('Error saving bill:', error)

      // 6. Rollback on error: invalidate cache and reload from database
      billCache.invalidate(renter.id, month, year)

      try {
        await loadMonthlyBillData()
      } catch (reloadError) {
        console.error('Error reloading data after save failure:', reloadError)
      }

      setIsSaving(false)

      // Display user-friendly error message with retry option
      const retry = window.confirm(
        'Failed to save bill. The data has been restored to the last saved state.\n\nWould you like to try saving again?'
      )

      if (retry) {
        // Retry the save operation
        handleCalculateAndSave()
      }
    }
  }

  const handleShareBill = async () => {
    if (!billSummaryRef.current) return

    try {
      // Capture the bill summary as an image with better compatibility
      const canvas = await html2canvas(billSummaryRef.current, {
        backgroundColor: '#ffffff', // White background for the bill
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
      })

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to create image')
          return
        }

        try {
          // Try to copy to clipboard first (works on most modern browsers)
          if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': blob })
            await navigator.clipboard.write([item])
            alert('Bill image copied to clipboard! You can now paste it in WhatsApp or any chat.')
          } else {
            // Fallback: Try Web Share API
            const file = new File([blob], `bill-${renter.name.replace(/\s+/g, '-')}-${format(selectedMonth, 'MMM-yyyy')}.png`, {
              type: 'image/png',
            })

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `Bill for ${renter.name}`,
                text: `Bill summary for ${format(selectedMonth, 'MMMM yyyy')}`,
              })
            } else {
              // Final fallback: Download the image
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = file.name
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
              alert('Bill image downloaded! You can find it in your downloads folder.')
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // User cancelled share, do nothing
            return
          }

          console.error('Share/Copy error:', error)

          // Final fallback: Download the image
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `bill-${renter.name.replace(/\s+/g, '-')}-${format(selectedMonth, 'MMM-yyyy')}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          alert('Bill image downloaded! You can find it in your downloads folder.')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error capturing bill:', error)
      alert(`Failed to capture bill image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      {/* Full screen backdrop */}
      <div className="fixed inset-0 bg-black z-[9998]" />

      {/* Main content */}
      <div className="fixed inset-0 bg-white z-[9999] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-gray-900 font-poppins">{renter.name}</h1>
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showActions ? "Hide actions" : "Show actions"}
                >
                  {showActions ? (
                    <EyeOff className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
              <button
                onClick={previousMonth}
                className="p-1 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-800 px-3 min-w-[100px] text-center">
                {format(selectedMonth, 'MMM yyyy')}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Archive and Delete buttons - only show when showActions is true */}
          {showActions && (
            <div className="flex items-center justify-end space-x-2">
              {renter.is_active ? (
                <button
                  onClick={() => {
                    if (onArchive && renter.id) {
                      if (window.confirm(`Archive ${renter.name}? You can unarchive them later.`)) {
                        onArchive(renter.id.toString())
                        onClose()
                      }
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <Archive className="h-4 w-4" />
                  <span>Archive</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onUnarchive && renter.id) {
                      onUnarchive(renter.id.toString())
                      onClose()
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  <Archive className="h-4 w-4" />
                  <span>Unarchive</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (onDelete && renter.id) {
                    if (window.confirm(`Delete ${renter.name}? This action cannot be undone!`)) {
                      onDelete(renter.id.toString())
                      onClose()
                    }
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </header>

        <div className="flex flex-col h-[calc(100vh-70px)]">
          {/* Compact Bill Summary */}
          <div className="rounded-2xl m-4 p-4 text-white shadow-lg flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-medium text-blue-100">Bill Summary</h2>
                <button
                  onClick={() => setShowBillSummary(!showBillSummary)}
                  className="p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title={showBillSummary ? "Hide Bill Summary" : "Show Bill Summary"}
                >
                  {showBillSummary ? (
                    <ChevronLeft className="h-4 w-4 text-white" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCalculateAndSave}
                  disabled={isSaving}
                  className={`p-1.5 rounded-lg transition-colors ${isSaving
                    ? 'bg-white/10 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30'
                    }`}
                  title={isSaving ? "Saving..." : "Calculate & Save"}
                >
                  <Calculator className={`h-4 w-4 ${isSaving
                    ? 'text-blue-300 animate-pulse'
                    : 'text-blue-200 hover:text-white'
                    }`} />
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

            {/* Compact Bill Text - Collapsible */}
            {showBillSummary && (
              <div ref={billSummaryRef} className="rounded-xl p-4" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                <div className="space-y-2">
                  {/* Header */}
                  <div className="text-lg font-bold text-center mb-3" style={{ color: '#1f2937' }}>
                    BILL upto {format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0), 'dd-MMM-yyyy')}
                    {isSaving && (
                      <div className="text-xs text-blue-600 font-normal mt-1 animate-pulse">
                        Saving...
                      </div>
                    )}
                    {!isSaving && isDataStale && (
                      <div className="text-xs text-yellow-600 font-normal mt-1">
                        (Data may be outdated - refreshing...)
                      </div>
                    )}
                  </div>

                  {/* Line items */}
                  <div className="space-y-1 text-sm" style={{ color: '#374151' }}>
                    <div>+ Rs {Math.floor(rentAmount).toLocaleString('en-IN')} (rent)</div>

                    {electricityEnabled && electricityAmount > 0 && (
                      <div>
                        + Rs {Math.floor(electricityAmount).toLocaleString('en-IN')}
                        <div className="text-xs ml-3">
                          (Electricity {`{${electricityData.finalReading.toLocaleString('en-IN')}-${electricityData.initialReading.toLocaleString('en-IN')}}*${electricityData.multiplier}`})
                        </div>
                      </div>
                    )}

                    {motorEnabled && motorAmount > 0 && (
                      <div>
                        + Rs {Math.floor(motorAmount).toLocaleString('en-IN')}
                        <div className="text-xs ml-3">
                          (Motor {`{${motorData.finalReading.toLocaleString('en-IN')}-${motorData.initialReading.toLocaleString('en-IN')}}/${motorData.numberOfPeople}*${motorData.multiplier}`})
                        </div>
                      </div>
                    )}

                    {waterEnabled && waterAmount > 0 && (
                      <div>+ Rs {Math.floor(waterAmount).toLocaleString('en-IN')} (Water)</div>
                    )}

                    {maintenanceEnabled && maintenanceAmount > 0 && (
                      <div>+ Rs {Math.floor(maintenanceAmount).toLocaleString('en-IN')} (Maintenance)</div>
                    )}

                    {additionalExpenses.map((expense, index) => (
                      <div key={expense.id || `expense-summary-${index}`}>+ Rs {Math.floor(expense.amount).toLocaleString('en-IN')} ({expense.description})</div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t my-2" style={{ borderColor: '#d1d5db' }}></div>

                  {/* Summary section */}
                  <div className="space-y-1 text-base">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>Rs {Math.floor(totalAmount).toLocaleString('en-IN')}</span>
                    </div>

                    {totalPayments > 0 && (
                      <div className="flex justify-between" style={{ color: '#059669' }}>
                        <span>Paid:</span>
                        <span>Rs {Math.floor(totalPayments).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-lg pt-1" style={{ color: '#dc2626' }}>
                      <span>Pending:</span>
                      <span>Rs {Math.floor(pendingAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      onChange={(value) => setElectricityData({ ...electricityData, initialReading: value })}
                    />
                    <InputField
                      label="Final Reading"
                      value={electricityData.finalReading}
                      onChange={(value) => setElectricityData({ ...electricityData, finalReading: value })}
                    />
                  </div>
                  <InputField
                    label="Rate per unit"
                    value={electricityData.multiplier}
                    onChange={(value) => setElectricityData({ ...electricityData, multiplier: value })}
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
                      onChange={(value) => setMotorData({ ...motorData, initialReading: value })}
                    />
                    <InputField
                      label="Final Reading"
                      value={motorData.finalReading}
                      onChange={(value) => setMotorData({ ...motorData, finalReading: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Rate per unit"
                      value={motorData.multiplier}
                      onChange={(value) => setMotorData({ ...motorData, multiplier: value })}
                    />
                    <InputField
                      label="No. of People"
                      value={motorData.numberOfPeople}
                      onChange={(value) => setMotorData({ ...motorData, numberOfPeople: value })}
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
              {additionalExpenses.map((expense, index) => (
                <div
                  key={expense.id || `expense-${index}`}
                  onClick={() => setEditingExpense(expense)}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors rounded px-2"
                >
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
              {payments.map((payment, index) => (
                <div
                  key={payment.id || `payment-${index}`}
                  onClick={() => setEditingPayment(payment)}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors rounded px-2"
                >
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
              setAdditionalExpenses([...additionalExpenses, expense]) // Don't assign temporary ID
              setShowAddExpense(false)
            }}
          />
        )}

        {/* Add Payment Modal */}
        {showAddPayment && (
          <AddPaymentModal
            onClose={() => setShowAddPayment(false)}
            onAdd={(payment) => {
              setPayments([...payments, payment]) // Don't assign temporary ID
              setShowAddPayment(false)
            }}
          />
        )}

        {/* Edit/Delete Expense Modal */}
        {editingExpense && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
            onClick={() => setEditingExpense(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Expense</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setAdditionalExpenses(additionalExpenses.map(e =>
                        e.id === editingExpense.id ? editingExpense : e
                      ))
                      setEditingExpense(null)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this expense?')) {
                        setAdditionalExpenses(additionalExpenses.filter(e => e.id !== editingExpense.id))
                        setEditingExpense(null)
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Delete Payment Modal */}
        {editingPayment && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
            onClick={() => setEditingPayment(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={editingPayment.amount}
                    onChange={(e) => setEditingPayment({ ...editingPayment, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={format(editingPayment.date, 'yyyy-MM-dd')}
                    onChange={(e) => setEditingPayment({ ...editingPayment, date: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingPayment.type}
                    onChange={(e) => setEditingPayment({ ...editingPayment, type: e.target.value as 'cash' | 'online' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setPayments(payments.map(p =>
                        p.id === editingPayment.id ? editingPayment : p
                      ))
                      setEditingPayment(null)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this payment?')) {
                        setPayments(payments.filter(p => p.id !== editingPayment.id))
                        setEditingPayment(null)
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
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
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
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
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
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