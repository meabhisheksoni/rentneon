'use client'

import React from 'react'
import { format } from 'date-fns'
import { Zap, Calendar } from 'lucide-react'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import { calculateElectricity } from '@/utils/billingCalculations'

interface ElectricityData {
  initialReading: number
  finalReading: number
  multiplier: number
  readingDate: Date
}

interface ElectricityMeterFormProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  data: ElectricityData
  onChange: (data: ElectricityData) => void
}

export const ElectricityMeterForm: React.FC<ElectricityMeterFormProps> = ({
  enabled,
  onToggle,
  data,
  onChange,
}) => {
  const { unitsConsumed, amount } = calculateElectricity({
    initialReading: data.initialReading,
    finalReading: data.finalReading,
    multiplier: data.multiplier,
    enabled,
  })

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-200/80 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Electricity Sub-Meter</h3>
            <p className="text-xs text-gray-500">Track units consumed and monthly power charge</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {enabled && (
        <div className="pt-3 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Initial Reading */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Previous Reading (kWh)
              </label>
              <input
                type="text"
                value={formatInputValue(data.initialReading)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    initialReading: handleIndianNumberInput(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-amber-500 focus:ring-3 focus:ring-amber-100 focus:bg-white transition-all"
                placeholder="0"
              />
            </div>

            {/* Final Reading */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Current Reading (kWh)
              </label>
              <input
                type="text"
                value={formatInputValue(data.finalReading)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    finalReading: handleIndianNumberInput(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-amber-500 focus:ring-3 focus:ring-amber-100 focus:bg-white transition-all"
                placeholder="0"
              />
            </div>

            {/* Multiplier / Unit Rate */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Rate / Unit (₹)
              </label>
              <input
                type="text"
                value={formatInputValue(data.multiplier)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    multiplier: handleIndianNumberInput(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-amber-500 focus:ring-3 focus:ring-amber-100 focus:bg-white transition-all"
                placeholder="9"
              />
            </div>

            {/* Reading Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Reading Date
              </label>
              <input
                type="date"
                value={format(data.readingDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  onChange({
                    ...data,
                    readingDate: new Date(e.target.value || Date.now()),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-amber-500 focus:ring-3 focus:ring-amber-100 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Units & Amount Summary Banner */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-amber-900 font-medium">
              Calculated Units: <strong className="font-extrabold text-amber-950">{unitsConsumed}</strong> kWh ({data.finalReading} - {data.initialReading})
            </span>
            <span className="text-amber-950 font-black text-base">
              Power Charge: {formatIndianCurrency(amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
