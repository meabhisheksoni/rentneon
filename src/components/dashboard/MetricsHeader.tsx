'use client'

import React from 'react'
import { format } from 'date-fns'
import { Calendar, Users, IndianRupee, AlertCircle, Plus, CheckCircle2, TrendingUp } from 'lucide-react'
import { formatIndianCurrency } from '@/utils/formatters'

interface MetricsHeaderProps {
  totalRenters: number
  totalMonthlyRent: number
  pendingAmount: number
  selectedDate: Date
  onAddRenter: () => void
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  totalRenters,
  totalMonthlyRent,
  pendingAmount,
  selectedDate,
  onAddRenter,
}) => {
  const collectionRate =
    totalMonthlyRent > 0
      ? Math.max(0, Math.round(((totalMonthlyRent - Math.min(totalMonthlyRent, pendingAmount)) / totalMonthlyRent) * 100))
      : 100

  return (
    <div className="space-y-6">
      {/* Top Title & Add Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Property Dashboard</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <TrendingUp className="w-3 h-3" />
              {collectionRate}% Collected
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Billing Cycle Overview for <strong className="text-gray-700 font-semibold">{format(selectedDate, 'MMMM yyyy')}</strong>
          </p>
        </div>

        <button
          onClick={onAddRenter}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Tenant
        </button>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tenants */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-blue-200 transition-colors flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Active Tenants
            </span>
            <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">{totalRenters}</p>
            <span className="text-[11px] text-gray-500 font-medium">Occupied units</span>
          </div>
        </div>

        {/* Total Monthly Rent */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-200 transition-colors flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Monthly Rent
            </span>
            <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">
              {formatIndianCurrency(totalMonthlyRent)}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Expected revenue</span>
          </div>
        </div>

        {/* Total Outstanding Due */}
        <div className={`rounded-2xl p-5 border shadow-xs transition-colors flex items-center gap-4 ${
          pendingAmount > 0
            ? 'bg-red-50/40 border-red-200/80 hover:border-red-300'
            : 'bg-white border-gray-200/80 hover:border-emerald-200'
        }`}>
          <div className={`p-3.5 rounded-2xl ${
            pendingAmount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {pendingAmount > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              pendingAmount > 0 ? 'text-red-700' : 'text-gray-400'
            }`}>
              Pending Dues
            </span>
            <p className={`text-2xl font-black leading-tight mt-0.5 ${
              pendingAmount > 0 ? 'text-red-900' : 'text-gray-900'
            }`}>
              {formatIndianCurrency(pendingAmount)}
            </p>
            <span className={`text-[11px] font-medium ${
              pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {pendingAmount > 0 ? 'Action required' : 'All accounts settled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
