'use client'

import { useState } from 'react'
import { X, Calendar, User, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import { SupabaseService } from '@/services/supabaseService'
import { formatInputValue, handleIndianNumberInput } from '@/utils/formatters'

interface AddRenterModalProps {
  onClose: () => void
  onRenterAdded: () => void
}

export default function AddRenterModal({ onClose, onRenterAdded }: AddRenterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    monthlyRent: 0,
    moveInDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || formData.monthlyRent <= 0) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await SupabaseService.insertRenter({
        name: formData.name.trim(),
        email: 'N/A',
        phone: 'N/A',
        property_address: 'N/A',
        monthly_rent: formData.monthlyRent,
        move_in_date: new Date(formData.moveInDate).getTime(),
        is_active: true
      })

      alert('Renter added successfully!')
      onRenterAdded()
    } catch (error) {
      alert(`Error adding renter: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">Add New Renter</h2>
            <p className="text-gray-600 font-medium mt-1">Create a new tenant profile</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Renter Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Renter Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter renter's full name"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Monthly Rent */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Monthly Rent *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="monthlyRent"
                value={formatInputValue(formData.monthlyRent)}
                onChange={(e) => handleIndianNumberInput(e.target.value, (value) => 
                  setFormData(prev => ({ ...prev, monthlyRent: value }))
                )}
                placeholder="Enter monthly rent amount"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Move-in Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Renter'
              )}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
          <p className="text-sm text-blue-700 font-medium">
            <span className="font-bold">Note:</span> You can add more details like contact information and property address later from the renter's profile.
          </p>
        </div>
      </div>
    </div>
  )
}