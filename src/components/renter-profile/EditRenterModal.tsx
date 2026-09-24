'use client'

import React, { useState } from 'react'
import { X, User, Phone, Mail, MapPin, IndianRupee, Calendar } from 'lucide-react'
import { Renter } from '@/types'
import { ApiService } from '@/services/apiService'
import { formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import { useToast } from '@/contexts/ToastContext'

interface EditRenterModalProps {
  renter: Renter
  onClose: () => void
  onRenterUpdated: (updatedRenter: Renter) => void
}

export const EditRenterModal: React.FC<EditRenterModalProps> = ({
  renter,
  onClose,
  onRenterUpdated,
}) => {
  const { success, error } = useToast()
  const [formData, setFormData] = useState({
    name: renter.name || '',
    phone: renter.phone || '',
    email: renter.email || '',
    propertyAddress: renter.property_address || '',
    monthlyRent: renter.monthly_rent || 0,
    moveInDate: renter.move_in_date || '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || formData.monthlyRent <= 0) {
      error('Please provide a valid tenant name and monthly rent.', 'Validation Error')
      return
    }

    setIsLoading(true)
    try {
      const updated = await ApiService.updateRenter(renter.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        property_address: formData.propertyAddress.trim() || null,
        monthly_rent: formData.monthlyRent,
        move_in_date: formData.moveInDate || null,
      })

      success('Tenant details updated successfully!', 'Profile Updated')
      onRenterUpdated(updated)
      onClose()
    } catch (err: unknown) {
      console.error('Error updating renter profile:', err)
      error(err instanceof Error ? err.message : 'Failed to update tenant details', 'Update Error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Edit Tenant Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Update contact details, rent amount, and property unit</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Tenant Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-medium transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Rent */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Monthly Rent (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="monthlyRent"
                  value={formatInputValue(formData.monthlyRent)}
                  onChange={(e) =>
                    handleIndianNumberInput(e.target.value, (value) =>
                      setFormData((prev) => ({ ...prev, monthlyRent: value }))
                    )
                  }
                  placeholder="e.g. 15,000"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-bold transition-all"
                  required
                />
              </div>
            </div>

            {/* Move-in Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Move-in Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Phone Number (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-medium transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Property Unit Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Property Unit / Flat Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleChange}
                placeholder="e.g. Flat 302, Green Heights, Sector 4"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-medium transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
