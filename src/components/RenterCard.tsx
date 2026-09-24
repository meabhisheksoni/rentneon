'use client'

import { useState } from 'react'
import { User, MapPin, Calendar, Phone, CheckCircle2, AlertCircle, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { Renter } from '@/types'
import { formatIndianCurrency } from '@/utils/formatters'
import RenterProfile from './RenterProfile'

interface RenterCardProps {
  renter: Renter
  onArchive?: (renterId: string) => void
  onUnarchive?: (renterId: string) => void
  onDelete?: (renterId: string) => void
  onClick?: () => void
}

export default function RenterCard({ renter, onArchive, onUnarchive, onDelete, onClick }: RenterCardProps) {
  const [showProfile, setShowProfile] = useState(false)
  const pendingAmount = Number(renter.total_pending || 0)

  return (
    <>
      <div className="relative">
        <div
          onClick={() => (onClick ? onClick() : setShowProfile(true))}
          className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 group relative flex flex-col justify-between"
        >
          {/* Top Section - Renter Info */}
          <div>
            <div className="flex items-start gap-3.5 mb-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>

              {/* Renter Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {renter.name}
                  </h3>
                  {!renter.is_active && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                      <Archive className="w-3 h-3" />
                      Archived
                    </span>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-gray-400" />
                  <span className="truncate">
                    {renter.property_address && renter.property_address !== 'N/A'
                      ? renter.property_address
                      : 'Address not provided'}
                  </span>
                </div>

                {/* Phone or Move-in Date */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  {renter.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 flex-shrink-0 text-gray-400" />
                      <span>{renter.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0 text-gray-400" />
                    <span>
                      {renter.move_in_date ? format(new Date(renter.move_in_date), 'MMM yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Financial Stats */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {/* Monthly Rent */}
              <div className="bg-emerald-50/70 border border-emerald-100/60 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  Rent
                </p>
                <p className="text-sm font-bold text-emerald-900 truncate">
                  {formatIndianCurrency(renter.monthly_rent)}
                </p>
              </div>

              {/* Pending Amount */}
              <div className={`rounded-xl p-3 text-center border ${
                pendingAmount > 0
                  ? 'bg-red-50/70 border-red-100/60'
                  : 'bg-gray-50/70 border-gray-100'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  pendingAmount > 0 ? 'text-red-700' : 'text-gray-500'
                }`}>
                  Pending
                </p>
                <p className={`text-sm font-bold truncate ${
                  pendingAmount > 0 ? 'text-red-900' : 'text-gray-700'
                }`}>
                  {formatIndianCurrency(pendingAmount)}
                </p>
              </div>

              {/* Live Status */}
              <div className={`rounded-xl p-3 text-center flex flex-col justify-center items-center border ${
                !renter.is_active
                  ? 'bg-slate-50 border-slate-100'
                  : pendingAmount <= 0
                  ? 'bg-emerald-50/70 border-emerald-100/60'
                  : 'bg-amber-50/70 border-amber-100/60'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  !renter.is_active
                    ? 'text-slate-500'
                    : pendingAmount <= 0
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}>
                  Status
                </p>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                  !renter.is_active
                    ? 'bg-slate-200 text-slate-700'
                    : pendingAmount <= 0
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-amber-200 text-amber-800'
                }`}>
                  {pendingAmount <= 0 ? (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Paid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-2.5 h-2.5" />
                      Due
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action prompt */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
            <span>Manage Bills & Settlements</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
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