'use client'

import React, { useRef, useState } from 'react'
import { format } from 'date-fns'
import { Send, Copy, Download, Check, X, Printer, MessageSquare, Zap, Droplets, Home, Receipt } from 'lucide-react'
import html2canvas from 'html2canvas'
import { Renter, MonthlyBillData, AdditionalExpenseData, BillPaymentData } from '@/types'
import { formatIndianCurrency } from '@/utils/formatters'
import { generateWhatsAppBillMessage, calculateElectricity, calculateMotor, getMonthName } from '@/utils/billingCalculations'

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
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(messageText)
    const phone = renter.phone?.replace(/[^0-9]/g, '') || ''
    const url = phone.length >= 10 ? `https://wa.me/91${phone.slice(-10)}?text=${encoded}` : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank')
  }

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return
    setIsCapturing(true)
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `RentBill_${renter.name.replace(/\s+/g, '_')}_${getMonthName(month)}_${year}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Failed to generate image', err)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Share Invoice & Bill Summary</h3>
            <p className="text-xs text-gray-500">
              {renter.name} • {format(selectedMonth, 'MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            Send via WhatsApp
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isCapturing ? 'Generating Image...' : 'Save PNG Invoice'}
          </button>
        </div>

        {/* Printable Visual Invoice Preview (Captured by html2canvas) */}
        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50/50 max-h-[420px] overflow-y-auto">
          <div
            ref={invoiceRef}
            className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-5 text-gray-800"
          >
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                  Rental Invoice
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-2">{renter.name}</h4>
                {renter.property_address && (
                  <p className="text-xs text-gray-500 mt-0.5">{renter.property_address}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400">BILLING CYCLE</span>
                <p className="text-sm font-bold text-gray-800">{format(selectedMonth, 'MMMM yyyy')}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="font-medium text-gray-700">Monthly Base Rent</span>
                <span className="font-semibold text-gray-900">{formatIndianCurrency(bill.rent_amount)}</span>
              </div>

              {bill.electricity_enabled && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <div>
                    <span className="font-medium text-gray-700">Electricity Sub-Meter</span>
                    <p className="text-[11px] text-gray-400">
                      Reading: {bill.electricity_initial_reading} ➔ {bill.electricity_final_reading} (
                      {Math.max(0, bill.electricity_final_reading - bill.electricity_initial_reading)} units @ ₹
                      {bill.electricity_multiplier})
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(bill.electricity_amount)}</span>
                </div>
              )}

              {bill.motor_enabled && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">Shared Water Pump Motor</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(bill.motor_amount)}</span>
                </div>
              )}

              {bill.water_enabled && bill.water_amount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">Water Charges</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(bill.water_amount)}</span>
                </div>
              )}

              {bill.maintenance_enabled && bill.maintenance_amount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">Building Maintenance</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(bill.maintenance_amount)}</span>
                </div>
              )}

              {expenses.map((exp, idx) => (
                <div key={idx} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">{exp.description}</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>

            {/* Totals & Net Due */}
            <div className="pt-3 border-t-2 border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-800">Total Billed:</span>
                <span className="font-bold text-gray-900">{formatIndianCurrency(bill.total_amount)}</span>
              </div>

              {payments.length > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Paid Settlements:</span>
                  <span className="font-semibold">- {formatIndianCurrency(bill.total_payments)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-sm text-red-600">Balance Outstanding Due:</span>
                <span className="text-xl font-extrabold text-red-600">
                  {formatIndianCurrency(bill.pending_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
