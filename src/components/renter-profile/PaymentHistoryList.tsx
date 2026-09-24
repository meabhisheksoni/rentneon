'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, X, CreditCard, Banknote, CheckCircle2 } from 'lucide-react'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import { calculateTotalPayments } from '@/utils/billingCalculations'
import { useToast } from '@/contexts/ToastContext'

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
  const { success, error } = useToast()
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
    if (formAmount <= 0) {
      error('Please enter a valid payment amount.', 'Validation Error')
      return
    }

    const item: PaymentItem = {
      amount: formAmount,
      date: formDate,
      type: formType,
      note: formNote.trim() || undefined,
    }

    if (editingIndex !== null) {
      onUpdatePayment(editingIndex, item)
      success('Payment record updated', 'Updated')
    } else {
      onAddPayment(item)
      success(`Recorded ${formatIndianCurrency(formAmount)} payment!`, 'Payment Recorded')
    }

    setShowModal(false)
  }

  const handleDelete = (index: number) => {
    onDeletePayment(index)
    success('Payment entry removed', 'Deleted')
  }

  const totalPaid = calculateTotalPayments(payments)

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-200/80 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Payments Received</h3>
            <p className="text-xs text-gray-500">Record cash or UPI payment settlements</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-600">No payment settlements recorded for this month yet.</p>
          <p className="text-xs text-gray-400 mt-1">When tenant pays via UPI or Cash, log it here to reduce balance due.</p>
          {pendingAmount > 0 && (
            <button
              onClick={openAddModal}
              className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + Record Payment ({formatIndianCurrency(pendingAmount)})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden bg-white">
            {payments.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl ${
                    p.type === 'online' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {p.type === 'online' ? <CreditCard className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm">
                        {formatIndianCurrency(p.amount)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        p.type === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(p.date), 'dd MMM yyyy')}
                      {p.note ? ` • ${p.note}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(idx, p)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-sm">
            <span className="text-emerald-900 font-bold">Total Paid This Month:</span>
            <span className="text-emerald-950 font-black text-lg">
              {formatIndianCurrency(totalPaid)}
            </span>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-lg">
                {editingIndex !== null ? 'Edit Payment Record' : 'Record Payment Settlement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Payment Amount (₹) *
                </label>
                <input
                  type="text"
                  value={formatInputValue(formAmount)}
                  onChange={(e) => setFormAmount(handleIndianNumberInput(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-extrabold text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Payment Mode
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'cash' | 'online')}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  >
                    <option value="online">Online / UPI</option>
                    <option value="cash">Cash Handover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={format(formDate, 'yyyy-MM-dd')}
                    onChange={(e) => setFormDate(new Date(e.target.value || Date.now()))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  placeholder="e.g. GPay UPI Ref #82910, Cash in envelope"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition-all cursor-pointer"
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
