'use client'

import { useState } from 'react'
import { User, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Renter } from '@/types'
import { formatIndianCurrency } from '@/utils/formatters'
import RenterProfile from './RenterProfile'

interface RenterCardProps {
  renter: Renter
  onArchive?: (renterId: string) => void
  onUnarchive?: (renterId: string) => void
  onDelete?: (renterId: string) => void
}

export default function RenterCard({ renter, onArchive, onUnarchive, onDelete }: RenterCardProps) {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <>
      <div className="relative">
        <div
          onClick={() => setShowProfile(true)}
          className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-200 group relative"
        >
          {/* Top Section - Renter Info */}
          <div className="flex items-start space-x-4 mb-6">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <User className="h-6 w-6 text-white" />
            </div>

            {/* Renter Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 font-poppins mb-2 truncate">
                {renter.name}
              </h3>

              {/* Address - Small & Italic */}
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="italic truncate">
                  {renter.property_address !== 'N/A' ? renter.property_address : 'Address not provided'}
                </span>
              </div>

              {/* Move-in Date - Small & Italic */}
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="italic">
                  Moved in: {format(new Date(renter.move_in_date), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Horizontal Stats */}
          <div className="grid grid-cols-3 gap-4">
            {/* Monthly Rent */}
            <StatCard
              label="MONTHLY RENT"
              value={formatIndianCurrency(renter.monthly_rent)}
              bgColor="bg-green-50"
              textColor="text-green-700"
              labelColor="text-green-600"
            />

            {/* Pending Amount */}
            <StatCard
              label="PENDING"
              value="₹ 0"
              bgColor="bg-gray-50"
              textColor="text-gray-700"
              labelColor="text-gray-600"
            />

            {/* Status */}
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">
                STATUS
              </p>
              <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-orange-200 text-orange-800 rounded-lg">
                Due Today
              </span>
            </div>
          </div>

          {/* Hover Indicator */}
          <div className="mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-blue-600 font-semibold text-center">
              Tap to manage bills and payments →
            </p>
          </div>
        </div>
      </div>

      {showProfile && (
        <RenterProfile
          renter={renter}
          onClose={() => setShowProfile(false)}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
        />
      )}
    </>
  )
}

// Reusable Stat Card Component
interface StatCardProps {
  label: string
  value: string
  bgColor: string
  textColor: string
  labelColor: string
}

function StatCard({ label, value, bgColor, textColor, labelColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-4 text-center`}>
      <p className={`text-xs font-bold ${labelColor} uppercase tracking-wide mb-2`}>
        {label}
      </p>
      <p className={`text-base font-bold ${textColor} font-poppins`}>
        {value}
      </p>
    </div>
  )
}