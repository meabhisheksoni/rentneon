'use client'

import React from 'react'
import { format } from 'date-fns'
import { Calendar, Users, IndianRupee, AlertCircle, Plus, Home } from 'lucide-react'
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
  return (
    <div className="space-y-6">
      {/* Top Title & Add Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Property Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Billing Overview for {format(selectedDate, 'MMMM yyyy')}
          </p>
        </div>

        <button
          onClick={onAddRenter}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Tenant
        </button>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tenants */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Tenants
            </span>
            <p className="text-2xl font-black text-gray-900">{totalRenters}</p>
          </div>
        </div>

        {/* Total Monthly Rent */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Monthly Rent
            </span>
            <p className="text-2xl font-black text-gray-900">
              {formatIndianCurrency(totalMonthlyRent)}
            </p>
          </div>
        </div>

        {/* Total Outstanding Due */}
        <div className={`rounded-2xl p-5 border shadow-sm flex items-center gap-4 ${
          pendingAmount > 0 ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100'
        }`}>
          <div className={`p-3 rounded-xl ${
            pendingAmount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              pendingAmount > 0 ? 'text-red-700' : 'text-gray-400'
            }`}>
              Pending Dues
            </span>
            <p className={`text-2xl font-black ${
              pendingAmount > 0 ? 'text-red-900' : 'text-gray-900'
            }`}>
              {formatIndianCurrency(pendingAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
