'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Settings, Plus, Trash2, Edit2, X, Receipt } from 'lucide-react'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import { calculateTotalExpenses } from '@/utils/billingCalculations'

export interface AdditionalExpense {
  id?: string
  description: string
  amount: number
  date: Date
}

interface ExpenseManagerProps {
  waterEnabled: boolean
  onWaterToggle: (enabled: boolean) => void
  waterAmount: number
  onWaterAmountChange: (amount: number) => void

  maintenanceEnabled: boolean
  onMaintenanceToggle: (enabled: boolean) => void
  maintenanceAmount: number
  onMaintenanceAmountChange: (amount: number) => void

  expenses: AdditionalExpense[]
  onAddExpense: (expense: AdditionalExpense) => void
  onUpdateExpense: (index: number, expense: AdditionalExpense) => void
  onDeleteExpense: (index: number) => void
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  waterEnabled,
  onWaterToggle,
  waterAmount,
  onWaterAmountChange,
  maintenanceEnabled,
  onMaintenanceToggle,
  maintenanceAmount,
  onMaintenanceAmountChange,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState(0)
  const [formDate, setFormDate] = useState<Date>(new Date())

  const openAddModal = () => {
    setEditingIndex(null)
    setFormDesc('')
    setFormAmount(0)
    setFormDate(new Date())
    setShowModal(true)
  }

  const openEditModal = (index: number, exp: AdditionalExpense) => {
    setEditingIndex(index)
    setFormDesc(exp.description)
    setFormAmount(exp.amount)
    setFormDate(new Date(exp.date))
    setShowModal(true)
  }

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDesc.trim() || formAmount <= 0) return

    const item: AdditionalExpense = {
      description: formDesc.trim(),
      amount: formAmount,
      date: formDate,
    }

    if (editingIndex !== null) {
      onUpdateExpense(editingIndex, item)
    } else {
      onAddExpense(item)
    }

    setShowModal(false)
  }

  const totalAdditional = calculateTotalExpenses(expenses)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Utilities & Additional Expenses</h3>
            <p className="text-xs text-gray-500">Fixed water/maintenance charges & one-off expenses</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Fixed Utilities (Water & Maintenance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        {/* Water Charge */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Fixed Water Bill</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={waterEnabled}
                onChange={(e) => onWaterToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          {waterEnabled && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monthly Amount (₹)</label>
              <input
                type="text"
                value={formatInputValue(waterAmount)}
                onChange={(e) => onWaterAmountChange(handleIndianNumberInput(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>
          )}
        </div>

        {/* Maintenance Charge */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Building Maintenance</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceEnabled}
                onChange={(e) => onMaintenanceToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          {maintenanceEnabled && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monthly Amount (₹)</label>
              <input
                type="text"
                value={formatInputValue(maintenanceAmount)}
                onChange={(e) => onMaintenanceAmountChange(handleIndianNumberInput(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Additional Expenses Line Items */}
      {expenses.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Custom Expense Items ({expenses.length})
          </h4>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {expenses.map((exp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{exp.description}</p>
                  <p className="text-xs text-gray-500">{format(new Date(exp.date), 'dd MMM yyyy')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-sm">
                    {formatIndianCurrency(exp.amount)}
                  </span>
                  <button
                    onClick={() => openEditModal(idx, exp)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteExpense(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-right text-xs font-medium text-gray-600">
            Total Custom Expenses: <strong className="text-gray-900">{formatIndianCurrency(totalAdditional)}</strong>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Reason
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Minor plumbing repair, Parking pass"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="text"
                  value={formatInputValue(formAmount)}
                  onChange={(e) => setFormAmount(handleIndianNumberInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={format(formDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormDate(new Date(e.target.value || Date.now()))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  {editingIndex !== null ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
