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
    <div className="bg-white rounded-3xl shadow-xs border border-gray-200/80 p-6 space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <button
          onClick={onPrevMonth}
          className="p-2.5 rounded-2xl hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          title="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          {isDataStale && (
            <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full mt-1 border border-amber-200">
              Updating cached data...
            </span>
          )}
          {isLoading && (
            <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mt-1 border border-blue-200">
              Loading bill data...
            </span>
          )}
        </div>

        <button
          onClick={onNextMonth}
          className="p-2.5 rounded-2xl hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          title="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Base Rent & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Rent Input */}
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/60">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            <Home className="w-4 h-4 text-blue-600" />
            Monthly Base Rent
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
            <input
              type="text"
              value={formatInputValue(rentAmount)}
              onChange={(e) => onRentChange(handleIndianNumberInput(e.target.value))}
              className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 text-base"
              placeholder="0"
            />
          </div>
        </div>

        {/* Total Billed Amount */}
        <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Billed</span>
            <IndianRupee className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 leading-tight">
            {formatIndianCurrency(totalAmount)}
          </p>
          <span className="text-xs text-blue-600 font-medium">
            Rent + Power + Utilities + Expenses
          </span>
        </div>

        {/* Pending Balance Due */}
        <div className={`rounded-2xl p-4 border ${
          pendingAmount > 0
            ? 'bg-red-50/60 border-red-200'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              pendingAmount > 0 ? 'text-red-800' : 'text-emerald-800'
            }`}>
              {pendingAmount > 0 ? 'Outstanding Due' : 'Status'}
            </span>
          </div>
          <p className={`text-2xl font-black leading-tight ${
            pendingAmount > 0 ? 'text-red-900' : 'text-emerald-900'
          }`}>
            {pendingAmount > 0 ? formatIndianCurrency(pendingAmount) : 'Fully Paid ✅'}
          </p>
          <span className={`text-xs font-medium ${
            pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>
            Paid Settlements: {formatIndianCurrency(totalPaid)}
          </span>
        </div>
      </div>
    </div>
  )
}
