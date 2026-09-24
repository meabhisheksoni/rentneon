'use client'

import React, { useRef, useState } from 'react'
import { format } from 'date-fns'
import { Send, Copy, Download, Check, X, Printer, Receipt, CheckCircle2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { Renter, MonthlyBillData, AdditionalExpenseData, BillPaymentData } from '@/types'
import { formatIndianCurrency } from '@/utils/formatters'
import { generateWhatsAppBillMessage, getMonthName } from '@/utils/billingCalculations'
import { useToast } from '@/contexts/ToastContext'

interface BillShareModalProps {
  renter: Renter
  selectedMonth: Date
  bill: MonthlyBillData
  expenses: AdditionalExpenseData[]
  payments: BillPaymentData[]
  onClose: () => void
}

export const BillShareModal: React.FC<BillShareModalProps> = ({
  renter,
  selectedMonth,
  bill,
  expenses,
  payments,
  onClose,
}) => {
  const { success, error } = useToast()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const month = selectedMonth.getMonth() + 1
  const year = selectedMonth.getFullYear()

  const messageText = generateWhatsAppBillMessage({
    renterName: renter.name,
    month,
    year,
    bill,
    expenses,
    payments,
    propertyAddress: renter.property_address,
  })

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      success('Invoice summary copied to clipboard!', 'Copied')
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy text', err)
      error('Failed to copy to clipboard', 'Error')
    }
  }

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(messageText)
    const phone = renter.phone?.replace(/[^0-9]/g, '') || ''
    const url = phone.length >= 10 ? `https://wa.me/91${phone.slice(-10)}?text=${encoded}` : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return
    setIsCapturing(true)
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `RentBill_${renter.name.replace(/\s+/g, '_')}_${getMonthName(month)}_${year}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      success('High-resolution invoice saved!', 'Downloaded')
    } catch (err) {
      console.error('Failed to generate image', err)
      error('Failed to export invoice PNG', 'Export Error')
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Share Rent & Utility Invoice</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {renter.name} • {format(selectedMonth, 'MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            WhatsApp
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-2xl font-bold text-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 rounded-2xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isCapturing ? 'Saving...' : 'Save PNG'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 px-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-2xl font-bold text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>

        {/* Printable Visual Invoice Preview */}
        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 max-h-[440px] overflow-y-auto">
          <div
            ref={invoiceRef}
            className="printable-invoice bg-white p-6 rounded-xl border border-gray-200/80 shadow-xs space-y-5 text-gray-800"
          >
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  RENTAL INVOICE
                </span>
                <h4 className="text-xl font-black text-gray-900 mt-2 tracking-tight">{renter.name}</h4>
                {renter.property_address && (
                  <p className="text-xs text-gray-500 mt-0.5">{renter.property_address}</p>
                )}
                {renter.phone && (
                  <p className="text-xs text-gray-500">Phone: {renter.phone}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BILLING PERIOD</span>
                <p className="text-sm font-extrabold text-gray-900">{format(selectedMonth, 'MMMM yyyy')}</p>
                <p className="text-[10px] text-gray-400 mt-1">Generated {format(new Date(), 'dd MMM yyyy')}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Monthly Base Rent</span>
                <span className="font-bold text-gray-900">{formatIndianCurrency(bill.rent_amount)}</span>
              </div>

              {bill.electricity_enabled && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-700">Electricity Sub-Meter</span>
                    <p className="text-[11px] text-gray-500">
                      Reading: {bill.electricity_initial_reading} ➔ {bill.electricity_final_reading} (
                      {Math.max(0, bill.electricity_final_reading - bill.electricity_initial_reading)} units @ ₹
                      {bill.electricity_multiplier}/unit)
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">{formatIndianCurrency(bill.electricity_amount)}</span>
                </div>
              )}

              {bill.motor_enabled && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-700">Shared Water Pump Motor</span>
                    <p className="text-[11px] text-gray-500">
                      {Math.max(0, bill.motor_final_reading - bill.motor_initial_reading)} units split across {bill.motor_number_of_people} people
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">{formatIndianCurrency(bill.motor_amount)}</span>
                </div>
              )}

              {bill.water_enabled && Number(bill.water_amount) > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Fixed Water Charges</span>
                  <span className="font-bold text-gray-900">{formatIndianCurrency(bill.water_amount)}</span>
                </div>
              )}

              {bill.maintenance_enabled && Number(bill.maintenance_amount) > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Building Maintenance</span>
                  <span className="font-bold text-gray-900">{formatIndianCurrency(bill.maintenance_amount)}</span>
                </div>
              )}

              {expenses.map((exp, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-700">{exp.description}</span>
                    <span className="text-[10px] text-gray-400 ml-2">({exp.date})</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatIndianCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>

            {/* Totals & Net Due */}
            <div className="pt-3 border-t-2 border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-700">Total Billed:</span>
                <span className="font-bold text-gray-900">{formatIndianCurrency(bill.total_amount)}</span>
              </div>

              {payments.length > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Paid Settlements:</span>
                  <span className="font-bold">- {formatIndianCurrency(bill.total_payments)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2.5 border-t border-gray-200">
                <span className="font-black text-sm text-gray-900">
                  {bill.pending_amount > 0 ? 'Outstanding Balance Due:' : 'Status:'}
                </span>
                <span className={`text-xl font-black ${
                  bill.pending_amount > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {bill.pending_amount > 0 ? formatIndianCurrency(bill.pending_amount) : 'Fully Paid ✅'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
