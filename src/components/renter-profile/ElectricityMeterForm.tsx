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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Electricity Sub-Meter</h3>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {enabled && (
        <div className="pt-2 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Initial Reading */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                placeholder="0"
              />
            </div>

            {/* Final Reading */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                placeholder="0"
              />
            </div>

            {/* Multiplier / Unit Rate */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                placeholder="9"
              />
            </div>

            {/* Reading Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Reading Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={format(data.readingDate, 'yyyy-MM-dd')}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      readingDate: new Date(e.target.value || Date.now()),
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Units & Amount Summary Banner */}
          <div className="bg-amber-50/60 rounded-lg p-3 flex items-center justify-between text-sm">
            <span className="text-amber-800 font-medium">
              Units: <strong className="font-bold">{unitsConsumed}</strong> kWh ({data.finalReading} - {data.initialReading})
            </span>
            <span className="text-amber-900 font-bold text-base">
              Total: {formatIndianCurrency(amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
