'use client'

import React from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Home, IndianRupee } from 'lucide-react'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'

interface BillOverviewCardProps {
  selectedMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  rentAmount: number
  onRentChange: (newAmount: number) => void
  totalAmount: number
  totalPaid: number
  pendingAmount: number
  isLoading?: boolean
  isDataStale?: boolean
}

export const BillOverviewCard: React.FC<BillOverviewCardProps> = ({
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  rentAmount,
  onRentChange,
  totalAmount,
  totalPaid,
  pendingAmount,
  isLoading = false,
  isDataStale = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          {isDataStale && (
            <span className="inline-block text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
              Updating cached data...
            </span>
          )}
        </div>

        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Base Rent & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Rent Input */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            <Home className="w-4 h-4 text-blue-600" />
            Monthly Base Rent
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input
              type="text"
              value={formatInputValue(rentAmount)}
              onChange={(e) => onRentChange(handleIndianNumberInput(e.target.value))}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="0"
            />
          </div>
        </div>

        {/* Total Billed Amount */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Bill</span>
            <IndianRupee className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatIndianCurrency(totalAmount)}
          </p>
          <span className="text-xs text-blue-600 font-medium">
            Rent + Utilities + Expenses
          </span>
        </div>

        {/* Pending Balance Due */}
        <div className={`rounded-lg p-4 border ${
          pendingAmount > 0
            ? 'bg-red-50 border-red-100'
            : 'bg-emerald-50 border-emerald-100'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${
              pendingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {pendingAmount > 0 ? 'Outstanding Due' : 'Status'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            pendingAmount > 0 ? 'text-red-900' : 'text-emerald-900'
          }`}>
            {pendingAmount > 0 ? formatIndianCurrency(pendingAmount) : 'Fully Paid ✅'}
          </p>
          <span className={`text-xs font-medium ${
            pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>
            Paid: {formatIndianCurrency(totalPaid)}
          </span>
        </div>
      </div>
    </div>
  )
}
