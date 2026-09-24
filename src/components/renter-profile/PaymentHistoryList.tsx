'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, X, CreditCard, Banknote, CheckCircle2 } from 'lucide-react'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import { calculateTotalPayments } from '@/utils/billingCalculations'

export interface PaymentItem {
  id?: string
  amount: number
  date: Date
  type: 'cash' | 'online'
  note?: string
}

interface PaymentHistoryListProps {
  payments: PaymentItem[]
  pendingAmount: number
  onAddPayment: (payment: PaymentItem) => void
  onUpdatePayment: (index: number, payment: PaymentItem) => void
  onDeletePayment: (index: number) => void
}

export const PaymentHistoryList: React.FC<PaymentHistoryListProps> = ({
  payments,
  pendingAmount,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formAmount, setFormAmount] = useState(0)
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [formType, setFormType] = useState<'cash' | 'online'>('online')
  const [formNote, setFormNote] = useState('')

  const openAddModal = () => {
    setEditingIndex(null)
    setFormAmount(pendingAmount > 0 ? pendingAmount : 0)
    setFormDate(new Date())
    setFormType('online')
    setFormNote('')
    setShowModal(true)
  }

  const openEditModal = (index: number, p: PaymentItem) => {
    setEditingIndex(index)
    setFormAmount(p.amount)
    setFormDate(new Date(p.date))
    setFormType(p.type)
    setFormNote(p.note || '')
    setShowModal(true)
  }

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (formAmount <= 0) return

    const item: PaymentItem = {
      amount: formAmount,
      date: formDate,
      type: formType,
      note: formNote.trim() || undefined,
    }

    if (editingIndex !== null) {
      onUpdatePayment(editingIndex, item)
    } else {
      onAddPayment(item)
    }

    setShowModal(false)
  }

  const totalPaid = calculateTotalPayments(payments)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Payments Received</h3>
            <p className="text-xs text-gray-500">Record cash or UPI payment settlements</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">No payments recorded for this billing cycle yet.</p>
          {pendingAmount > 0 && (
            <button
              onClick={openAddModal}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              + Record Full / Partial Payment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {payments.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    p.type === 'online' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {p.type === 'online' ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatIndianCurrency(p.amount)}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        p.type === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(p.date), 'dd MMM yyyy')}
                      {p.note ? ` • ${p.note}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(idx, p)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeletePayment(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-lg text-sm">
            <span className="text-emerald-800 font-medium">Total Paid This Month:</span>
            <span className="text-emerald-900 font-bold text-base">
              {formatIndianCurrency(totalPaid)}
            </span>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Payment Record' : 'Record Payment Settlement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="text"
                  value={formatInputValue(formAmount)}
                  onChange={(e) => setFormAmount(handleIndianNumberInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mode</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'cash' | 'online')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="online">Online / UPI</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={format(formDate, 'yyyy-MM-dd')}
                    onChange={(e) => setFormDate(new Date(e.target.value || Date.now()))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. GPay UPI ref #8291, Cash handed over"
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
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  {editingIndex !== null ? 'Save Changes' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
